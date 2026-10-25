import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
interface Stats { revenue: number; orders: number; customers: number; products: number; inventory_units: number; out_of_stock_variants: number;
  recent_orders: { id: string; order_number: number; email: string; total: number; currency: string; status: string; payment_status: string; created_at: string }[] }
export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null); const [err, setErr] = useState('');
  useEffect(() => { adminApi<Stats>('/admin/stats').then(setS).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="text-hot">{err}</p>; if (!s) return null;
  const cards: [string, string | number][] = [['Revenue (paid)', `${s.revenue} JOD`], ['Orders', s.orders], ['Customers', s.customers], ['Products', s.products], ['Units in stock', s.inventory_units], ['Variants out of stock', s.out_of_stock_variants]];
  return <><h1 className="mb-6 font-serif text-4xl">Dashboard</h1>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([l, v]) => <div key={l} className="border border-line p-5"><div className="label">{l}</div><div className="mt-2 font-serif text-3xl">{v}</div></div>)}</div>
    <h2 className="label mb-3 mt-10">Recent orders</h2>
    {s.recent_orders.length === 0 ? <p className="text-mute">No orders yet</p> : <table className="w-full text-left"><tbody>{s.recent_orders.map((o) =>
      <tr key={o.id} className="border-b border-line"><td className="py-2">#{o.order_number}</td><td>{o.email}</td><td>{o.total} {o.currency}</td><td>{o.status}</td><td>{o.payment_status}</td></tr>)}</tbody></table>}</>;
}
