import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, uploadImage } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';

interface V { id?: string; sku: string; color_name: string; color_hex: string; size_label: string; price_override: string; quantity: number; allow_preorder: boolean; is_active: boolean }
interface I { url: string; alt_text: string; is_hover: boolean; color: number | null }   // color = index of its colour in `variants`; null = shared photo
interface Form { name: string; slug: string; description: string; material: string; dimensions: string; category_id: string; base_price: string; currency: string;
  is_active: boolean; is_featured: boolean; force_sold_out: boolean; collection_ids: string[]; variants: V[]; images: I[] }
const blankV = (): V => ({ sku: '', color_name: '', color_hex: '#cccccc', size_label: '', price_override: '', quantity: 0, allow_preorder: false, is_active: true });   // sku empty = made automatically by the server
const blank: Form = { name: '', slug: '', description: '', material: '', dimensions: '', category_id: '', base_price: '', currency: 'JOD', is_active: true, is_featured: false,
  force_sold_out: false, collection_ids: [], variants: [blankV()], images: [] };

export default function ProductForm() {
  const { id } = useParams(); const nav = useNavigate(); const [f, setF] = useState<Form>(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]); const [cols, setCols] = useState<{ id: string; title: string }[]>([]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  useEffect(() => {
    adminApi<typeof cats>('/admin/categories').then(setCats); adminApi<typeof cols>('/admin/collections').then(setCols);
    if (id) adminApi<any>(`/admin/products/${id}`).then((p) => setF({ ...blank, ...p, description: p.description ?? '', material: p.material ?? '', dimensions: p.dimensions ?? '',
      category_id: p.category_id ?? '', base_price: String(p.base_price),
      variants: p.variants.map((v: any) => ({ ...v, color_name: v.color_name ?? '', color_hex: v.color_hex ?? '', size_label: v.size_label ?? '', price_override: v.price_override == null ? '' : String(v.price_override) })),
      images: p.images.map((i: any) => { const c = p.variants.findIndex((v: any) => v.id === i.variant_id); return { url: i.url, alt_text: i.alt_text ?? '', is_hover: i.is_hover, color: c >= 0 ? c : null }; }) })).catch((e) => setErr(e.message));
  }, [id]);
  const setV = (i: number, patch: Partial<V>) => set('variants', f.variants.map((v, j) => j === i ? { ...v, ...patch } : v));
  // Photos belong to a colour (color = its index) or are shared (null). Moving a photo swaps it with its neighbour inside the same group.
  const move = (im: I, d: number) => { const group = f.images.filter((x) => x.color === im.color); const k = group.indexOf(im); const o = group[k + d]; if (!o) return;
    set('images', f.images.map((x) => x === im ? o : x === o ? im : x)); };
  const upload = async (files: FileList | null, color: number | null) => { if (!files) return; setBusy(true); setErr('');
    try { const urls = await Promise.all([...files].map((file) => uploadImage(file, 'products'))); set('images', [...f.images, ...urls.map((url) => ({ url, alt_text: f.name, is_hover: false, color }))]); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  // Removing a colour also removes its photos; the colours after it move up one place.
  const removeColour = (i: number) => setF((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i),
    images: s.images.filter((im) => im.color !== i).map((im) => im.color != null && im.color > i ? { ...im, color: im.color - 1 } : im) }));
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const body = { ...f, slug: f.slug || undefined, description: f.description || null, material: f.material || null, dimensions: f.dimensions || null, category_id: f.category_id || null,
      base_price: Number(f.base_price),
      variants: f.variants.map((v) => ({ ...v, color_name: v.color_name || null, color_hex: v.color_hex || null, size_label: v.size_label || null, price_override: v.price_override === '' ? null : Number(v.price_override) })),
      // Order saved: first colour's photos, second colour's photos, ..., then shared photos. The first photo of the first colour is the shop card photo.
      images: [...f.variants.flatMap((_, k) => f.images.filter((i) => i.color === k)), ...f.images.filter((i) => i.color == null)]
        .map(({ color, ...i }) => ({ ...i, alt_text: i.alt_text || null, color_index: color })) };
    try { await adminApi(id ? `/admin/products/${id}` : '/admin/products', id ? 'PUT' : 'POST', body); nav('/admin/products'); }
    catch (x) { setErr((x as Error).message); setBusy(false); } };

  return <form onSubmit={save} className="max-w-3xl space-y-8">
    <h1 className="font-serif text-4xl">{id ? 'Edit product' : 'New product'}</h1>
    <section className="grid gap-4 md:grid-cols-2">
      <Field label="Name"><input className={input} required value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="URL slug (auto from name if empty)"><input className={input} value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="tri-amore" /></Field>
      <Field label="Price (JOD)"><input className={input} required type="number" min="0" step="0.001" value={f.base_price} onChange={(e) => set('base_price', e.target.value)} /></Field>
      <Field label="Category"><select className={input} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}><option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Description" className="md:col-span-2"><textarea className={input} rows={4} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
      <Field label="Material"><input className={input} value={f.material} onChange={(e) => set('material', e.target.value)} /></Field>
      <Field label="Dimensions"><input className={input} value={f.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="W x H x D cm" /></Field>
    </section>
    <section className="flex flex-wrap gap-6"><Check label="Active (visible in shop)" checked={f.is_active} onChange={(b) => set('is_active', b)} />
      <Check label="Featured" checked={f.is_featured} onChange={(b) => set('is_featured', b)} /><Check label="Mark sold out" checked={f.force_sold_out} onChange={(b) => set('force_sold_out', b)} /></section>
    {cols.length > 0 && <section><h2 className="label mb-2">Collections</h2><div className="flex flex-wrap gap-5">{cols.map((c) =>
      <Check key={c.id} label={c.title} checked={f.collection_ids.includes(c.id)} onChange={(b) => set('collection_ids', b ? [...f.collection_ids, c.id] : f.collection_ids.filter((x) => x !== c.id))} />)}</div></section>}

    {/* COLOURS: each colour has its own stock and its own photos. The shop shows one circle per colour; clicking it switches the photos. */}
    <section><h2 className="label mb-1">Colours</h2>
      <p className="mb-3 text-xs text-mute">Add one box per colour with its own photos. The shop shows a coloured circle for each colour. If the bag has only one colour, leave the name empty.</p>
      <div className="space-y-5">{f.variants.map((v, i) => <div key={v.id ?? i} className="border border-line p-4">
        <div className="grid items-end gap-3 md:grid-cols-5">
          <Field label="Colour name"><input className={input} value={v.color_name} placeholder="e.g. Black" onChange={(e) => setV(i, { color_name: e.target.value })} /></Field>
          <Field label="Circle colour"><input type="color" className="h-[38px] w-full" value={v.color_hex || '#cccccc'} onChange={(e) => setV(i, { color_hex: e.target.value })} /></Field>
          <Field label="Stock"><input className={input} type="number" min="0" value={v.quantity} onChange={(e) => setV(i, { quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /></Field>
          <div className="space-y-1"><Check label="Pre-order" checked={v.allow_preorder} onChange={(b) => setV(i, { allow_preorder: b })} /><Check label="Visible" checked={v.is_active} onChange={(b) => setV(i, { is_active: b })} /></div>
          {f.variants.length > 1 && <button type="button" className="text-left text-hot" onClick={() => removeColour(i)}>Remove colour</button>}
        </div>
        <Photos title={`Photos of ${v.color_name || 'this colour'} (first = main)`} items={f.images.filter((im) => im.color === i)} busy={busy} onUpload={(fl) => upload(fl, i)} onMove={move}
          onChange={(im, patch) => set('images', f.images.map((x) => x === im ? { ...x, ...patch } : x))} onRemove={(im) => set('images', f.images.filter((x) => x !== im))} /></div>)}</div>
      <button type="button" className={`${btn2} mt-3`} onClick={() => set('variants', [...f.variants, blankV()])}>Add another colour</button></section>

    <section><Photos title="Shared photos (optional: shown for every colour, e.g. details or the model)" items={f.images.filter((im) => im.color == null)} busy={busy} onUpload={(fl) => upload(fl, null)} onMove={move}
      onChange={(im, patch) => set('images', f.images.map((x) => x === im ? { ...x, ...patch } : x))} onRemove={(im) => set('images', f.images.filter((x) => x !== im))} /></section>

    {err && <p className="text-hot">{err}</p>}
    <div className="flex gap-3"><button className={btn} disabled={busy}>Save product</button><button type="button" className={btn2} onClick={() => nav('/admin/products')}>Cancel</button></div></form>;
}

// One group of photos with upload, reorder, alt text and "hover" (the picture shown when someone hovers the product card).
function Photos({ title, items, busy, onUpload, onMove, onChange, onRemove }: { title: string; items: I[]; busy: boolean; onUpload: (f: FileList | null) => void;
  onMove: (im: I, d: number) => void; onChange: (im: I, patch: Partial<I>) => void; onRemove: (im: I) => void }) {
  return <div className="mt-4"><h3 className="label mb-2">{title}</h3>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((im) => <div key={im.url} className="border border-line p-2">
      <img src={im.url} alt="" className="aspect-[4/5] w-full object-cover" />
      <input className={`${input} mt-2 !py-1 text-xs`} placeholder="Alt text" value={im.alt_text} onChange={(e) => onChange(im, { alt_text: e.target.value })} />
      <div className="mt-2 flex items-center justify-between text-xs"><Check label="hover" checked={im.is_hover} onChange={(b) => onChange(im, { is_hover: b })} />
        <span><button type="button" onClick={() => onMove(im, -1)}>←</button> <button type="button" onClick={() => onMove(im, 1)}>→</button> <button type="button" className="text-hot" onClick={() => onRemove(im)}>✕</button></span></div></div>)}</div>
    <label className={`${btn2} mt-3 inline-block cursor-pointer`}>{busy ? 'Uploading…' : 'Upload photos'}<input hidden type="file" accept="image/*" multiple onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} /></label></div>;
}
