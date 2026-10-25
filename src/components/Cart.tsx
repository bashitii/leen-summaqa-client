// SERVER-BACKED CART. This file only holds what the server last told us; every change goes to /api/cart,
// which re-checks stock + prices and answers with the fresh cart. (Same hook shape the pages already use.)
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { adminApi, tokens } from '../lib/adminApi';
import { money, tintFromName } from '../lib/format';
import Art from './Art';
import { thumb } from '../lib/img';
import { track } from '../lib/analytics';

export interface CartItem { variant_id: string; product_slug: string; name: string; variant_label: string | null; image: string | null; currency: string;
  unit_price: number; quantity: number; line_total: number; max_quantity: number; issue: string | null }
interface View { id: string; currency: string; items: CartItem[]; subtotal: number; guest?: { id: string; token: string } }
interface Ctx { items: CartItem[]; count: number; subtotal: number; currency: string; busy: boolean; error: string;
  add: (variantId: string, qty: number) => Promise<void>; setQty: (variantId: string, qty: number) => Promise<void>; remove: (variantId: string) => Promise<void>;
  refresh: () => Promise<void>; code: string; discount: number; applyCode: (c: string) => Promise<void>; clearCode: () => void; open: boolean; setOpen: (b: boolean) => void }
const C = createContext<Ctx>(null!);
export const useCart = () => useContext(C);

// A guest proves ownership of their cart with {id, token}, kept in localStorage.
const GK = 'leen_guest_cart';
const guest = (): { id: string; token: string } | null => { try { return JSON.parse(localStorage.getItem(GK) || 'null'); } catch { return null; } };
const chosenCurrency = () => { try { return localStorage.getItem('leen_currency') || ''; } catch { return ''; } };
const headers = (): Record<string, string> => { const g = guest(); return { ...(g ? { 'x-cart-id': g.id, 'x-cart-token': g.token } : {}), ...(chosenCurrency() ? { 'x-currency': chosenCurrency() } : {}) }; };
export const cartHeaders = headers;   // checkout sends the same guest-cart headers
const call = async (path: string, method = 'GET', body?: unknown) => {
  const v = await adminApi<View>(path, method, body, headers());
  if (v.guest) localStorage.setItem(GK, JSON.stringify(v.guest));
  return v;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<View | null>(null); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [code, setCode] = useState(''); const [discount, setDiscount] = useState(0);

  const refresh = useCallback(async () => { try { setCart(await call('/cart')); } catch { /* API offline: keep what we have */ } }, []);
  // On load and whenever login/logout happens: if a customer is signed in and a guest cart exists, merge it first.
  useEffect(() => {
    const sync = async () => {
      if (tokens.get() && guest()) { try { await call('/cart/merge', 'POST'); } catch { /* ignore */ } localStorage.removeItem(GK); }
      await refresh();
    };
    sync(); window.addEventListener('leen-auth', sync); window.addEventListener('leen-currency', refresh);
    return () => { window.removeEventListener('leen-auth', sync); window.removeEventListener('leen-currency', refresh); };
  }, [refresh]);

  const mutate = async (fn: () => Promise<View>, openAfter = false) => {
    setBusy(true); setError('');
    try { setCart(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(false); if (openAfter) setOpen(true); }
  };
  const add = (variantId: string, quantity: number) => mutate(async () => {
    const v = await call('/cart/items', 'POST', { variant_id: variantId, quantity });
    const it = v.items.find((x) => x.variant_id === variantId);          // only counted when the server accepted it
    if (it) track('add_to_cart', { value: it.unit_price * quantity, currency: it.currency, items: [{ id: variantId, name: it.name, price: it.unit_price, quantity }] });
    return v;
  }, true);
  const setQty = (variantId: string, quantity: number) => mutate(() => call(`/cart/items/${variantId}`, 'PATCH', { quantity }));
  const remove = (variantId: string) => mutate(() => call(`/cart/items/${variantId}`, 'DELETE'));

  // Discount preview (server validates; it is really used up only at checkout in Phase 6).
  const applyCode = useCallback(async (c: string) => {
    try { const r = await adminApi<{ code: string; discount_total: number }>('/cart/discount', 'POST', { code: c }, headers()); setCode(r.code); setDiscount(r.discount_total); setError(''); }
    catch (e) { setCode(''); setDiscount(0); setError((e as Error).message); }
  }, []);
  useEffect(() => { if (code) applyCode(code); /* re-check when the bag changes */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.subtotal]);

  const items = cart?.items ?? [];
  return <C.Provider value={{ items, count: items.reduce((s, i) => s + i.quantity, 0), subtotal: cart?.subtotal ?? 0, currency: cart?.currency ?? 'JOD', busy, error,
    add, setQty, remove, refresh, code, discount, applyCode, clearCode: () => { setCode(''); setDiscount(0); }, open, setOpen }}>{children}</C.Provider>;
}

// Shared by the drawer and the /cart page.
export function CartBody({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal, currency, discount, code, applyCode, clearCode, setQty, remove, busy, error } = useCart();
  const [input, setInput] = useState('');
  const blocked = items.some((i) => i.issue);
  return <>
    <div className="flex-1 overflow-auto">{items.length === 0 ? <p className="text-mute">Your bag is empty</p> : items.map((i) =>
      <div key={i.variant_id} className="flex gap-4 border-b border-line py-4 text-[11px]">
        <Link to={`/products/${i.product_slug}`} onClick={onNavigate} className="block h-24 w-20 shrink-0 overflow-hidden bg-line/50">
          {i.image ? <img src={thumb(i.image)} alt={i.name} className="h-full w-full object-cover" /> : <Art tint={tintFromName(i.name)} className="h-full w-full" />}</Link>
        <div className="flex flex-1 flex-col justify-between"><div className="flex justify-between gap-3"><div><div>{i.name}</div>{i.variant_label && <div className="text-mute">{i.variant_label}</div>}
          {i.issue && <div className="mt-1 text-hot">{i.issue}</div>}</div><div>{money(i.line_total, i.currency)}</div></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-3">
            <button aria-label="Less" disabled={busy} onClick={() => setQty(i.variant_id, i.quantity - 1)}>–</button><span>{i.quantity}</span>
            <button aria-label="More" disabled={busy || i.quantity >= i.max_quantity} onClick={() => setQty(i.variant_id, i.quantity + 1)}>+</button></div>
            <button className="text-mute" disabled={busy} onClick={() => remove(i.variant_id)}>Remove</button></div></div></div>)}</div>
    {items.length > 0 && <div className="mt-5 space-y-3 text-[11px]">
      {code ? <div className="flex justify-between text-mute"><span>Code {code} <button className="underline" onClick={clearCode}>remove</button></span><span>– {money(discount, currency)}</span></div>
        : <form className="flex border-b border-line" onSubmit={(e) => { e.preventDefault(); if (input.trim()) applyCode(input.trim()); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Discount code" aria-label="Discount code" className="flex-1 bg-transparent py-2 uppercase tracking-[.14em] outline-none placeholder:text-mute" /><button>Apply</button></form>}
      {error && <p className="text-hot">{error}</p>}
      <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal - discount, currency)}</span></div>
      <div className="flex justify-between text-mute"><span>Shipping</span><span>Calculated at checkout</span></div></div>}
    {items.length > 0 && <Link to="/checkout" onClick={onNavigate} aria-disabled={blocked}
      className={`mt-5 block bg-ink p-4 text-center text-paper ${blocked ? 'pointer-events-none opacity-40' : ''}`}>Checkout</Link>}
  </>;
}

export function BagDrawer() {
  const { open, setOpen } = useCart();
  return <AnimatePresence>{open && <>
    <motion.div key="veil" className="fixed inset-0 z-[70] bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
    <motion.aside key="drawer" className="fixed bottom-0 right-0 top-0 z-[80] flex w-full max-w-[420px] flex-col border-l border-line bg-paper p-7"
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}>
      <div className="mb-5 flex justify-between"><span>Bag</span><button onClick={() => setOpen(false)}>Close</button></div>
      <CartBody onNavigate={() => setOpen(false)} /></motion.aside></>}</AnimatePresence>;
}
