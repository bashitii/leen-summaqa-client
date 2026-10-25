import { useState } from 'react';
import { api } from '../lib/api';
import { track } from '../lib/analytics';
// Real signup: POSTs to /api/content/newsletter (stored in Supabase).
export default function Newsletter({ source = 'home' }: { source?: string }) {
  const [email, setEmail] = useState(''); const [st, setSt] = useState<'idle' | 'ok' | 'err'>('idle');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try {
    await api('/content/newsletter', undefined, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source }) }); setSt('ok'); track('newsletter_signup');
  } catch { setSt('err'); } };
  return <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md border-b border-ink">
    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email"
      className="flex-1 bg-transparent py-3 uppercase tracking-[.14em] outline-none placeholder:text-mute" />
    <button>{st === 'ok' ? 'Thank you' : st === 'err' ? 'Try again' : 'Subscribe'}</button></form>;
}
