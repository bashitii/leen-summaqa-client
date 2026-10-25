import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminApi, tokens } from '../lib/adminApi';

// GATE: no token -> login. Token but not ADMIN -> login. (The REAL protection is the server's requireAdmin;
// this just gives a sensible screen instead of a wall of 403 errors.)
export default function AdminLayout() {
  const nav = useNavigate(); const [ok, setOk] = useState(false);
  useEffect(() => {
    document.title = 'Admin — Leen Summaqa';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);   // keep admin out of Google
    if (!tokens.get()) { nav('/admin/login'); return; }
    adminApi<{ role: string }>('/me').then((me) => me.role === 'ADMIN' ? setOk(true) : nav('/admin/login')).catch(() => nav('/admin/login'));
    return () => { m.remove(); };
  }, [nav]);
  if (!ok) return <div className="min-h-screen" />;
  const link = ({ isActive }: { isActive: boolean }) => `block py-1.5 ${isActive ? 'text-ink' : 'text-mute hover:text-ink'}`;
  return <div className="grid min-h-screen text-[13px] normal-case tracking-normal md:grid-cols-[220px_1fr]">
    <aside className="border-b border-line p-6 md:border-b-0 md:border-r">
      <Link to="/admin" className="mb-6 block font-serif text-2xl">Leen Summaqa</Link>
      <nav className="flex flex-wrap gap-x-5 md:block">
        <NavLink end to="/admin" className={link}>Dashboard</NavLink><NavLink to="/admin/products" className={link}>Products</NavLink>
        <NavLink to="/admin/collections" className={link}>Collections</NavLink><NavLink to="/admin/orders" className={link}>Orders</NavLink>
        <NavLink to="/admin/customers" className={link}>Customers</NavLink><NavLink to="/admin/discounts" className={link}>Discounts</NavLink>
        <NavLink to="/admin/content" className={link}>Content</NavLink><NavLink to="/admin/journal" className={link}>Journal</NavLink><NavLink to="/admin/messages" className={link}>Messages</NavLink><NavLink to="/admin/settings" className={link}>Settings</NavLink>
      </nav>
      <div className="mt-8 space-y-1 text-mute"><Link className="block hover:text-ink" to="/">View site</Link>
        <button className="hover:text-ink" onClick={() => { tokens.clear(); nav('/admin/login'); }}>Sign out</button></div>
    </aside>
    <main className="p-6 md:p-10"><Outlet /></main></div>;
}
