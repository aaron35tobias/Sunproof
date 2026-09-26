import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Flame, Zap, HardHat, FlaskConical, Building2, CircleHelp, ArrowLeft, ArrowRight, MapPin, Camera, ImageUp, Trash2, Mic, Check, AlertTriangle } from 'lucide-react';
import type { HazardReport, HazardType, Severity } from '@/types';
import CameraCapture from '@/components/CameraCapture';
import { stampPhoto, stampPhotoFile } from '@/lib/photo';
interface Props { onSubmit: (report: HazardReport, photo?: Blob) => Promise<boolean>; onDone: () => void; siteName: string; gpsText: string; }
const types = [{ value: 'FIRE', label: 'FIRE', icon: Flame }, { value: 'ELECTRICAL', label: 'ELECTRICAL', icon: Zap }, { value: 'PPE', label: 'PPE BREACH', icon: HardHat }, { value: 'SPILL', label: 'CHEMICAL SPILL', icon: FlaskConical }, { value: 'STRUCTURAL', label: 'STRUCTURAL', icon: Building2 }, { value: 'OTHER', label: 'OTHER', icon: CircleHelp }] as const;
const levels = [{ value: 'LOW', detail: 'Minor risk · monitor', color: 'border-emerald-500 text-emerald-400' }, { value: 'MEDIUM', detail: 'Action needed soon', color: 'border-yellow-400 text-yellow-400' }, { value: 'HIGH', detail: 'Immediate attention', color: 'border-orange-500 text-orange-400' }, { value: 'CRITICAL', detail: 'Imminent danger', color: 'border-red-500 text-red-400' }] as const;
export default function RapidHazardFlow({ onSubmit, onDone, siteName, gpsText }: Props) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<Blob | undefined>();
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<'synced' | 'local' | null>(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [started] = useState(() => new Date().toISOString());
  // Release the previous preview's object URL when it is replaced or the flow closes.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const uploadInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const stampLines = () => [`FIELDGUARD // ${siteName}`.toUpperCase(), `${new Date().toLocaleString()} · ${gpsText}`];
  function attachPhoto(blob: Blob) { setPhoto(blob); setPreview(URL.createObjectURL(blob)); setPhotoError(''); }
  // Live in-page camera where supported; otherwise hand off to the phone's camera app.
  function openCamera() { setPhotoError(''); if (typeof navigator.mediaDevices?.getUserMedia === 'function') setCameraOpen(true); else captureInput.current?.click(); }
  async function captureFrame(video: HTMLVideoElement) { attachPhoto(await stampPhoto(video, video.videoWidth, video.videoHeight, stampLines())); setCameraOpen(false); }
  async function choosePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { attachPhoto(await stampPhotoFile(file, stampLines())); } catch (err) { setPhotoError(err instanceof Error ? err.message : 'Could not use that photo.'); }
  }
  function removePhoto() { setPhoto(undefined); setPreview(''); }
  function voice() {
    const Speech = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!Speech) { setVoiceError('Voice input is unavailable in this browser. Type your note instead.'); return; }
    const recognition = new Speech(); recognition.lang = 'en-US'; recognition.onresult = (event: any) => { const text = event.results[0][0].transcript; setNotes(prev => `${prev}${prev ? ' ' : ''}${text}`); }; recognition.onerror = () => { setVoiceError('Microphone unavailable. Type your note instead.'); setListening(false); }; recognition.onend = () => setListening(false); setVoiceError(''); setListening(true); recognition.start();
  }
  async function submit() {
    if (!type || !severity || saving) return;
    setSaving(true); setError('');
    const report: HazardReport = { id: crypto.randomUUID(), type, severity, location: `${siteName} · ${gpsText}`, timestamp: started, notes: notes.trim(), photoUrl: photo ? 'local-photo:pending' : '', status: 'PENDING' };
    try { const synced = await onSubmit(report, photo); setResult(synced ? 'synced' : 'local'); setStep(4); } catch (err) { setError(err instanceof Error ? err.message : 'Could not save report. Try again.'); } finally { setSaving(false); }
  }
  return <div className="max-w-4xl mx-auto space-y-6"><div><p className="eyebrow">RAPID RESPONSE / FIELD REPORT</p><h1 className="page-title">Report hazard<span className="text-amber-400">.</span></h1><p className="text-zinc-400 sun:text-yellow-400 mt-2">A fast, reliable report — even without a connection.</p></div><div className="flex gap-1.5" aria-label={`Step ${Math.min(step + 1, 4)} of 4`}>{[0,1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 ${i <= step ? 'bg-amber-400' : 'bg-zinc-700'}`}/>)}</div>
    {step === 0 && <section className="space-y-4"><p className="eyebrow">01 / IDENTIFY THE HAZARD</p><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{types.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => { setType(value); setStep(1); }} className="panel min-h-36 md:min-h-40 p-5 text-left flex flex-col justify-between hover:border-amber-400 transition-colors sun:border-yellow-400"><Icon className="text-amber-400" size={31}/><span className="font-black text-base md:text-lg">{label} <span className="text-amber-400">↗</span></span></button>)}</div></section>}
    {step === 1 && <section className="space-y-4"><p className="eyebrow">02 / ASSESS SEVERITY · {type}</p><div className="grid sm:grid-cols-2 gap-3">{levels.map(({ value, detail, color }) => <button key={value} onClick={() => { setSeverity(value); setStep(2); }} className={`panel min-h-28 p-5 text-left border-2 hover:bg-zinc-800 transition-colors ${color} sun:border-yellow-400 sun:text-yellow-400`}><span className="block text-2xl font-black">{value}</span><span className="block text-sm mt-2 text-zinc-300 sun:text-yellow-400">{detail}</span></button>)}</div></section>}
    {step === 2 && <section className="panel p-5 md:p-8 space-y-5"><p className="eyebrow">03 / CAPTURE CONTEXT</p><div className="border border-zinc-700 p-4 text-sm flex gap-3 items-center sun:border-yellow-400"><MapPin className="text-amber-400 shrink-0"/><div><b>AUTO LOCATION · LIVE GPS</b><p className="text-zinc-400 sun:text-yellow-400 mt-1 break-words">{siteName} · {gpsText}</p><p className="text-zinc-400 sun:text-yellow-400">{new Date(started).toLocaleString()}</p></div></div><div><label htmlFor="hazard-notes" className="eyebrow block mb-2">FIELD NOTES / OPTIONAL</label><textarea id="hazard-notes" value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} placeholder="Describe what happened or what you observed…" className="field-input w-full min-h-28 resize-y"/><button type="button" onClick={voice} disabled={listening} className="secondary-button mt-2 flex items-center gap-2"><Mic size={17}/>{listening ? 'LISTENING…' : 'DICTATE NOTE'}</button>{voiceError && <p role="status" className="text-amber-400 text-xs mt-2">{voiceError}</p>}</div><div><p className="eyebrow mb-2">PHOTO EVIDENCE / OPTIONAL</p><div className="flex flex-wrap gap-2"><button type="button" onClick={openCamera} className="secondary-button flex items-center gap-2"><Camera size={17}/>{photo ? 'RETAKE PHOTO' : 'TAKE PHOTO'}</button><button type="button" onClick={() => uploadInput.current?.click()} className="secondary-button flex items-center gap-2"><ImageUp size={17}/> UPLOAD PHOTO</button>{photo && <button type="button" onClick={removePhoto} className="secondary-button flex items-center gap-2"><Trash2 size={17}/> REMOVE</button>}</div>{photoError && <p role="alert" className="text-red-400 text-sm mt-2">{photoError}</p>}{preview && <img src={preview} alt="Hazard photo preview" className="mt-3 w-full max-w-md border border-amber-400"/>}<p className="text-xs text-zinc-500 sun:text-yellow-400 mt-2">Photos are stamped with the work place, time and GPS, and saved on this device until synced.</p></div><button onClick={() => setStep(3)} className="action-button w-full flex justify-center items-center gap-2">REVIEW REPORT <ArrowRight size={18}/></button></section>}
    {step === 3 && <section className="panel p-5 md:p-8 space-y-5"><p className="eyebrow">04 / CONFIRM & TRANSMIT</p><h2 className="text-2xl font-black">Review your report</h2><div className="grid sm:grid-cols-2 gap-3 text-sm">{[['HAZARD', type], ['SEVERITY', severity], ['LOCATION', `${siteName} · ${gpsText}`], ['TIME', new Date(started).toLocaleString()], ['NOTES', notes || 'None'], ['PHOTO', photo ? 'Attached' : 'None']].map(([label, value]) => <div key={label} className="border border-zinc-700 p-4 sun:border-yellow-400"><p className="eyebrow">{label}</p><p className="mt-2 break-words font-semibold">{value}</p></div>)}</div>{error && <p role="alert" className="text-red-400">{error}</p>}<button onClick={submit} disabled={saving} className="action-button w-full min-h-20 text-xl md:text-2xl font-black flex items-center justify-center gap-3"><AlertTriangle size={26}/>{saving ? 'SECURING REPORT…' : 'EXECUTE SUBMISSION'}</button></section>}
    {step === 4 && <section role="status" className="panel p-8 md:p-12 text-center"><Check className="text-amber-400 mx-auto mb-5" size={54}/><h2 className="text-2xl md:text-3xl font-black text-amber-400">{result === 'synced' ? 'REPORT SYNCHRONIZED' : 'SAVED LOCALLY // SYNC PENDING'}</h2><p className="text-zinc-400 sun:text-yellow-400 mt-3">{result === 'synced' ? 'Your report is available to supervisors.' : 'Your report is secure on this device and will sync when connected.'}</p><button className="secondary-button mt-8" onClick={onDone}>RETURN TO COMMAND CENTER</button></section>}
    {step > 0 && step < 4 && <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-zinc-400 sun:text-yellow-400 hover:text-white py-3"><ArrowLeft size={16}/> BACK A STEP</button>}
    <input ref={uploadInput} type="file" accept="image/*" hidden onChange={choosePhoto}/>
    <input ref={captureInput} type="file" accept="image/*" capture="environment" hidden onChange={choosePhoto}/>
    {cameraOpen && <CameraCapture onCapture={captureFrame} onClose={() => setCameraOpen(false)} onUploadInstead={() => { setCameraOpen(false); uploadInput.current?.click(); }}/>}
  </div>;
}
