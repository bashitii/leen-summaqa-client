import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { useAuth } from '../lib/auth';
import { useSeo } from '../lib/hooks';
import { btn, btn2, Field, input } from '../admin/ui';

function AuthForms() {
  const { login, register } = useAuth(); const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in'); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' }); const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    try { if (mode === 'forgot') { await adminApi('/auth/forgot', 'POST', { email: f.email }); setMsg('If an account exists for that email, we have sent a link to reset the password. Please check your inbox.'); }
      else if (mode === 'in') await login(f.email, f.password);
      else if ((await register({ ...f, phone: f.phone || undefined })) === 'confirm-email') setMsg('Almost there: check your email and confirm your address, then sign in.'); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  return <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-4">
    <div className="flex gap-6"><button type="button" className={mode === 'in' ? 'border-b border-ink' : 'text-mute'} onClick={() => setMode('in')}>Sign in</button>
      <button type="button" className={mode === 'up' ? 'border-b border-ink' : 'text-mute'} onClick={() => setMode('up')}>Create account</button></div>
    {mode === 'up' && <div className="grid grid-cols-2 gap-3"><input className={input} required placeholder="First name" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} />
      <input className={input} required placeholder="Last name" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>}
    <input className={input} type="email" required placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} />
    {mode !== 'forgot' && <input className={input} type="password" required minLength={mode === 'up' ? 10 : 1} placeholder={mode === 'up' ? 'Password (10+ characters)' : 'Password'} value={f.password} onChange={(e) => set('password', e.target.value)} />}
    {mode === 'up' && <input className={input} placeholder="Phone (optional)" value={f.phone} onChange={(e) => set('phone', e.target.value)} />}
    {err && <p className="text-hot normal-case tracking-normal">{err}</p>}{msg && <p>{msg}</p>}
    <button className={`${btn} w-full`} disabled={busy}>{mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}</button>
    {mode === 'in' && <button type="button" className="text-mute underline" onClick={() => { setMode('forgot'); setErr(''); setMsg(''); }}>Forgot your password?</button>}
    {mode === 'forgot' && <button type="button" className="text-mute underline" onClick={() => { setMode('in'); setErr(''); setMsg(''); }}>Back to sign in</button>}</form>;
}

interface Addr { id: string; label: string | null; recipient: string; line1: string; line2: string | null; city: string; region: string | null; postal_code: string | null; country_code: string; phone: string | null }
const blankAddr = { recipient: '', line1: '', line2: '', city: '', region: '', postal_code: '', country_code: 'JO', phone: '' };

function Dashboard() {
  const { user, logout, reload } = useAuth();
  const [p, setP] = useState({ first_name: user?.profile?.first_name ?? '', last_name: user?.profile?.last_name ?? '', phone: user?.profile?.phone ?? '' }); const [saved, setSaved] = useState(false);
  const [addrs, setAddrs] = useState<Addr[]>([]); const [adding, setAdding] = useState(false); const [a, setA] = useState(blankAddr); const [err, setErr] = useState('');
  const loadAddrs = () => adminApi<Addr[]>('/me/addresses').then(setAddrs);
  useEffect(() => { loadAddrs(); }, []);
  const saveProfile = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await adminApi('/me', 'PATCH', { first_name: p.first_name, last_name: p.last_name, phone: p.phone || null }); await reload(); setSaved(true); } catch (x) { setErr((x as Error).message); } };
  const saveAddr = async (e: React.FormEvent) => { e.preventDefault(); setErr('');
    const body = Object.fromEntries(Object.entries(a).filter(([, v]) => v !== ''));
    try { await adminApi('/me/addresses', 'POST', body); setA(blankAddr); setAdding(false); loadAddrs(); } catch (x) { setErr((x as Error).message); } };
  const sa = (k: keyof typeof a, v: string) => setA((s) => ({ ...s, [k]: v }));
  return <div className="mx-auto w-full max-w-2xl space-y-12">
    <div className="flex items-center justify-between"><p>{user?.email}</p><div className="flex gap-6"><Link to="/account/orders" className="link-line">Orders</Link><button onClick={logout}>Sign out</button></div></div>
    <form onSubmit={saveProfile} className="space-y-4"><h2 className="label">Profile</h2>
      <div className="grid gap-3 md:grid-cols-3"><Field label="First name"><input className={input} value={p.first_name} onChange={(e) => { setP({ ...p, first_name: e.target.value }); setSaved(false); }} /></Field>
        <Field label="Last name"><input className={input} value={p.last_name} onChange={(e) => { setP({ ...p, last_name: e.target.value }); setSaved(false); }} /></Field>
        <Field label="Phone"><input className={input} value={p.phone} onChange={(e) => { setP({ ...p, phone: e.target.value }); setSaved(false); }} /></Field></div>
      <button className={btn2}>{saved ? 'Saved' : 'Save profile'}</button></form>
    <section className="space-y-4"><div className="flex justify-between"><h2 className="label">Addresses</h2><button onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add address'}</button></div>
      {addrs.map((x) => <div key={x.id} className="flex justify-between border-b border-line pb-3 normal-case tracking-normal"><div>{x.recipient}<br />{x.line1}{x.line2 ? `, ${x.line2}` : ''}<br />{x.city}{x.region ? `, ${x.region}` : ''} {x.postal_code} · {x.country_code}</div>
        <button className="self-start text-mute" onClick={async () => { await adminApi(`/me/addresses/${x.id}`, 'DELETE'); loadAddrs(); }}>Remove</button></div>)}
      {adding && <form onSubmit={saveAddr} className="grid gap-3 md:grid-cols-2">
        <input className={`${input} md:col-span-2`} required placeholder="Recipient name" value={a.recipient} onChange={(e) => sa('recipient', e.target.value)} />
        <input className={`${input} md:col-span-2`} required placeholder="Address line 1" value={a.line1} onChange={(e) => sa('line1', e.target.value)} />
        <input className={`${input} md:col-span-2`} placeholder="Address line 2" value={a.line2} onChange={(e) => sa('line2', e.target.value)} />
        <input className={input} required placeholder="City" value={a.city} onChange={(e) => sa('city', e.target.value)} />
        <input className={input} placeholder="Region / state" value={a.region} onChange={(e) => sa('region', e.target.value)} />
        <input className={input} placeholder="Postal code" value={a.postal_code} onChange={(e) => sa('postal_code', e.target.value)} />
        <input className={input} required maxLength={2} placeholder="Country code (JO)" value={a.country_code} onChange={(e) => sa('country_code', e.target.value.toUpperCase())} />
        <input className={`${input} md:col-span-2`} placeholder="Phone" value={a.phone} onChange={(e) => sa('phone', e.target.value)} />
        <button className={`${btn} md:col-span-2`}>Save address</button></form>}</section>
    {err && <p className="text-hot normal-case tracking-normal">{err}</p>}</div>;
}

export default function Account() {
  useSeo({ title: 'Account', noindex: true }); const { user, loading } = useAuth();
  return <section className="flex min-h-[70vh] px-5 pb-10 pt-28"><div className="w-full">
    <h1 className="mb-10 text-center font-serif text-5xl normal-case tracking-tight">Account</h1>{loading ? null : user ? <Dashboard /> : <AuthForms />}</div></section>;
}
