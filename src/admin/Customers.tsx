import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
export default function Customers() {
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState('');
  useEffect(() => { adminApi<any[]>('/admin/customers').then(setRows).catch((e) => setErr(e.message)); }, []);
  return <><h1 className="mb-6 font-serif text-4xl">Customers</h1>{err && <p className="text-hot">{err}</p>}{rows && rows.length === 0 && <p className="text-mute">No customers yet</p>}
    <table className="w-full text-left"><thead className="label"><tr><th className="py-2 font-normal">Name</th><th className="font-normal">Email</th><th className="font-normal">Phone</th><th className="font-normal">Orders</th><th className="font-normal">Paid</th><th className="font-normal">Joined</th></tr></thead>
      <tbody>{rows?.map((c) => <tr key={c.id} className="border-t border-line"><td className="py-3">{[c.profile?.first_name, c.profile?.last_name].filter(Boolean).join(' ') || '—'}</td><td>{c.email}</td><td>{c.profile?.phone ?? ''}</td>
        <td>{c.orders}</td><td>{c.spent}</td><td className="text-mute">{new Date(c.created_at).toLocaleDateString('en-GB')}</td></tr>)}</tbody></table></>;
}
