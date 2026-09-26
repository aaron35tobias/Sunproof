import { useCallback, useEffect, useRef, useState } from 'react';
import { Home, AlertTriangle, ClipboardCheck, MapPin, CloudUpload, ThermometerSun, ShieldCheck } from 'lucide-react';
import { base44, onRemoteChange } from '@/api/base44Client';
import Header from '@/components/Header';
import CommandCenter from '@/components/CommandCenter';
import RapidHazardFlow from '@/components/RapidHazardFlow';
import SyncQueue from '@/components/SyncQueue';
import HeatFatigueCheckin from '@/components/HeatFatigueCheckin';
import SupervisorDashboard from '@/components/SupervisorDashboard';
import InspectionFlow from '@/components/InspectionFlow';
import SupervisorLogin from '@/components/SupervisorLogin';
import { isSupervisorSignedIn, setSupervisorSignedIn } from '@/auth';
import LocationSetup from '@/components/LocationSetup';
import { describeGps, useGeolocation } from '@/hooks/useGeolocation';
import { DEFAULT_SITE_NAME, loadSite, saveSite, type SiteSettings } from '@/site';
import { clearSyncedReports, getLocalReports, getPhoto, initDB, savePhoto, saveReportLocal, updateReportStatus } from '@/db/indexedDB';
import type { HazardReport, SupervisorIncident, View, WorkerState } from '@/types';
const tabs = [{ view: 'home', label: 'COMMAND', icon: Home }, { view: 'hazard', label: 'REPORT', icon: AlertTriangle }, { view: 'inspection', label: 'INSPECT', icon: ClipboardCheck }, { view: 'location', label: 'LOCATION', icon: MapPin }, { view: 'queue', label: 'SYNC QUEUE', icon: CloudUpload }, { view: 'heat', label: 'HEAT CHECK', icon: ThermometerSun }, { view: 'supervisor', label: 'SUPERVISOR', icon: ShieldCheck }] as const;
const initialWorker: WorkerState = { thermalStatus: 'NORMAL', lastCheckin: null, activeZone: DEFAULT_SITE_NAME };
function asIncident(r: HazardReport & Record<string, any>): SupervisorIncident {
  return { id: r.client_id || r.id, remoteId: r.client_id ? r.id : undefined, type: r.type, severity: r.severity, location: r.location, timestamp: r.timestamp, notes: r.notes, photoUrl: r.photo_url || r.photoUrl || '', status: r.client_id ? 'SYNCHRONIZED' : r.status, isSos: r.is_sos || r.isSos, latitude: r.latitude ?? null, longitude: r.longitude ?? null, assignedCrew: r.assigned_crew || r.assignedCrew || '', resolved: !!r.resolved };
}
export default function FieldguardApp() {
  const [view, setView] = useState<View>('home');
  const [network, setNetwork] = useState(navigator.onLine);
  const [demo, setDemo] = useState(false);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [sun, setSun] = useState(() => localStorage.getItem('fieldguard_sun') === 'true');
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [remote, setRemote] = useState<SupervisorIncident[]>([]);
  const [inspections, setInspections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [worker, setWorker] = useState<WorkerState>(() => { try { return JSON.parse(localStorage.getItem('fieldguard_worker') || 'null') || initialWorker; } catch { return initialWorker; } });
  const [shiftStart] = useState(() => { const value = Number(sessionStorage.getItem('fieldguard_shift')); if (value) return value; const now = Date.now(); sessionStorage.setItem('fieldguard_shift', String(now)); return now; });
  const [supervisor, setSupervisor] = useState(isSupervisorSignedIn);
  const [site, setSite] = useState<SiteSettings>(loadSite);
  const gps = useGeolocation();
  const syncLock = useRef<Promise<void> | null>(null);
  const online = network && !(demo && forcedOffline);
  const siteName = site.name || DEFAULT_SITE_NAME;
  const gpsText = describeGps(gps);
  // Work place name merged with the latest GPS fix, stamped on every report, inspection and SOS.
  function currentPlace() { return { location: `${siteName} · ${gpsText}`, latitude: gps.fix?.lat ?? null, longitude: gps.fix?.lon ?? null }; }
  const refreshLocal = useCallback(async () => { setReports((await getLocalReports()).sort((a, b) => b.timestamp.localeCompare(a.timestamp))); }, []);
  const refreshRemote = useCallback(async () => { const [items, checks] = await Promise.all([base44.entities.SafetyReport.list('-created_date', 500), base44.entities.SafetyInspection.list('-created_date', 500)]); setRemote(items.map(asIncident)); setInspections(checks.length); }, []);
  useEffect(() => { const up = () => setNetwork(true); const down = () => setNetwork(false); window.addEventListener('online', up); window.addEventListener('offline', down); return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); }; }, []);
  useEffect(() => { document.documentElement.classList.toggle('sun', sun); localStorage.setItem('fieldguard_sun', String(sun)); return () => document.documentElement.classList.remove('sun'); }, [sun]);
  useEffect(() => { let active = true; (async () => { try { await initDB(); if (active) await refreshLocal(); if (active && online) await refreshRemote(); } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Could not load safety data.'); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, []);
  // Live incident stream: pick up reports synced from other open tabs/devices sharing this backend.
  useEffect(() => onRemoteChange(() => { if (online) refreshRemote().catch(() => {}); }), [online, refreshRemote]);
  const sync = useCallback(async (failedOnly = false) => {
    if (!online) { setError('Offline: reports remain safe on this device until connection returns.'); return; }
    // Loop so that several callers waiting on the same sync never start in parallel afterwards.
    while (syncLock.current) await syncLock.current;
    const task = (async () => {
      setSyncing(true); setError('');
      const local = await getLocalReports();
      for (const report of local.filter(r => failedOnly ? r.status === 'FAILED' : r.status !== 'SYNCHRONIZED')) {
        try {
          await updateReportStatus(report.id, 'SYNCING'); await refreshLocal();
          const existing = await base44.entities.SafetyReport.filter({ client_id: report.id });
          if (!existing.length) {
            let photoUrl = '';
            if (report.photoUrl.startsWith('local-photo:')) {
              const photo = await getPhoto(report.id);
              if (photo) { const file = new File([photo], `fieldguard-${report.id}.jpg`, { type: 'image/jpeg' }); const result = await base44.integrations.Core.UploadPublicFile({ file }); photoUrl = result.file_url; }
            }
            await base44.entities.SafetyReport.create({ client_id: report.id, type: report.type, severity: report.severity, location: report.location, timestamp: report.timestamp, notes: report.notes, photo_url: photoUrl, latitude: report.latitude ?? null, longitude: report.longitude ?? null, assigned_crew: '', resolved: false, is_sos: !!report.isSos });
          }
          await updateReportStatus(report.id, 'SYNCHRONIZED');
        } catch (err) { await updateReportStatus(report.id, 'FAILED'); setError(err instanceof Error ? `Sync failed: ${err.message}` : 'Sync failed. Retry from the queue.'); }
      }
      await refreshLocal();
      try { await refreshRemote(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not refresh incident stream.'); }
    })().finally(() => { setSyncing(false); syncLock.current = null; });
    syncLock.current = task; await task;
  }, [online, refreshLocal, refreshRemote]);
  useEffect(() => { if (online && !loading) void sync(); }, [online, loading]);
  async function submitReport(report: HazardReport, photo?: Blob): Promise<boolean> {
    Object.assign(report, currentPlace());
    if (photo) { await savePhoto(report.id, photo); report.photoUrl = `local-photo:${report.id}`; }
    await saveReportLocal(report); await refreshLocal();
    if (online) await sync();
    return (await getLocalReports()).find(r => r.id === report.id)?.status === 'SYNCHRONIZED';
  }
  async function sos() { const report: HazardReport = { id: crypto.randomUUID(), type: 'OTHER', severity: 'CRITICAL', ...currentPlace(), timestamp: new Date().toISOString(), notes: 'EMERGENCY SOS — worker requires immediate assistance. Contact emergency services directly.', photoUrl: '', status: 'PENDING', isSos: true }; await saveReportLocal(report); await refreshLocal(); if (online) void sync(); }
  async function clear() { await clearSyncedReports(); await refreshLocal(); }
  function checkin(thermalStatus: WorkerState['thermalStatus']) { const next = { thermalStatus, lastCheckin: new Date().toISOString(), activeZone: siteName }; setWorker(next); localStorage.setItem('fieldguard_worker', JSON.stringify(next)); }
  async function saveInspection(values: Record<string, boolean>) { await base44.entities.SafetyInspection.create({ checked_at: new Date().toISOString(), sector: siteName, ...currentPlace(), ...values }); await refreshRemote(); }
  async function updateIncident(incident: SupervisorIncident, patch: { assigned_crew?: string; resolved?: boolean }) { if (!online || !incident.remoteId) throw new Error('Connect and sync this incident before updating it.'); await base44.entities.SafetyReport.update(incident.remoteId, patch); await refreshRemote(); }
  const incidents = [...remote, ...reports.filter(r => !remote.some(i => i.id === r.id)).map(r => asIncident(r))];
  const pending = reports.filter(r => r.status !== 'SYNCHRONIZED').length;
  function navigate(v: View) { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function signInSupervisor(signedIn: boolean) { setSupervisorSignedIn(signedIn); setSupervisor(signedIn); }
  function updateSite(next: SiteSettings) { saveSite(next); setSite(next); }
  return <div className="min-h-screen bg-[#0c1117] text-zinc-100 sun:bg-black sun:text-yellow-400 font-sans"><Header online={online} demo={demo} setDemo={v => { setDemo(v); if (!v) setForcedOffline(false); }} forcedOffline={forcedOffline} setForcedOffline={setForcedOffline} sun={sun} setSun={setSun}/><div className="max-w-7xl mx-auto md:grid md:grid-cols-[205px_1fr] min-h-[calc(100vh-80px)]"><nav aria-label="Main navigation" className="hidden md:flex flex-col border-r border-zinc-800 sun:border-yellow-400 py-7 px-3 gap-1"><p className="eyebrow px-3 mb-4">NAVIGATION / 07</p>{tabs.map(({ view: tab, label, icon: Icon }) => <button key={tab} onClick={() => navigate(tab)} aria-current={view === tab ? 'page' : undefined} className={`flex items-center gap-3 text-left px-3 py-3 text-xs font-bold tracking-wider border-l-2 transition-colors ${view === tab ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'} sun:border-yellow-400 sun:text-yellow-400`}><Icon size={17}/>{label}{tab === 'queue' && pending > 0 && <span className="ml-auto text-amber-400">{pending}</span>}</button>)}<div className="mt-auto p-3 text-[11px] text-zinc-500 sun:text-yellow-400 leading-relaxed border-t border-zinc-800 sun:border-yellow-400">FG / 01<br/>SAFETY IS THE SYSTEM.</div></nav><main className="min-w-0 p-4 pt-8 md:p-8 lg:p-10 pb-28 md:pb-10">{loading ? <div className="panel p-10 text-amber-400">Initializing field systems…</div> : <>{view === 'home' && <CommandCenter navigate={navigate} queueCount={pending} shiftStart={shiftStart} online={online} siteName={siteName} gpsText={gpsText}/>}{view === 'hazard' && <RapidHazardFlow onSubmit={submitReport} onDone={() => navigate('home')} siteName={siteName} gpsText={gpsText}/>}{view === 'inspection' && <InspectionFlow onSave={saveInspection} online={online} siteName={siteName}/>}{view === 'location' && <LocationSetup site={site} gps={gps} onSave={updateSite}/>}{view === 'queue' && <SyncQueue reports={reports} online={online} syncing={syncing} onSync={sync} onClear={clear} error={error}/>}{view === 'heat' && <HeatFatigueCheckin state={worker} onCheckin={checkin} onSos={sos} emergencyNumber={site.emergencyNumber} onSetup={() => navigate('location')}/>}{view === 'supervisor' && (supervisor ? <SupervisorDashboard incidents={incidents} inspections={inspections} pending={pending} loading={loading} online={online} onUpdate={updateIncident} onSignOut={() => signInSupervisor(false)}/> : <SupervisorLogin onSuccess={() => signInSupervisor(true)}/>)}</>}</main></div><nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#10151c] border-t border-zinc-700 sun:bg-black sun:border-yellow-400 grid grid-cols-7 pb-[env(safe-area-inset-bottom)]">{tabs.map(({ view: tab, label, icon: Icon }) => <button key={tab} aria-label={label} aria-current={view === tab ? 'page' : undefined} onClick={() => navigate(tab)} className={`min-h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold tracking-tight ${view === tab ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400'} sun:text-yellow-400`}><Icon size={20}/><span>{label === 'SYNC QUEUE' ? 'QUEUE' : label === 'SUPERVISOR' ? 'LEAD' : label === 'HEAT CHECK' ? 'HEAT' : label === 'LOCATION' ? 'SITE' : label}</span></button>)}</nav></div>;
}
