import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { useAuth } from '../lib/auth';
import { useSeo } from '../lib/hooks';
import { money } from '../lib/format';
import { useOrderActions } from '../components/OrderActions';

const Gate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <p className="py-20 text-center">Please <Link className="link-line" to="/account">sign in</Link> to see your orders</p>;
};
const Shell = ({ title, children }: { title: string; children: React.ReactNode }) =>
  <section className="mx-auto min-h-[70vh] max-w-2xl px-5 pb-10 pt-28"><h1 className="mb-8 font-serif text-5xl normal-case tracking-tight">{title}</h1><Gate>{children}</Gate></section>;
const date = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrdersList() {
  useSeo({ title: 'Your orders', noindex: true });
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { adminApi<any[]>('/me/orders').then(setRows).catch(() => setRows([])); }, []);
  return <Shell title="Orders">{rows && (rows.length === 0 ? <p className="text-mute">No orders yet</p> : rows.map((o) =>
    <Link key={o.id} to={`/account/orders/${o.id}`} className="flex justify-between border-b border-line py-4 text-[11px]">
      <span>#{o.order_number} · {date(o.created_at)}</span><span>{o.status} · {money(o.total, o.currency)}</span></Link>))}</Shell>;
}

export function OrderDetail() {
  const { id } = useParams(); useSeo({ title: 'Order', noindex: true });
  const [o, setO] = useState<any>(null); const [err, setErr] = useState(false);
  const load = useCallback(() => adminApi<any>(`/me/orders/${id}`).then(setO).catch(() => setErr(true)), [id]);
  useEffect(() => { load(); }, [load]);
  const act = useOrderActions(id ?? '', '', load);
  return <Shell title={o ? `Order #${o.order_number}` : 'Order'}>{err ? <p className="text-mute">Order not found</p> : o && <div className="space-y-8 text-[11px]">
    <p className="text-mute">{date(o.created_at)} · {o.status} · Payment {o.payment_status}{o.is_preorder ? ' · Pre-order' : ''}</p>
    {o.payment_status === 'PENDING' && o.status !== 'CANCELLED' && <div className="flex items-center gap-5"><button disabled={act.busy} onClick={act.payNow} className="bg-ink px-5 py-3 text-paper disabled:opacity-40">Pay now</button><button disabled={act.busy} onClick={act.cancel} className="underline">Cancel order</button>{act.err && <span className="text-hot">{act.err}</span>}</div>}
    <div>{o.order_items.map((i: any) => <div key={i.id} className="flex justify-between border-b border-line py-3"><span>{i.product_name}{i.variant_label ? ` · ${i.variant_label}` : ''} × {i.quantity}</span><span>{money(i.line_total, o.currency)}</span></div>)}</div>
    <div className="space-y-1 text-right"><div>Subtotal {money(o.subtotal, o.currency)}</div>{Number(o.discount_total) > 0 && <div>Discount – {money(o.discount_total, o.currency)}</div>}
      <div>Shipping {money(o.shipping_total, o.currency)}</div><div className="text-sm">Total {money(o.total, o.currency)}</div></div>
    <div><div className="label mb-2">Shipping to</div><div className="normal-case tracking-normal">{o.shipping_address?.recipient}<br />{o.shipping_address?.line1}<br />{o.shipping_address?.city} {o.shipping_address?.postal_code} {o.shipping_address?.country_code}</div></div>
    <Link to="/account/orders" className="link-line inline-block">All orders</Link></div>}</Shell>;
}
