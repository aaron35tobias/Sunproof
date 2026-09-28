import { useState, type FormEvent } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, ListChecks } from 'lucide-react';
import type { Checkpoint } from '@/types';
import { DEFAULT_CHECKPOINTS, MAX_CHECKPOINT_LENGTH } from '@/checkpoints';
interface Props { checkpoints: Checkpoint[]; online: boolean; onSave: (checkpoints: Checkpoint[]) => Promise<void>; }
export default function CheckpointManager({ checkpoints, online, onSave }: Props) {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  // Deleting takes two taps so a checkpoint is never removed by accident.
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  async function save(next: Checkpoint[], message: string) {
    setBusy(true); setError(''); setStatus('');
    try { await onSave(next); setStatus(message); setConfirmDelete(null); return true; } catch (err) { setError(err instanceof Error ? err.message : 'Could not save checkpoints.'); return false; } finally { setBusy(false); }
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    const text = label.trim().replace(/\s+/g, ' ');
    if (!text) return;
    if (checkpoints.some(c => c.label.toLowerCase() === text.toLowerCase())) { setError('That checkpoint is already on the list.'); return; }
    if (await save([...checkpoints, { id: crypto.randomUUID(), label: text }], 'Checkpoint added. Workers will see it on their next inspection.')) setLabel('');
  }
  function remove(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    void save(checkpoints.filter(c => c.id !== id), 'Checkpoint deleted.');
  }
  function move(index: number, by: number) {
    const next = [...checkpoints];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    void save(next, 'Order updated.');
  }
  const locked = busy || !online;
  return <section className="space-y-5"><div><h2 className="text-xl font-bold">Inspection checkpoints</h2><p className="text-xs text-zinc-400 sun:text-yellow-400 mt-1">These appear in every worker's pre-shift inspection. Changes apply to the next inspection started.</p></div>
    {!online && <div role="status" className="border border-amber-400/70 text-amber-400 p-4 text-sm">Offline — connect to a network to change checkpoints.</div>}
    <form onSubmit={add} className="panel p-5 space-y-3"><label htmlFor="new-checkpoint" className="eyebrow block">ADD A CHECKPOINT</label><div className="flex flex-col sm:flex-row gap-2"><input id="new-checkpoint" className="field-input flex-1 min-w-0" value={label} maxLength={MAX_CHECKPOINT_LENGTH} onChange={e => { setLabel(e.target.value); setError(''); }} placeholder="e.g. Fire extinguisher present and in date" disabled={!online}/><button type="submit" className="action-button flex items-center justify-center gap-2" disabled={locked || !label.trim()}><Plus size={18}/> ADD CHECKPOINT</button></div></form>
    {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    {status && <p role="status" className="text-emerald-400 text-sm sun:text-yellow-400">{status}</p>}
    {checkpoints.length ? <ol className="space-y-2">{checkpoints.map((c, i) => <li key={c.id} className="panel p-4 flex items-center gap-3"><span className="font-mono text-amber-400 text-sm w-7 shrink-0">{String(i + 1).padStart(2, '0')}</span><span className="flex-1 min-w-0 break-words font-medium">{c.label}</span><div className="flex items-center gap-1 shrink-0"><button type="button" aria-label={`Move "${c.label}" up`} disabled={locked || i === 0} onClick={() => move(i, -1)} className="p-2 border border-zinc-700 hover:border-amber-400 sun:border-yellow-400"><ArrowUp size={16}/></button><button type="button" aria-label={`Move "${c.label}" down`} disabled={locked || i === checkpoints.length - 1} onClick={() => move(i, 1)} className="p-2 border border-zinc-700 hover:border-amber-400 sun:border-yellow-400"><ArrowDown size={16}/></button><button type="button" aria-label={`Delete "${c.label}"`} disabled={locked} onClick={() => remove(c.id)} onBlur={() => setConfirmDelete(d => d === c.id ? null : d)} className={`flex items-center gap-1 p-2 border text-xs font-bold ${confirmDelete === c.id ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-zinc-700 hover:border-red-500 hover:text-red-400'} sun:border-yellow-400 sun:text-yellow-400`}><Trash2 size={16}/>{confirmDelete === c.id && 'CONFIRM'}</button></div></li>)}</ol>
      : <div className="panel p-10 text-center"><ListChecks className="mx-auto text-amber-400 mb-3" size={36}/><p className="font-bold">No checkpoints</p><p className="text-zinc-400 sun:text-yellow-400 text-sm mt-1">Workers can't submit an inspection until at least one checkpoint is added.</p></div>}
    <button type="button" className="secondary-button flex items-center gap-2" disabled={locked} onClick={() => { if (window.confirm('Replace the current list with the 4 default checkpoints?')) void save(DEFAULT_CHECKPOINTS, 'Default checkpoints restored.'); }}><RotateCcw size={16}/> RESTORE DEFAULT CHECKPOINTS</button>
  </section>;
}
