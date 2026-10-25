// ADMIN > JOURNAL: write and edit the blog posts shown on the Leen's World page. One screen: list on the left, editor on the right.
// Text format (same as the info pages): blank line = new paragraph, "## Title" = heading, "- " = bullet list, [label](link), **bold**.
import { useEffect, useState } from 'react';
import { adminApi, uploadImage } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';

interface Post { id?: string; slug: string; title: string; excerpt: string; body: string; image_url: string; published_at: string; is_active: boolean }
const blank = (): Post => ({ slug: '', title: '', excerpt: '', body: '', image_url: '', published_at: new Date().toISOString(), is_active: true });
// "Why Raffia Bags…" -> "why-raffia-bags" (the web address of the post)
const slugify = (t: string) => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export default function Journal() {
  const [list, setList] = useState<Post[]>([]); const [p, setP] = useState<Post | null>(null); const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [saved, setSaved] = useState(false);
  const load = () => adminApi<Post[]>('/admin/journal').then(setList).catch((e) => setErr(e.message)); useEffect(() => { load(); }, []);
  const open = (x: Post | null) => { setP(x); setSlugTouched(!!x?.id); setErr(''); setSaved(false); };
  const set = (patch: Partial<Post>) => { setP((x) => x && ({ ...x, ...patch })); setSaved(false); };
  const save = async () => { if (!p) return; setBusy(true); setErr('');
    try { const { id, ...body } = p;
      if (id) await adminApi(`/admin/journal/${id}`, 'PUT', body); else { const r = await adminApi<{ id: string }>('/admin/journal', 'POST', body); setP({ ...p, id: r.id }); }
      await load(); setSaved(true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const remove = async () => { if (!p?.id || !confirm('Delete this post for good?')) return; setBusy(true);
    try { await adminApi(`/admin/journal/${p.id}`, 'DELETE'); await load(); open(null); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const upload = async (files: FileList | null) => { if (!files?.[0]) return; setBusy(true); setErr('');
    try { set({ image_url: await uploadImage(files[0], 'editorial') }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  return <div className="grid gap-10 md:grid-cols-[260px_1fr]">
    <div><h1 className="mb-4 font-serif text-4xl">Journal</h1>
      <button className={`${btn} mb-5`} onClick={() => open(blank())}>New post</button>
      <div className="space-y-1">{list.map((x) => <button key={x.id} onClick={() => open(x)} className={`block w-full py-1.5 text-left ${p?.id === x.id ? 'text-ink' : 'text-mute hover:text-ink'}`}>
        {x.title}{!x.is_active && <span className="label"> · hidden</span>}</button>)}{!list.length && <p className="text-mute">No posts yet</p>}</div></div>
    {!p ? <p className="text-mute">Pick a post, or write a new one.</p> : <div className="max-w-2xl space-y-5">
      <Field label="Title"><input className={input} value={p.title} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></Field>
      <Field label="Web address (leens-world/journal/…)"><input className={input} value={p.slug} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} /></Field>
      <Field label="Date"><input className={input} type="date" value={p.published_at.slice(0, 10)} onChange={(e) => e.target.value && set({ published_at: new Date(`${e.target.value}T12:00:00Z`).toISOString() })} /></Field>
      <Field label="Short summary (shown on the cards and in Google)"><textarea className={input} rows={2} value={p.excerpt} onChange={(e) => set({ excerpt: e.target.value })} /></Field>
      <div><span className="label mb-1 block">Main image</span>{p.image_url && <img src={p.image_url} alt="" className="mb-2 max-h-40" />}
        <label className={`${btn2} inline-block cursor-pointer`}>{p.image_url ? 'Replace image' : 'Upload image'}<input hidden type="file" accept="image/*" onChange={(e) => upload(e.target.files)} /></label>
        {p.image_url && <button className="ml-3 text-mute" onClick={() => set({ image_url: '' })}>Remove</button>}</div>
      <Field label="Post text"><textarea className={input} rows={18} value={p.body} onChange={(e) => set({ body: e.target.value })} /></Field>
      <p className="text-mute">Blank line = new paragraph · ## Heading · - bullet · [text](/shop) link · **bold**</p>
      <Check label="Published (visible on the site)" checked={p.is_active} onChange={(b) => set({ is_active: b })} />
      {err && <p className="text-hot">{err}</p>}
      <div className="flex items-center gap-4"><button className={btn} disabled={busy || !p.title || !p.slug} onClick={save}>{busy ? 'Working…' : 'Save'}</button>
        {p.id && <button className="text-hot" disabled={busy} onClick={remove}>Delete</button>}{saved && <span className="text-mute">Saved. The site updates within a minute.</span>}</div></div>}
  </div>;
}
