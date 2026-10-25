import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { btn, btn2, input } from './ui';
const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const when = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminOrders() {
  const [rows, setRows] = useState<any[] | null>(null); const [status, setStatus] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { adminApi<any[]>(`/admin/orders${status ? `?status=${status}` : ''}`).then(setRows).catch((e) => setErr(e.message)); }, [status]);
  return <><div className="mb-6 flex items-center justify-between"><h1 className="font-serif text-4xl">Orders</h1>
    <select className={`${input} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
    {err && <p className="text-hot">{err}</p>}{rows && rows.length === 0 && <p className="text-mute">No orders</p>}
    <table className="w-full text-left"><tbody>{rows?.map((o) => <tr key={o.id} className="border-t border-line"><td className="py-3"><Link to={`/admin/orders/${o.id}`} className="underline">#{o.order_number}</Link></td>
      <td className="text-mute">{when(o.created_at)}</td><td>{o.email}</td><td>{o.total} {o.currency}</td><td>{o.status}</td><td className={o.status === 'CANCELLED' && o.payment_status === 'PAID' ? 'text-hot' : ''}>{o.payment_status}{o.status === 'CANCELLED' && o.payment_status === 'PAID' ? ' — refund needed' : ''}</td><td>{o.is_preorder ? 'Pre-order' : ''}</td></tr>)}</tbody></table></>;
}

export function AdminOrderDetail() {
  const { id } = useParams(); const [o, setO] = useState<any>(null); const [status, setStatus] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = () => adminApi<any>(`/admin/orders/${id}`).then((x) => { setO(x); setStatus(x.status); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line
  const save = async () => { if (status === 'CANCELLED' && !confirm('Cancel this order? Reserved stock goes back on the shelf. This cannot be undone.')) return;
    setBusy(true); setErr(''); try { await adminApi(`/admin/orders/${id}/status`, 'PATCH', { status }); await load(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const refund = async () => { if (!confirm('Refund the full payment through the payment gateway?')) return; setBusy(true); setErr('');
    try { await adminApi(`/admin/orders/${id}/refund`, 'POST'); await load(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  if (err && !o) return <p className="text-hot">{err}</p>; if (!o) return null;
  const a = o.shipping_address ?? {};
  return <div className="max-w-3xl space-y-8"><div><Link to="/admin/orders" className="text-mute">← Orders</Link><h1 className="font-serif text-4xl">Order #{o.order_number}</h1>
    <p className="text-mute">{when(o.created_at)} · payment {o.payment_status}{o.is_preorder ? ' · pre-order' : ''}</p></div>
    {o.status === 'CANCELLED' && o.payment_status === 'PAID' && <p className="border border-hot p-3 text-hot">Payment arrived after this order was cancelled (its stock was already released). Refund the customer.</p>}
    <div className="flex items-center gap-3"><select className={`${input} !w-auto`} value={status} disabled={o.status === 'CANCELLED'} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      <button className={btn} disabled={busy || status === o.status || o.status === 'CANCELLED'} onClick={save}>Update status</button>{err && <span className="text-hot">{err}</span>}</div>
    <div className="grid gap-6 md:grid-cols-2"><div><h2 className="label mb-1">Customer</h2><p>{o.customer ? `${o.customer.first_name ?? ''} ${o.customer.last_name ?? ''}` : 'Guest'}<br />{o.email}<br />{o.phone}</p></div>
      <div><h2 className="label mb-1">Ship to</h2><p>{a.recipient}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city} {a.region} {a.postal_code}<br />{a.country_code}</p></div></div>
    <table className="w-full text-left"><thead className="label"><tr><th className="py-2 font-normal">Item</th><th className="font-normal">SKU</th><th className="font-normal">Qty</th><th className="text-right font-normal">Total</th></tr></thead>
      <tbody>{o.order_items.map((i: any) => <tr key={i.id} className="border-t border-line"><td className="py-2">{i.product_name}{i.variant_label ? ` · ${i.variant_label}` : ''}</td><td>{i.sku}</td><td>{i.quantity}</td><td className="text-right">{i.line_total}</td></tr>)}</tbody></table>
    <div className="space-y-1 text-right"><div>Subtotal {o.subtotal}</div>{Number(o.discount_total) > 0 && <div>Discount {o.discount_code} – {o.discount_total}</div>}<div>Shipping {o.shipping_total}</div><div className="font-serif text-2xl">Total {o.total} {o.currency}</div></div>
    <div><h2 className="label mb-1">Payments</h2>{o.payments.length === 0 ? <p className="text-mute">None recorded</p> : o.payments.map((p: any) => <p key={p.id}>{p.provider} · {p.status} · {p.amount} {p.currency} · {p.provider_ref}</p>)}</div>
    <div className="flex gap-3"><button className={btn2} onClick={() => window.print()}>Print</button>{o.payment_status === 'PAID' && <button className={btn2} disabled={busy} onClick={refund}>Refund payment</button>}</div></div>;
}
