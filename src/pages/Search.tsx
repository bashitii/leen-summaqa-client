import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Product } from '../lib/api';
import { useSeo } from '../lib/hooks';
import ProductCard from '../components/ProductCard';
import { input } from '../admin/ui';
import { track } from '../lib/analytics';
// Search page: the query lives in the URL (?q=...), results come from the server's full-text search.
export default function Search() {
  useSeo({ title: 'Search', noindex: true }); const [sp, setSp] = useSearchParams(); const q = sp.get('q') ?? '';
  const [text, setText] = useState(q); const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => { if (q.trim().length < 2) { setItems(null); return; } let alive = true;
    api<{ items: Product[] }>('/search', { q: q.trim() }).then((r) => { if (alive) { setItems(r.items); track('search', { term: q.trim() }); } }).catch(() => alive && setItems([])); return () => { alive = false; }; }, [q]);
  return <section className="px-5 pb-16 pt-28 md:px-8">
    <h1 className="sr-only">Search</h1>
    <form onSubmit={(e) => { e.preventDefault(); setSp(text.trim() ? { q: text.trim() } : {}); }} className="mx-auto mb-10 max-w-xl">
      <input autoFocus className={`${input} !border-0 !border-b !bg-transparent !px-0 font-serif !text-4xl`} placeholder="Search" aria-label="Search" value={text} onChange={(e) => setText(e.target.value)} /></form>
    {items && (items.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="text-center text-mute">Nothing found for “{q}”</p>)}</section>;
}
