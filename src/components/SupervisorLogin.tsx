import { useState, type FormEvent } from 'react';
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { checkSupervisorLogin, supervisorLoginConfigured } from '@/auth';
interface Props { onSuccess: () => void; }
export default function SupervisorLogin({ onSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(supervisorLoginConfigured ? '' : 'Supervisor sign-in is not configured. Copy .env.example to .env, set the credentials, and restart the app.');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supervisorLoginConfigured || checking) return;
    setChecking(true);
    try {
      if (await checkSupervisorLogin(username, password)) { setError(''); onSuccess(); return; }
      setError('Incorrect username or password.'); setPassword('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.'); } finally { setChecking(false); }
  }
  return <div className="max-w-md mx-auto space-y-6"><div><p className="eyebrow">SUPERVISOR / RESTRICTED ACCESS</p><h1 className="page-title">Supervisor sign-in</h1><p className="text-zinc-400 sun:text-yellow-400 mt-2">Incident command is limited to site supervisors.</p></div><form onSubmit={submit} className="panel p-6 space-y-5"><div className="flex items-center gap-3 border border-zinc-700 p-4 text-sm sun:border-yellow-400"><Lock className="text-amber-400 shrink-0" size={20}/><span>Sign in to review incidents and dispatch crews.</span></div><div><label htmlFor="supervisor-username" className="eyebrow block mb-2">USERNAME</label><input id="supervisor-username" className="field-input w-full" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus required/></div><div><label htmlFor="supervisor-password" className="eyebrow block mb-2">PASSWORD</label><div className="flex"><input id="supervisor-password" type={showPassword ? 'text' : 'password'} className="field-input flex-1 min-w-0" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="border border-l-0 border-zinc-700 px-4 text-zinc-400 hover:text-amber-400 sun:border-yellow-400 sun:text-yellow-400">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>{error && <p role="alert" className="text-red-400 text-sm">{error}</p>}<button type="submit" disabled={!supervisorLoginConfigured || checking} className="action-button w-full flex items-center justify-center gap-2"><LogIn size={18}/>{checking ? 'CHECKING…' : 'SIGN IN'}</button></form></div>;
}
