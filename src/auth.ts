// Supervisor sign-in. The username and a SHA-256 hash of the password come from the
// private .env file (never committed; see .env.example), so no password is stored in the
// repository or in the built site. This is still a browser-only check suited to a demo;
// for production, use a server-side sign-in such as Firebase Authentication.
const USERNAME = (import.meta.env.VITE_SUPERVISOR_USERNAME ?? '').trim().toLowerCase();
const PASSWORD_HASH = (import.meta.env.VITE_SUPERVISOR_PASSWORD_HASH ?? '').trim().toLowerCase();
const SESSION_KEY = 'fieldguard_supervisor_session';

export const supervisorLoginConfigured = Boolean(USERNAME && PASSWORD_HASH);

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkSupervisorLogin(username: string, password: string): Promise<boolean> {
  if (!supervisorLoginConfigured) return false;
  if (!crypto.subtle) throw new Error('Sign-in needs a secure connection. Open the site over https:// or localhost.');
  return username.trim().toLowerCase() === USERNAME && await sha256(password) === PASSWORD_HASH;
}

export function isSupervisorSignedIn(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === 'active'; } catch { return false; }
}

export function setSupervisorSignedIn(signedIn: boolean) {
  try {
    if (signedIn) sessionStorage.setItem(SESSION_KEY, 'active');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* storage blocked: sign-in lasts until the page reloads */ }
}
