import { useEffect, useState } from 'react';
import { adminApi, uploadImage } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';
interface C { id?: string; title: string; slug: string; description: string; intro_text: string; hero_image_url: string; is_active: boolean; sort_order: number; product_ids: string[] }
const blank: C = { title: '', slug: '', description: '', intro_text: '', hero_image_url: '', is_active: true, sort_order: 0, product_ids: [] };
// One screen: pick a collection on the left (or "New"), edit it on the right.
export default function Collections() {
  const [list, setList] = useState<any[]>([]); const [prods, setProds] = useState<{ id: string; name: string }[]>([]);
  const [c, setC] = useState<C>(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const load = () => adminApi<any[]>('/admin/collections').then(setList);
  useEffect(() => { load(); adminApi<typeof prods>('/admin/products').then(setProds); }, []);
  const pick = (x: any) => { setErr(''); setC({ ...blank, ...x, description: x.description ?? '', intro_text: x.intro_text ?? '', hero_image_url: x.hero_image_url ?? '' }); };
  const set = <K extends keyof C>(k: K, v: C[K]) => setC((s) => ({ ...s, [k]: v }));
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const body = { title: c.title, slug: c.slug || undefined, description: c.description || null, intro_text: c.intro_text || null, hero_image_url: c.hero_image_url || null,
      is_active: c.is_active, sort_order: Number(c.sort_order) || 0, product_ids: c.product_ids };
    try { const r = await adminApi<{ id: string }>(c.id ? `/admin/collections/${c.id}` : '/admin/collections', c.id ? 'PUT' : 'POST', body); await load(); set('id', r.id); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  const del = async () => { if (c.id && confirm(`Delete "${c.title}"? Products are kept.`)) { await adminApi(`/admin/collections/${c.id}`, 'DELETE'); setC(blank); load(); } };
  const hero = async (files: FileList | null) => { if (!files?.[0]) return; setBusy(true); try { set('hero_image_url', await uploadImage(files[0], 'campaigns')); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  return <div className="grid gap-10 md:grid-cols-[220px_1fr]">
    <div><h1 className="mb-4 font-serif text-4xl">Collections</h1><button className={`${btn2} mb-3 w-full`} onClick={() => { setC(blank); setErr(''); }}>New collection</button>
      {list.map((x) => <button key={x.id} onClick={() => pick(x)} className={`block w-full py-1.5 text-left ${x.id === c.id ? 'text-ink' : 'text-mute hover:text-ink'}`}>{x.title}{!x.is_active && ' (hidden)'}</button>)}</div>
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <Field label="Title"><input className={input} required value={c.title} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label="URL slug (auto if empty)"><input className={input} value={c.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
      <Field label="Intro text (editorial)"><textarea className={input} rows={3} value={c.intro_text} onChange={(e) => set('intro_text', e.target.value)} /></Field>
      <Field label="Description"><textarea className={input} rows={2} value={c.description} onChange={(e) => set('description', e.target.value)} /></Field>
      <div>{c.hero_image_url && <img src={c.hero_image_url} alt="" className="mb-2 aspect-video w-full max-w-md object-cover" />}
        <label className={`${btn2} inline-block cursor-pointer`}>{busy ? 'Uploading…' : c.hero_image_url ? 'Replace hero image' : 'Upload hero image'}<input hidden type="file" accept="image/*" onChange={(e) => hero(e.target.files)} /></label></div>
      <div className="flex gap-6"><Check label="Visible" checked={c.is_active} onChange={(b) => set('is_active', b)} />
        <Field label="Sort order"><input type="number" className={`${input} !w-24`} value={c.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} /></Field></div>
      <div><h2 className="label mb-2">Products in this collection</h2><div className="grid gap-1 md:grid-cols-2">{prods.map((p) =>
        <Check key={p.id} label={p.name} checked={c.product_ids.includes(p.id)} onChange={(b) => set('product_ids', b ? [...c.product_ids, p.id] : c.product_ids.filter((x) => x !== p.id))} />)}</div></div>
      {err && <p className="text-hot">{err}</p>}
      <div className="flex gap-3"><button className={btn} disabled={busy}>Save collection</button>{c.id && <button type="button" className={btn2} onClick={del}>Delete</button>}</div></form></div>;
}
