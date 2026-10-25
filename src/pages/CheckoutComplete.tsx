import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { useSeo } from '../lib/hooks';
import { money } from '../lib/format';
import { useOrderActions } from '../components/OrderActions';
import { track } from '../lib/analytics';

// Where the customer lands after the payment page. We NEVER trust the URL to say "paid": we ask the server for the real
// payment status, and keep re-checking for ~30s because the bank's confirmation can arrive a moment after the customer returns.
export default function CheckoutComplete() {
  useSeo({ title: 'Your order', noindex: true }); const [sp] = useSearchParams(); const id = sp.get('order'), token = sp.get('token') ?? '', rid = sp.get('id');   // rid = HyperPay's checkout id, added when the customer returns from the card page
  const [o, setO] = useState<any>(null); const [err, setErr] = useState(false); const [tries, setTries] = useState(0); 
  const load = useCallback(async () => {
    if (rid) await adminApi('/payments/confirm', 'POST', { order_id: id, token, checkout_id: rid }).catch(() => { /* still shown from the order below */ });   // server asks HyperPay what really happened
    return adminApi<any>(`/checkout/orders/${id}?token=${token}`).then(setO).catch(() => setErr(true));
  }, [id, token, rid]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (o?.payment_status !== 'PENDING' || o?.status === 'CANCELLED' || tries >= 10) return; const t = setTimeout(() => { setTries(tries + 1); load(); }, 3000); return () => clearTimeout(t); }, [o, tries, load]);
  // "Purchase" is counted only when the SERVER says the order is paid, and only once per order (so a page refresh can't double count).
  useEffect(() => { if (o?.payment_status !== 'PAID') return; const k = `leen_purchase_${o.id}`;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch { /* private mode: still count once */ }
    track('purchase', { transaction_id: String(o.order_number), value: Number(o.total), currency: o.currency,
      items: o.order_items.map((i: any) => ({ id: i.sku ?? i.product_name, name: i.product_name, price: Number(i.unit_price), quantity: i.quantity })) }); }, [o]);
  const { busy, err: payErr, payNow, cancel } = useOrderActions(id ?? '', token, load);

  if (err) return <p className="grid min-h-[70vh] place-items-center pt-24 text-mute">Order not found</p>;
  if (!o) return <div className="min-h-[70vh]" />;
  const a = o.shipping_address, paid = o.payment_status === 'PAID', dead = o.status === 'CANCELLED' && !paid, awaiting = o.payment_status === 'PENDING' && !dead;
  return <section className="mx-auto min-h-[70vh] max-w-2xl px-5 pb-16 pt-28 text-[11px]">
    <h1 className="font-serif text-5xl normal-case tracking-tight">{paid ? 'Thank you' : dead ? 'Order not completed' : 'Almost there'}</h1>
    <p className="mt-3">Order #{o.order_number} · {o.email}</p>
    {paid && <p className="mt-1">Payment received.{o.is_preorder ? ' Pre-order: 2 weeks production + shipping time applies.' : ''}</p>}
    {dead && <p className="mt-1 text-hot">This order was cancelled because payment was not completed. Your pieces are back in the shop; you are welcome to place a new order.</p>}
    {awaiting && <div className="mt-3 space-y-3"><p>{tries < 10 ? 'Checking your payment…' : 'We have not received your payment yet.'}</p>
      <div className="flex items-center gap-5"><button onClick={payNow} disabled={busy} className="bg-ink px-6 py-3 text-paper disabled:opacity-40">{busy ? 'Please wait…' : 'Pay now'}</button><button onClick={cancel} disabled={busy} className="underline">Cancel order</button></div>{payErr && <p className="text-hot normal-case tracking-normal">{payErr}</p>}</div>}
    <div className="mt-8">{o.order_items.map((i: any) => <div key={i.id} className="flex justify-between border-b border-line py-3"><span>{i.product_name}{i.variant_label ? ` · ${i.variant_label}` : ''} × {i.quantity}</span><span>{money(i.line_total, o.currency)}</span></div>)}</div>
    <div className="mt-4 space-y-1 text-right"><div>Subtotal {money(o.subtotal, o.currency)}</div>{Number(o.discount_total) > 0 && <div>Discount – {money(o.discount_total, o.currency)}</div>}
      <div>Shipping {money(o.shipping_total, o.currency)}</div><div className="text-sm">Total {money(o.total, o.currency)}</div></div>
    <p className="label mt-8">Shipping to</p><p className="normal-case tracking-normal">{a.recipient}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city} {a.postal_code} {a.country_code}</p>
    <Link to="/shop" className="link-line mt-10 inline-block">Continue shopping</Link></section>;
}
