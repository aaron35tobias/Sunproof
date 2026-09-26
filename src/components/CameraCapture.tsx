import { useEffect, useRef, useState } from 'react';
import { Camera, SwitchCamera, X, ImageUp } from 'lucide-react';
interface Props { onCapture: (video: HTMLVideoElement) => Promise<void>; onClose: () => void; onUploadInstead: () => void; }
function cameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera permission was blocked. Allow camera access in your browser settings, or upload a photo instead.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. Upload a photo instead.';
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again, or upload a photo instead.';
  return 'The camera could not be started. Upload a photo instead.';
}
export default function CameraCapture({ onCapture, onClose, onUploadInstead }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [canSwitch, setCanSwitch] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setReady(false); setError('');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(async s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCanSwitch(devices.filter(d => d.kind === 'videoinput').length > 1);
      })
      .catch(err => { if (!cancelled) setError(cameraError(err)); });
    return () => { cancelled = true; stream?.getTracks().forEach(t => t.stop()); };
  }, [facing]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); void capture(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); });
  async function capture() {
    if (!video.current || !ready || busy) return;
    setBusy(true);
    try { await onCapture(video.current); } catch (err) { setError(err instanceof Error ? err.message : 'Could not take the photo.'); setBusy(false); }
  }
  return <div role="dialog" aria-modal="true" aria-label="Camera" className="fixed inset-0 h-dvh z-50 bg-black flex flex-col">
    <div className="shrink-0 flex items-center justify-between p-4 border-b border-zinc-800 sun:border-yellow-400"><p className="eyebrow">FIELD CAMERA / PHOTO EVIDENCE <span className="hidden md:inline text-zinc-500 sun:text-yellow-400">· SPACE TO CAPTURE</span></p><button aria-label="Close camera" onClick={onClose} className="p-2 border border-zinc-600 text-white sun:border-yellow-400 sun:text-yellow-400"><X/></button></div>
    {/* The video is absolutely positioned so its natural size can never push the shutter bar off-screen. */}
    <div className="flex-1 min-h-0 relative overflow-hidden grid place-items-center">
      {error ? <div className="max-w-md p-6 text-center space-y-5"><Camera className="mx-auto text-amber-400" size={40}/><p className="text-zinc-200 sun:text-yellow-400">{error}</p><button onClick={onUploadInstead} className="action-button inline-flex items-center gap-2"><ImageUp size={18}/> UPLOAD A PHOTO</button></div>
        : <><video ref={video} playsInline muted autoPlay onPlaying={() => setReady(true)} className={`absolute inset-0 w-full h-full object-contain ${facing === 'user' ? '-scale-x-100' : ''}`}/>{!ready && <p className="relative text-amber-400 font-bold tracking-wider">STARTING CAMERA…</p>}</>}
    </div>
    {!error && <div className="shrink-0 grid grid-cols-3 items-center bg-black p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-zinc-800 sun:border-yellow-400">
      <button onClick={onUploadInstead} className="justify-self-start flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-300 sun:text-yellow-400"><ImageUp size={24}/> UPLOAD</button>
      <button onClick={capture} disabled={!ready || busy} aria-label="Take photo" className="justify-self-center w-20 h-20 rounded-full border-4 border-white bg-amber-400 hover:bg-yellow-300 sun:border-yellow-400 grid place-items-center"><Camera size={30} className="text-slate-950"/></button>
      {canSwitch ? <button onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')} className="justify-self-end flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-300 sun:text-yellow-400"><SwitchCamera size={24}/> SWITCH</button> : <span/>}
    </div>}
  </div>;
}
