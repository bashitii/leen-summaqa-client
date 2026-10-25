import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';
interface D { id?: string; code: string; type: 'PERCENT' | 'FIXED'; value: string; min_subtotal: string; max_uses: string; starts_at: string; expires_at: string; is_active: boolean; used_count?: number }
const blank: D = { code: '', type: 'PERCENT', value: '', min_subtotal: '0', max_uses: '', starts_at: '', expires_at: '', is_active: true };
const toLocal = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const toIso = (v: string) => v ? new Date(v).toISOString() : null;
export default function Discounts() {
  const [list, setList] = useState<any[]>([]); const [d, setD] = useState<D>(blank); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = () => adminApi<any[]>('/admin/discounts').then(setList); useEffect(() => { load(); }, []);
  const set = <K extends keyof D>(k: K, v: D[K]) => setD((s) => ({ ...s, [k]: v }));
  const pick = (x: any) => { setErr(''); setD({ id: x.id, code: x.code, type: x.type, value: String(x.value), min_subtotal: String(x.min_subtotal), max_uses: x.max_uses == null ? '' : String(x.max_uses), starts_at: toLocal(x.starts_at), expires_at: toLocal(x.expires_at), is_active: x.is_active, used_count: x.used_count }); };
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const body = { code: d.code, type: d.type, value: Number(d.value), min_subtotal: Number(d.min_subtotal) || 0, max_uses: d.max_uses === '' ? null : Number(d.max_uses), starts_at: toIso(d.starts_at), expires_at: toIso(d.expires_at), is_active: d.is_active };
    try { await adminApi(d.id ? `/admin/discounts/${d.id}` : '/admin/discounts', d.id ? 'PUT' : 'POST', body); setD(blank); load(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  const del = async () => { if (d.id && confirm(`Delete code ${d.code}?`)) { await adminApi(`/admin/discounts/${d.id}`, 'DELETE'); setD(blank); load(); } };
  return <div className="grid gap-10 md:grid-cols-[260px_1fr]"><div><h1 className="mb-4 font-serif text-4xl">Discounts</h1><button className={`${btn2} mb-3 w-full`} onClick={() => { setD(blank); setErr(''); }}>New code</button>
    {list.map((x) => <button key={x.id} onClick={() => pick(x)} className={`block w-full py-1.5 text-left ${x.id === d.id ? 'text-ink' : 'text-mute hover:text-ink'}`}>{x.code} · {x.type === 'PERCENT' ? `${x.value}%` : x.value}{!x.is_active && ' (off)'} · used {x.used_count}</button>)}</div>
    <form onSubmit={save} className="max-w-xl space-y-4">
      <Field label="Code (letters, numbers, - _)"><input className={input} required value={d.code} onChange={(e) => set('code', e.target.value.toUpperCase())} /></Field>
      <div className="grid grid-cols-2 gap-4"><Field label="Type"><select className={input} value={d.type} onChange={(e) => set('type', e.target.value as D['type'])}><option value="PERCENT">Percent off</option><option value="FIXED">Fixed amount off</option></select></Field>
        <Field label={d.type === 'PERCENT' ? 'Percent (1-100)' : 'Amount (JOD)'}><input className={input} required type="number" min="0" step="0.001" value={d.value} onChange={(e) => set('value', e.target.value)} /></Field>
        <Field label="Minimum subtotal (JOD)"><input className={input} type="number" min="0" step="0.001" value={d.min_subtotal} onChange={(e) => set('min_subtotal', e.target.value)} /></Field>
        <Field label="Max uses (empty = unlimited)"><input className={input} type="number" min="1" value={d.max_uses} onChange={(e) => set('max_uses', e.target.value)} /></Field>
        <Field label="Starts"><input className={input} type="datetime-local" value={d.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></Field>
        <Field label="Expires"><input className={input} type="datetime-local" value={d.expires_at} onChange={(e) => set('expires_at', e.target.value)} /></Field></div>
      <Check label="Active" checked={d.is_active} onChange={(b) => set('is_active', b)} />{err && <p className="text-hot">{err}</p>}
      <div className="flex gap-3"><button className={btn} disabled={busy}>Save code</button>{d.id && <button type="button" className={btn2} onClick={del}>Delete</button>}</div></form></div>;
}
