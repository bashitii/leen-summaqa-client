// Shared "Pay now" / "Cancel order" logic for an unpaid order. Used by the banner, the confirmation page and the account order page.
import { useState } from 'react';
import { adminApi } from '../lib/adminApi';

// The browser remembers the last unpaid order so a customer who leaves the payment page can find their way back (banner).
const KEY = 'leen_pending_order';
export const rememberPendingOrder = (id: string, token: string) => localStorage.setItem(KEY, JSON.stringify({ id, token }));
export const forgetPendingOrder = () => localStorage.removeItem(KEY);
export const readPendingOrder = (): { id: string; token: string } | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

export function useOrderActions(id: string, token: string, onChange?: () => void) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const payNow = async () => { setBusy(true); setErr('');
    try { const p = await adminApi<{ redirect_url: string }>('/payments/start', 'POST', { order_id: id, token: token || undefined }); window.location.assign(p.redirect_url); }
    catch (e) { setErr((e as Error).message); setBusy(false); } };
  const cancel = async () => { if (!confirm('Cancel this order? Your items go back to the shop.')) return; setBusy(true); setErr('');
    try { await adminApi(`/checkout/orders/${id}/cancel`, 'POST', { token: token || undefined }); forgetPendingOrder(); onChange?.(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  return { busy, err, payNow, cancel };
}
