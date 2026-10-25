import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { forgetPendingOrder, readPendingOrder, useOrderActions } from './OrderActions';

// If the customer left the payment page without paying, this bar follows them around the shop with "Pay now" and "Cancel".
// It disappears by itself once the order is paid, cancelled, or expired.
export default function PendingOrderBanner() {
  const { pathname } = useLocation(); const [o, setO] = useState<any>(null);
  const check = useCallback(() => {
    const p = readPendingOrder(); if (!p) { setO(null); return; }
    adminApi<any>(`/checkout/orders/${p.id}?token=${p.token}`).then((x) => {
      if (x.payment_status === 'PENDING' && x.status !== 'CANCELLED') setO({ ...x, token: p.token }); else { forgetPendingOrder(); setO(null); }
    }).catch(() => { forgetPendingOrder(); setO(null); });
  }, []);
  useEffect(() => { check(); }, [pathname, check]);
  const { busy, err, payNow, cancel } = useOrderActions(o?.id ?? '', o?.token ?? '', check);
  if (!o || pathname.startsWith('/checkout/complete') || pathname.startsWith('/dev/')) return null;
  return <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-5 py-3 text-[11px]">
    <span>You have an unpaid order #{o.order_number}. Items are held for a short time.{err && <em className="ml-2 text-hot not-italic">{err}</em>}</span>
    <span className="flex gap-5"><button disabled={busy} onClick={payNow} className="bg-ink px-4 py-2 text-paper disabled:opacity-40">Pay now</button>
      <button disabled={busy} onClick={cancel} className="underline">Cancel order</button>
      <Link to={`/checkout/complete?order=${o.id}&token=${o.token}`} className="underline">View</Link></span></div>;
}
