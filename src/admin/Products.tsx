import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import { btn } from './ui';
interface Row { id: string; name: string; slug: string; base_price: number; currency: string; is_active: boolean; is_featured: boolean; force_sold_out: boolean; thumb: string | null; stock: number }
export default function Products() {
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState('');
  const load = () => adminApi<Row[]>('/admin/products').then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const del = async (r: Row) => { if (confirm(`Delete "${r.name}"? Past orders keep their own copy of this product. (Tip: set it inactive instead if it may return.)`)) { await adminApi(`/admin/products/${r.id}`, 'DELETE'); load(); } };
  return <><div className="mb-6 flex items-center justify-between"><h1 className="font-serif text-4xl">Products</h1><Link to="/admin/products/new" className={btn}>New product</Link></div>
    {err && <p className="text-hot">{err}</p>}
    <table className="w-full text-left"><thead className="label"><tr><th className="py-2 font-normal">Product</th><th className="font-normal">Price</th><th className="font-normal">Stock</th><th className="font-normal">Status</th><th /></tr></thead>
      <tbody>{rows?.map((r) => <tr key={r.id} className="border-t border-line">
        <td className="py-3"><Link to={`/admin/products/${r.id}`} className="flex items-center gap-3">
          <span className="h-12 w-10 shrink-0 bg-line/60">{r.thumb && <img src={r.thumb} alt="" className="h-full w-full object-cover" />}</span>{r.name}</Link></td>
        <td>{r.base_price} {r.currency}</td><td>{r.stock}</td>
        <td className="text-mute">{[!r.is_active && 'Inactive', r.force_sold_out && 'Sold out', r.is_featured && 'Featured'].filter(Boolean).join(' · ') || 'Active'}</td>
        <td className="text-right"><button className="text-mute hover:text-hot" onClick={() => del(r)}>Delete</button></td></tr>)}</tbody></table></>;
}
