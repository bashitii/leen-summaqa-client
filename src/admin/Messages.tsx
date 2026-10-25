import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
// Messages sent through the Contact page (the site has no email system yet, so they are kept here).
export default function Messages() {
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const load = () => adminApi<any[]>('/admin/messages').then(setRows).catch((e) => setErr(e.message)); useEffect(() => { load(); }, []);
  const toggle = async (m: any) => { await adminApi(`/admin/messages/${m.id}`, 'PATCH', { is_handled: !m.is_handled }); load(); };
  return <><h1 className="mb-6 font-serif text-4xl">Messages</h1>{err && <p className="text-hot">{err}</p>}{rows && rows.length === 0 && <p className="text-mute">No messages yet</p>}
    <div className="max-w-3xl space-y-4">{rows?.map((m) => <div key={m.id} className={`border border-line p-4 ${m.is_handled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between text-mute"><span>{m.name || 'No name'} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}</span><span>{new Date(m.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
      <p className="mt-2 whitespace-pre-line">{m.message}</p><button className="mt-3 underline" onClick={() => toggle(m)}>{m.is_handled ? 'Mark as new' : 'Mark as handled'}</button></div>)}</div></>;
}
