import { Wifi, WifiOff, Sun, Radio } from 'lucide-react';
interface Props { online: boolean; demo: boolean; setDemo: (v: boolean) => void; forcedOffline: boolean; setForcedOffline: (v: boolean) => void; sun: boolean; setSun: (v: boolean) => void; }
export default function Header({ online, demo, setDemo, forcedOffline, setForcedOffline, sun, setSun }: Props) {
  return <header className="border-b border-zinc-800 bg-[#10151c] sun:bg-black sun:border-yellow-400 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto px-4 md:px-8 min-h-20 flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-400 text-slate-950 font-black text-xl grid place-items-center clip-corner">F</div><div><div className="text-lg md:text-xl font-black tracking-tight text-white sun:text-yellow-400 leading-tight">FIELDGUARD <span className="text-amber-400">//</span></div><div className="text-[10px] tracking-[.24em] font-bold text-zinc-400 sun:text-yellow-400">INDUSTRIAL SAFETY OS</div></div></div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-bold tracking-wider">
        <span role="status" className={`flex items-center gap-2 px-3 py-2 border ${online ? 'border-emerald-700/60 text-emerald-400 bg-emerald-500/10' : 'border-red-500 text-red-400 bg-red-500/10'} sun:border-yellow-400 sun:text-yellow-400`}>{online ? <Wifi size={15}/> : <WifiOff size={15}/>} <span className="w-2 h-2 rounded-full bg-current"/>{online ? 'ONLINE' : 'OFFLINE'}</span>
        <label className="flex items-center gap-2 cursor-pointer border border-zinc-700 px-3 py-2 sun:border-yellow-400 sun:text-yellow-400"><Radio size={14} className="text-amber-400"/> DEMO MODE <input aria-label="Demo mode" type="checkbox" checked={demo} onChange={e => setDemo(e.target.checked)} className="accent-amber-400 w-4 h-4"/></label>
        {demo && <label className="flex items-center gap-2 cursor-pointer border border-zinc-700 px-3 py-2 sun:border-yellow-400 sun:text-yellow-400">FORCE OFFLINE <input aria-label="Force offline" type="checkbox" checked={forcedOffline} onChange={e => setForcedOffline(e.target.checked)} className="accent-amber-400 w-4 h-4"/></label>}
        <label className="flex items-center gap-2 cursor-pointer border border-zinc-700 px-3 py-2 sun:border-yellow-400 sun:text-yellow-400"><Sun size={14} className="text-amber-400"/> SUN MODE <input aria-label="Sun mode" type="checkbox" checked={sun} onChange={e => setSun(e.target.checked)} className="accent-amber-400 w-4 h-4"/></label>
      </div>
    </div>
  </header>;
}
