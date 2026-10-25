// One component renders every info page (About, Contact, FAQ, Shipping, Returns, Privacy, Terms) from the database content.
import { useState } from 'react';
import { api } from '../lib/api';
import { usePage, type Section } from '../lib/content';
import { useSeo } from '../lib/hooks';
import Prose, { SmartLink } from '../components/Prose';
import { btn, input } from '../admin/ui';

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return <div className="border-t border-line">{items.map((it, i) => <details key={i} className="group border-b border-line py-4">
    <summary className="flex cursor-pointer list-none justify-between"><span>{it.q}</span><span className="group-open:hidden">+</span><span className="hidden group-open:inline">–</span></summary>
    <Prose text={it.a} className="pt-3 text-mute" /></details>)}</div>;
}

function Contact({ d }: { d: Section }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '', website: '' }); const [st, setSt] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setSt('busy');
    try { await api('/content/contact', undefined, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))) }); setSt('ok'); }
    catch { setSt('err'); } };
  return <div className="space-y-10">
    {d.intro && <Prose text={d.intro} />}
    <p className="flex gap-6">{d.instagram_url && <SmartLink to={d.instagram_url} className="link-line">Instagram</SmartLink>}{d.facebook_url && <SmartLink to={d.facebook_url} className="link-line">Facebook</SmartLink>}</p>
    {st === 'ok' ? <p>Thank you. Your message has been sent and we will reply by email.</p> : <form onSubmit={submit} className="space-y-4">
      <input className={input} placeholder="Name" value={f.name} onChange={(e) => set('name', e.target.value)} />
      <input className={input} type="email" required placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} />
      <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
      <textarea className={input} rows={5} required minLength={5} placeholder="Message" value={f.message} onChange={(e) => set('message', e.target.value)} />
      {/* honeypot: invisible to people, bots fill it in and are silently ignored */}
      <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" value={f.website} onChange={(e) => set('website', e.target.value)} />
      {st === 'err' && <p className="text-hot normal-case tracking-normal">Could not send. Please try again, or email us directly.</p>}
      <button className={btn} disabled={st === 'busy'}>{st === 'busy' ? 'Sending…' : 'Send message'}</button></form>}</div>;
}

export default function Page({ slug }: { slug: string }) {
  const { data, error } = usePage(slug);
  const text = typeof data?.body === 'string' ? data.body : typeof data?.intro === 'string' ? data.intro : '';
  useSeo({ title: data?.title ?? slug, description: text.replace(/[#\-\[\]()]/g, '').replace(/\s+/g, ' ').slice(0, 155) || undefined });
  if (error) return <p className="grid min-h-[60vh] place-items-center pt-24 text-mute">Page not found</p>;
  if (!data) return <div className="min-h-[70vh]" />;
  return <section className="mx-auto max-w-3xl px-5 pb-16 pt-28">
    <h1 className="mb-8 font-serif text-5xl normal-case leading-none tracking-tight md:text-7xl">{data.title}</h1>
    {data.image_url && <img src={data.image_url} alt="" loading="lazy" className="mb-10 w-full object-cover" />}
    {slug === 'faq' ? <Faq items={data.items ?? []} /> : slug === 'contact' ? <Contact d={data} /> : <Prose text={data.body ?? ''} />}</section>;
}
