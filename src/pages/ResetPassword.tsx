// Where the "reset your password" email link lands. The link carries a one-time token after the # in the address
// (the # part is never sent to any server, only read here). We send token + new password to our API, which checks the token.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { useSeo } from '../lib/hooks';
import { btn, input } from '../admin/ui';

function readLink(): { token: string; problem: string } {
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (h.get('access_token') && h.get('type') === 'recovery') return { token: h.get('access_token')!, problem: '' };
  return { token: '', problem: (h.get('error_description') ?? '').replace(/\+/g, ' ') || 'This reset link is invalid or has expired. Please request a new one.' };
}

export default function ResetPassword() {
  useSeo({ title: 'Reset password', noindex: true });
  const [{ token, problem }] = useState(readLink);                 // read once, without side effects
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { history.replaceState(null, '', window.location.pathname); }, []);   // remove the secret token from the address bar
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr('');
    if (pw !== pw2) { setErr('The two passwords do not match'); return; }
    setBusy(true); try { await adminApi('/auth/reset', 'POST', { access_token: token, password: pw }); setDone(true); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  return <section className="flex min-h-[70vh] px-5 pb-10 pt-28"><div className="mx-auto w-full max-w-sm space-y-5">
    <h1 className="text-center font-serif text-5xl normal-case tracking-tight">New password</h1>
    {done ? <p className="text-center">Your password has been changed. <Link to="/account" className="link-line">Sign in</Link></p>
      : !token ? <p className="text-center">{problem} <Link to="/account" className="link-line">Back to sign in</Link></p>
      : <form onSubmit={submit} className="space-y-4">
        <input className={input} type="password" required minLength={10} maxLength={72} placeholder="New password (10+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className={input} type="password" required minLength={10} maxLength={72} placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {err && <p className="text-hot normal-case tracking-normal">{err}</p>}<button className={`${btn} w-full`} disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></form>}</div></section>;
}
