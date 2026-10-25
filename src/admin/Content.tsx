// ADMIN > CONTENT. One screen to edit every homepage section and info page. The form is generated from SECTIONS below,
// so adding a field later = adding one line. Images are uploaded to Supabase Storage through the API.
import { useEffect, useState } from 'react';
import { adminApi, uploadImage } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';

type Kind = 'text' | 'area' | 'url' | 'image' | 'images' | 'tags' | 'faq';
interface Fld { key: string; label: string; kind: Kind }
const f = (key: string, label: string, kind: Kind = 'text'): Fld => ({ key, label, kind });
const NOTE = f('review_note', 'Internal note (never shown on the site)', 'area');
const page = (id: string, label: string, extra: Fld[]) => ({ id: `page_${id}`, label, group: 'Pages', fields: [f('title', 'Page title'), ...extra, NOTE] });
const SECTIONS: { id: string; label: string; group: string; fields: Fld[] }[] = [
  { id: 'hero', label: 'Hero', group: 'Homepage', fields: [f('headline', 'Headline'), f('cta_label', 'Button text'), f('cta_url', 'Button link', 'url'), f('image_url', 'Image', 'image'), f('video_url', 'Video link (optional, plays muted on a loop)', 'url')] },
  { id: 'featured_collection', label: 'Featured collection', group: 'Homepage', fields: [f('eyebrow', 'Small label'), f('title', 'Title'), f('text', 'Text', 'area'), f('collection_slug', 'Collection web name (slug) to show pieces from'), f('image_url', 'Large image (optional)', 'image'), f('cta_label', 'Button text'), f('cta_url', 'Button link', 'url')] },
  { id: 'world', label: 'Page intro', group: "Leen's World", fields: [f('eyebrow', 'Small label'), f('headline', 'Headline'), f('text', 'Text', 'area'), f('image_url', 'Wide image (optional)', 'image')] },
  { id: 'story', label: 'Our story', group: "Leen's World", fields: [f('eyebrow', 'Small label'), f('headline', 'Headline'), f('body', 'Story text', 'area'), f('image_url', 'Image', 'image'), f('cta_label', 'Button text'), f('cta_url', 'Button link', 'url')] },
  { id: 'press', label: 'Recognition', group: "Leen's World", fields: [f('eyebrow', 'Small label'), f('headline', 'Headline'), f('text', 'Text', 'area'), f('image_url', 'Image', 'image'), f('cta_label', 'Button text'), f('cta_url', 'Button link', 'url')] },
  { id: 'featured', label: 'As featured in', group: "Leen's World", fields: [f('eyebrow', 'Small label'), f('logos', 'Logos (they scroll slowly across the page). Under each logo: the outlet name and the link to the article where Leen is featured', 'images'), f('outlets', 'Outlet names shown while there are no logos (comma separated)', 'tags'), NOTE] },
  { id: 'campaign', label: 'Campaign', group: 'Homepage', fields: [f('eyebrow', 'Small label'), f('headline', 'Headline'), f('text', 'Text (optional)', 'area'), f('image_url', 'Image', 'image'), f('video_url', 'Video link (optional)', 'url'), f('cta_label', 'Button text'), f('cta_url', 'Button link', 'url')] },
  { id: 'clique', label: '#Leenclique', group: 'Homepage', fields: [f('eyebrow', 'Small label'), f('headline', 'Headline'), f('text', 'Text', 'area'), f('instagram_url', 'Instagram link', 'url'), f('images', 'Community photos', 'images')] },
  { id: 'newsletter', label: 'Newsletter', group: 'Homepage', fields: [f('headline', 'Headline'), f('text', 'Text', 'area')] },
  page('about', 'About', [f('image_url', 'Image', 'image'), f('body', 'Text', 'area')]),
  page('contact', 'Contact', [f('intro', 'Intro text', 'area'), f('instagram_url', 'Instagram link', 'url'), f('facebook_url', 'Facebook link', 'url')]),
  page('faq', 'FAQ', [f('items', 'Questions and answers', 'faq')]),
  page('shipping', 'Shipping', [f('body', 'Text', 'area')]), page('returns', 'Returns', [f('body', 'Text', 'area')]),
  page('privacy', 'Privacy', [f('body', 'Text', 'area')]), page('terms', 'Terms', [f('body', 'Text', 'area')]),
];

// Comma-separated list that only commits when you leave the box (so typing "a, b" isn't interrupted).
function Tags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [t, setT] = useState(value.join(', ')); useEffect(() => setT(value.join(', ')), [value.join('|')]); // eslint-disable-line
  return <input className={input} value={t} onChange={(e) => setT(e.target.value)} onBlur={() => onChange(t.split(',').map((x) => x.trim()).filter(Boolean))} />;
}

export default function Content() {
  const [all, setAll] = useState<Record<string, { data: any; is_active: boolean }>>({}); const [sel, setSel] = useState('hero');
  const [d, setD] = useState<any>({}); const [active, setActive] = useState(true); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [saved, setSaved] = useState(false);
  const load = () => adminApi<typeof all>('/admin/content').then(setAll).catch((e) => setErr(e.message)); useEffect(() => { load(); }, []);
  useEffect(() => { setD(all[sel]?.data ?? {}); setActive(all[sel]?.is_active ?? true); setSaved(false); setErr(''); }, [sel, all]);
  const def = SECTIONS.find((s) => s.id === sel)!;
  const set = (k: string, v: unknown) => { setD((x: any) => ({ ...x, [k]: v })); setSaved(false); };
  const save = async () => { setBusy(true); setErr(''); try { await adminApi(`/admin/content/${sel}`, 'PUT', { data: d, is_active: active }); await load(); setSaved(true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const upload = async (k: string, files: FileList | null, many = false) => { if (!files?.length) return; setBusy(true); setErr('');
    try { const urls = await Promise.all([...files].map((x) => uploadImage(x, 'campaigns'))); many ? set(k, [...(d[k] ?? []), ...urls.map((url) => ({ url, alt: '' }))]) : set(k, urls[0]); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  const field = (x: Fld) => {
    const v = d[x.key];
    if (x.kind === 'area') return <Field key={x.key} label={x.label}><textarea className={input} rows={x.key === 'body' ? 14 : 4} value={v ?? ''} onChange={(e) => set(x.key, e.target.value)} /></Field>;
    if (x.kind === 'tags') return <Field key={x.key} label={x.label}><Tags value={v ?? []} onChange={(t) => set(x.key, t)} /></Field>;
    if (x.kind === 'image') return <div key={x.key}><span className="label mb-1 block">{x.label}</span>{v && <img src={v} alt="" className="mb-2 max-h-40" />}
      <label className={`${btn2} inline-block cursor-pointer`}>{v ? 'Replace image' : 'Upload image'}<input hidden type="file" accept="image/*" onChange={(e) => upload(x.key, e.target.files)} /></label>
      {v && <button className="ml-3 text-mute" onClick={() => set(x.key, '')}>Remove</button>}</div>;
    if (x.kind === 'images') return <div key={x.key}><span className="label mb-1 block">{x.label}</span>
      <div className={`mb-2 grid gap-2 ${x.key === 'logos' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-4'}`}>{(v ?? []).map((im: { url: string; alt?: string; link_url?: string }, i: number) => <div key={i} className="relative">
        <img src={im.url} alt="" className={x.key === 'logos' ? 'h-24 w-full bg-white object-contain p-2' : 'aspect-square object-cover'} />
        <button className="absolute right-1 top-1 bg-paper px-1 text-hot" onClick={() => set(x.key, v.filter((_: unknown, j: number) => j !== i))}>✕</button>
        {/* Logos only: the outlet name (used as the logo's description) and the article link opened when a visitor clicks the logo. */}
        {x.key === 'logos' && <div className="mt-1 space-y-1">
          <input className={`${input} !py-1 text-xs`} placeholder="Outlet name, e.g. Harper's Bazaar Arabia" value={im.alt ?? ''} onChange={(e) => set(x.key, v.map((y: object, j: number) => j === i ? { ...y, alt: e.target.value } : y))} />
          <input className={`${input} !py-1 text-xs`} placeholder="Article link https://…" value={im.link_url ?? ''} onChange={(e) => set(x.key, v.map((y: object, j: number) => j === i ? { ...y, link_url: e.target.value.trim() } : y))} /></div>}</div>)}</div>
      <label className={`${btn2} inline-block cursor-pointer`}>Add photos<input hidden multiple type="file" accept="image/*" onChange={(e) => upload(x.key, e.target.files, true)} /></label></div>;
    if (x.kind === 'faq') return <div key={x.key} className="space-y-3"><span className="label block">{x.label}</span>
      {(v ?? []).map((it: { q: string; a: string }, i: number) => <div key={i} className="space-y-2 border border-line p-3">
        <input className={input} placeholder="Question" value={it.q} onChange={(e) => set(x.key, v.map((y: unknown, j: number) => j === i ? { ...it, q: e.target.value } : y))} />
        <textarea className={input} rows={3} placeholder="Answer" value={it.a} onChange={(e) => set(x.key, v.map((y: unknown, j: number) => j === i ? { ...it, a: e.target.value } : y))} />
        <button className="text-hot" onClick={() => set(x.key, v.filter((_: unknown, j: number) => j !== i))}>Remove</button></div>)}
      <button className={btn2} onClick={() => set(x.key, [...(v ?? []), { q: '', a: '' }])}>Add question</button></div>;
    return <Field key={x.key} label={x.label}><input className={input} value={v ?? ''} onChange={(e) => set(x.key, e.target.value)} placeholder={x.kind === 'url' ? 'https://… or /shop' : ''} /></Field>;
  };

  return <div className="grid gap-10 md:grid-cols-[220px_1fr]">
    <div><h1 className="mb-4 font-serif text-4xl">Content</h1>
      {['Homepage', "Leen's World", 'Pages'].map((g) => <div key={g} className="mb-5"><div className="label mb-1">{g}</div>
        {SECTIONS.filter((s) => s.group === g).map((s) => <button key={s.id} onClick={() => setSel(s.id)} className={`block w-full py-1.5 text-left ${s.id === sel ? 'text-ink' : 'text-mute hover:text-ink'}`}>{s.label}{all[s.id]?.data?.review_note ? ' •' : ''}</button>)}</div>)}
      <p className="text-mute">• has a note to review</p></div>
    <div className="max-w-2xl space-y-5"><h2 className="font-serif text-3xl">{def.label}</h2>
      {d.review_note && <p className="border border-hot p-3 text-hot">{d.review_note}</p>}
      {def.fields.map(field)}
      <Check label="Visible on the site" checked={active} onChange={(b) => { setActive(b); setSaved(false); }} />
      {err && <p className="text-hot">{err}</p>}
      <div className="flex items-center gap-4"><button className={btn} disabled={busy} onClick={save}>{busy ? 'Working…' : 'Save'}</button>{saved && <span className="text-mute">Saved. The site updates within a minute.</span>}</div></div></div>;
}
