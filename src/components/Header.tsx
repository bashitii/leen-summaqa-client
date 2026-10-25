import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApi } from '../lib/hooks';
import type { Category, Collection } from '../lib/api';
import { useCart } from './Cart';
import { CurrencySelect } from '../lib/currency';

// Transparent over the home hero (white text); solid paper + dark text everywhere else / after scrolling / on hover.
export default function Header() {
  const { pathname } = useLocation(); const { count, setOpen } = useCart();
  const [logoOk, setLogoOk] = useState(true);          // false if public/logo.svg is missing -> we show the text logo instead
  const [scrolled, setScrolled] = useState(false); const [mega, setMega] = useState(false); const [menu, setMenu] = useState(false);
  const cats = useApi<Category[]>('/categories').data ?? []; const cols = useApi<Collection[]>('/collections').data ?? [];
  useEffect(() => { const f = () => setScrolled(scrollY > innerHeight * 0.8); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  useEffect(() => { setMega(false); setMenu(false); }, [pathname]);
  const solid = pathname !== '/' || scrolled || mega || menu;
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? 'bg-paper text-ink' : 'text-white'}`} onMouseLeave={() => setMega(false)}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4 md:px-8">
        <nav className="flex gap-7">
          <button className="md:hidden" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
          <Link to="/shop" className="hidden md:inline" onMouseEnter={() => setMega(true)}>Shop</Link>
          <Link to="/collections" className="hidden md:inline" onMouseEnter={() => setMega(false)}>Collections</Link>
          <Link to="/leens-world" className="hidden md:inline" onMouseEnter={() => setMega(false)}>Leen's World</Link>
        </nav>
        {/* LOGO: the file client/public/logo.svg. Over the dark home hero the (black) logo is turned white with a CSS filter. */}
        <Link to="/" aria-label="Leen Summaqa — home" className="flex items-center justify-center gap-2 font-serif text-2xl normal-case tracking-normal">
          {logoOk ? <img src="/logo.svg" alt="Leen Summaqa" onError={() => setLogoOk(false)} className={`h-12 w-auto transition-[filter] duration-500 md:h-16 ${solid ? '' : 'brightness-0 invert'}`} />
            : <><i className="tri inline-block h-3 w-3.5 bg-current" />Leen Summaqa</>}</Link>
        <nav className="flex justify-end gap-5 md:gap-7">
          <span className="hidden md:inline"><CurrencySelect /></span><Link to="/search" className="hidden md:inline">Search</Link><Link to="/account" className="hidden md:inline">Account</Link>
          <button onClick={() => setOpen(true)}>Bag ({count})</button>
        </nav>
      </div>
      {/* Mega menu (desktop): categories + collections come from the database */}
      <div className={`hidden grid-cols-4 gap-10 border-t border-line px-8 pb-10 pt-8 text-ink transition-all duration-300 md:grid ${mega ? 'visible opacity-100' : 'invisible h-0 overflow-hidden !py-0 opacity-0'}`}>
        <div><h4 className="label mb-3">Shop</h4><ul className="space-y-2"><li><Link to="/shop">View all</Link></li>
          {cats.map((c) => <li key={c.slug}><Link to={`/shop?category=${c.slug}`}>{c.name}</Link></li>)}</ul></div>
        <div><h4 className="label mb-3">Collections</h4><ul className="space-y-2">{cols.map((c) => <li key={c.id}><Link to={`/collections/${c.slug}`}>{c.title}</Link></li>)}</ul></div>
      </div>
      {menu && <div className="space-y-4 border-t border-line px-5 pb-6 pt-5 text-ink md:hidden">
        <Link className="block" to="/shop">Shop</Link><Link className="block" to="/collections">Collections</Link><Link className="block" to="/leens-world">Leen's World</Link>
        <Link className="block" to="/search">Search</Link><Link className="block" to="/account">Account</Link><div><CurrencySelect /></div></div>}
    </header>
  );
}
