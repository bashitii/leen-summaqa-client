// DEVELOPMENT ONLY — a fake "bank page" so the order flow can be tested without a real payment gateway. It is only compiled into
// development builds (see App.tsx), takes no card details, and talks to a server route that does not exist in production.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
export default function MockPay() {
  const [sp] = useSearchParams(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const back = sp.get('return') ?? '/';
  const finish = async (outcome: 'success' | 'fail') => { setBusy(true); setErr('');
    try { await adminApi('/payments/mock/confirm', 'POST', { ref: sp.get('ref'), outcome });
      window.location.assign(back.startsWith(window.location.origin) ? back : '/'); }   // only ever return to our own site
    catch (e) { setErr((e as Error).message); setBusy(false); } };
  return <section className="mx-auto grid min-h-screen max-w-md place-items-center px-5 text-center"><div className="space-y-5">
    <p className="bg-hot p-3 text-white">Development only — no real payment</p>
    <h1 className="font-serif text-4xl normal-case tracking-tight">Test payment</h1>
    <p>Order #{sp.get('order')} · {sp.get('amount')} {sp.get('currency')}</p>
    <button disabled={busy} onClick={() => finish('success')} className="block w-full bg-ink p-4 text-paper disabled:opacity-40">Simulate successful payment</button>
    <button disabled={busy} onClick={() => finish('fail')} className="block w-full border border-ink p-4 disabled:opacity-40">Simulate failed payment</button>
    <button disabled={busy} onClick={() => window.location.assign(back.startsWith(window.location.origin) ? back : '/')} className="block w-full p-2 text-mute underline">Leave without paying</button>
    {err && <p className="text-hot normal-case tracking-normal">{err}</p>}</div></section>;
}
