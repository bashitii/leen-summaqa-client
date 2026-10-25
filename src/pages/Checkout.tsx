// CHECKOUT PAGE. The browser sends contact + address only. Prices, shipping and discount are decided by the server
// (POST /checkout/quote for the preview, POST /checkout to place the order).
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { useAuth } from '../lib/auth';
import { useApi, useSeo } from '../lib/hooks';
import { money } from '../lib/format';
import { cartHeaders, useCart } from '../components/Cart';
import { btn, input } from '../admin/ui';
import { rememberPendingOrder } from '../components/OrderActions';
import { track } from '../lib/analytics';

interface Country { code: string; name: string; ships_to: boolean }
interface Quote { currency: string; subtotal: number; discount_total: number; discount_error: string | null; shipping_total: number | null; shipping_error: string | null; total: number | null }
interface Addr { id: string; recipient: string; line1: string; line2: string | null; city: string; region: string | null; postal_code: string | null; country_code: string; phone: string | null }
const blank = { email: '', phone: '', recipient: '', line1: '', line2: '', city: '', region: '', postal_code: '', country_code: '' };

export default function Checkout() {
  useSeo({ title: 'Checkout', noindex: true });
  const nav = useNavigate(); const { user } = useAuth(); const { items, subtotal, currency, code, clearCode, refresh } = useCart();
  const countries = (useApi<Country[]>('/countries').data ?? []).filter((c) => c.ships_to);
  const [f, setF] = useState(blank); const set = (k: keyof typeof blank, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [quote, setQuote] = useState<Quote | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [saved, setSaved] = useState<Addr[]>([]);

  // Pre-fill from the signed-in customer's profile + saved addresses.
  useEffect(() => { if (!user) return;
    setF((s) => ({ ...s, email: s.email || user.email, phone: s.phone || user.profile?.phone || '', recipient: s.recipient || [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') }));
    adminApi<Addr[]>('/me/addresses').then(setSaved).catch(() => {}); }, [user]);
  // Default country = first shippable one.
  useEffect(() => { if (countries.length && !countries.some((c) => c.code === f.country_code)) set('country_code', countries[0].code); }, [countries.length]); // eslint-disable-line
  // Re-quote whenever the country, the bag or the discount code changes.
  useEffect(() => { if (!f.country_code || !items.length) return; let alive = true;
    adminApi<Quote>('/checkout/quote', 'POST', { country_code: f.country_code, discount_code: code || undefined }, cartHeaders()).then((q) => alive && setQuote(q)).catch(() => alive && setQuote(null));
    return () => { alive = false; }; }, [f.country_code, subtotal, code, items.length]);

  const useSaved = (id: string) => { const a = saved.find((x) => x.id === id); if (a) setF((s) => ({ ...s, recipient: a.recipient, line1: a.line1, line2: a.line2 ?? '', city: a.city, region: a.region ?? '', postal_code: a.postal_code ?? '', country_code: a.country_code, phone: s.phone || a.phone || '' })); };
  const blocked = items.some((i) => i.issue) || !quote || quote.shipping_total === null;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const clean = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''));
    try {
      const o = await adminApi<{ id: string; public_token: string }>('/checkout', 'POST', { email: f.email, phone: f.phone, discount_code: code || undefined,
        shipping_address: clean({ recipient: f.recipient, line1: f.line1, line2: f.line2, city: f.city, region: f.region, postal_code: f.postal_code, country_code: f.country_code, phone: f.phone }) }, cartHeaders());
      rememberPendingOrder(o.id, o.public_token);          // so the customer can come back to pay or cancel
      clearCode();                                          // the server already emptied the bag
      try { const pay = await adminApi<{ redirect_url: string }>('/payments/start', 'POST', { order_id: o.id, token: o.public_token }); window.location.assign(pay.redirect_url); }
      catch { refresh(); nav(`/checkout/complete?order=${o.id}&token=${o.public_token}`, { replace: true }); }   // order exists; the confirmation page offers "Pay now" to retry
    } catch (x) { setErr((x as Error).message); setBusy(false); } };

  const began = useRef(false);   // count "begin checkout" once per visit, only when the bag really has items
  useEffect(() => { if (items.length && !began.current) { began.current = true; track('begin_checkout', { value: subtotal, currency, items: items.map((i) => ({ id: i.variant_id, name: i.name, price: i.unit_price, quantity: i.quantity })) }); } }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length) return <section className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center"><div><p>Your bag is empty</p><Link to="/shop" className="link-line mt-4 inline-block">Continue shopping</Link></div></section>;
  return <section className="grid gap-12 px-5 pb-16 pt-28 md:grid-cols-[1.2fr_1fr] md:px-8">
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-serif text-5xl normal-case tracking-tight">Checkout</h1>
      {!user && <p className="text-mute">Have an account? <Link className="underline" to="/account">Sign in</Link> to use your saved details.</p>}
      <h2 className="label pt-4">Contact</h2>
      <input className={input} type="email" required placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} />
      <input className={input} required minLength={6} placeholder="Phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
      <h2 className="label pt-4">Shipping address</h2>
      {saved.length > 0 && <select className={input} defaultValue="" onChange={(e) => useSaved(e.target.value)}><option value="">Use a saved address</option>{saved.map((a) => <option key={a.id} value={a.id}>{a.recipient}, {a.line1}</option>)}</select>}
      <select className={input} required value={f.country_code} onChange={(e) => set('country_code', e.target.value)}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
      <input className={input} required placeholder="Full name" value={f.recipient} onChange={(e) => set('recipient', e.target.value)} />
      <input className={input} required placeholder="Address" value={f.line1} onChange={(e) => set('line1', e.target.value)} />
      <input className={input} placeholder="Apartment, suite, etc. (optional)" value={f.line2} onChange={(e) => set('line2', e.target.value)} />
      <div className="grid grid-cols-3 gap-3"><input className={input} required placeholder="City" value={f.city} onChange={(e) => set('city', e.target.value)} />
        <input className={input} placeholder="Region" value={f.region} onChange={(e) => set('region', e.target.value)} /><input className={input} placeholder="Postal code" value={f.postal_code} onChange={(e) => set('postal_code', e.target.value)} /></div>
      {err && <p className="text-hot normal-case tracking-normal">{err}</p>}
      <button className={`${btn} w-full p-4`} disabled={busy || blocked}>{busy ? 'Placing order…' : 'Place order'}</button>
      <p className="label">Next: you will be taken to our secure payment page.</p>
      {currency !== 'JOD' && <p className="normal-case tracking-normal text-mute">Cards are charged in Jordanian dinar (JOD). Your total is converted to JOD at the current rate when you pay.</p>}
    </form>
    <aside className="h-fit space-y-3 border border-line p-6 text-[11px] md:sticky md:top-28">
      <h2 className="label mb-2">Your bag</h2>
      {items.map((i) => <div key={i.variant_id} className="flex justify-between gap-4"><span>{i.name}{i.variant_label ? ` · ${i.variant_label}` : ''} × {i.quantity}{i.issue && <em className="ml-2 text-hot not-italic">{i.issue}</em>}</span><span>{money(i.line_total, i.currency)}</span></div>)}
      <div className="space-y-2 border-t border-line pt-3">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
        {!!quote?.discount_total && <div className="flex justify-between"><span>Discount {code}</span><span>– {money(quote.discount_total, currency)}</span></div>}
        {quote?.discount_error && <p className="text-hot">{quote.discount_error}</p>}
        <div className="flex justify-between"><span>Shipping</span><span>{quote?.shipping_total != null ? money(quote.shipping_total, currency) : '—'}</span></div>
        {quote?.shipping_error && <p className="text-hot">{quote.shipping_error}</p>}
        <div className="flex justify-between border-t border-line pt-3 text-sm"><span>Total</span><span>{quote?.total != null ? money(quote.total, currency) : '—'}</span></div></div>
    </aside></section>;
}
