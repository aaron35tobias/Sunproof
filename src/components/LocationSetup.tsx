import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, Phone, Save, Check, ExternalLink } from 'lucide-react';
import { formatFix, mapsUrl, type GpsState } from '@/hooks/useGeolocation';
import { isValidPhone, type SiteSettings } from '@/site';
interface Props { site: SiteSettings; gps: GpsState; onSave: (site: SiteSettings) => void; }
const gpsTone = { live: 'text-emerald-400', locating: 'text-amber-400', denied: 'text-red-400', unavailable: 'text-red-400' } as const;
export default function LocationSetup({ site, gps, onSave }: Props) {
  const [name, setName] = useState(site.name);
  const [number, setNumber] = useState(site.emergencyNumber);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!saved) return; const id = setTimeout(() => setSaved(false), 3000); return () => clearTimeout(id); }, [saved]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (number.trim() && !isValidPhone(number)) { setError('Enter a valid phone number, e.g. +971501234567.'); return; }
    setError(''); onSave({ name: name.trim(), emergencyNumber: number.trim() }); setSaved(true);
  }
  const title = gps.status === 'live' ? 'LIVE GPS' : gps.status === 'denied' ? 'GPS PERMISSION DENIED' : gps.fix ? 'LAST KNOWN GPS' : gps.status === 'unavailable' ? 'GPS UNAVAILABLE' : 'ACQUIRING GPS…';
  return <div className="max-w-3xl mx-auto space-y-6"><div><p className="eyebrow">FIELD SETUP / WORK PLACE</p><h1 className="page-title">Location<span className="text-amber-400">.</span></h1><p className="text-zinc-400 sun:text-yellow-400 mt-2">Name the place you're working. It merges with live GPS on every report, inspection and SOS.</p></div>
    <section className="panel p-5 md:p-6 flex flex-wrap items-center gap-4" aria-live="polite"><MapPin className={`shrink-0 ${gpsTone[gps.status]} sun:text-yellow-400`} size={26}/><div className="flex-1 min-w-0"><p className="font-bold text-white sun:text-yellow-400">{title}</p>{gps.fix ? <p className="font-mono text-sm text-zinc-300 sun:text-yellow-400 mt-1 break-words">{formatFix(gps.fix)}{gps.status !== 'live' && <span className="text-zinc-500 sun:text-yellow-400"> · {new Date(gps.fix.at).toLocaleString()}</span>}</p> : <p className="text-sm text-zinc-400 sun:text-yellow-400 mt-1">{gps.status === 'denied' ? 'Allow location access in your browser settings. Reports will use the work place name only.' : gps.status === 'unavailable' ? 'This device could not provide a position. Reports will use the work place name only.' : 'Waiting for the first satellite fix…'}</p>}</div>{gps.fix && <a href={mapsUrl(gps.fix.lat, gps.fix.lon)} target="_blank" rel="noreferrer" className="secondary-button flex items-center gap-2"><ExternalLink size={16}/> GOOGLE MAPS</a>}</section>
    <form onSubmit={submit} className="panel p-5 md:p-8 space-y-6"><div><label htmlFor="site-name" className="eyebrow block mb-3">WORK PLACE NAME</label><input id="site-name" className="field-input w-full" value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="e.g. North Warehouse, Rig 7, Site B — Refinery"/><p className="text-xs text-zinc-500 sun:text-yellow-400 mt-2">Used as the location label on every report you submit from this device.</p></div><div className="border-t border-zinc-700 sun:border-yellow-400"/><div><label htmlFor="emergency-number" className="eyebrow flex items-center gap-2 mb-3"><Phone size={15}/> EMERGENCY CONTACT NUMBER</label><input id="emergency-number" type="tel" inputMode="tel" autoComplete="tel" className="field-input w-full" value={number} maxLength={24} onChange={e => setNumber(e.target.value)} placeholder="e.g. +971501234567"/><p className="text-xs text-zinc-500 sun:text-yellow-400 mt-2">Pressing the SOS button will dial this number through your phone's SIM — even when Wi-Fi is down.</p></div>{error && <p role="alert" className="text-red-400 text-sm">{error}</p>}<button type="submit" className="action-button w-full min-h-16 text-base flex items-center justify-center gap-3">{saved ? <><Check size={20}/> LOCATION SETUP SAVED</> : <><Save size={20}/> SAVE LOCATION SETUP</>}</button></form>
  </div>;
}
