import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useApi, useSeo } from '../lib/hooks';
import type { Category, Product } from '../lib/api';

// Filters live in the URL (?category=bags&sort=price_asc) so every view is shareable and the back button works.
export default function Shop({ collection, title = 'Shop' }: { collection?: string; title?: string }) {
  const [sp, setSp] = useSearchParams();
  const get = (k: string) => sp.get(k) ?? '';
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  useSeo({ title, description: 'Shop Leen Summaqa handbags and accessories.' });
  const cats = useApi<Category[]>('/categories').data ?? [];
  const { data, loading } = useApi<{ items: Product[]; total: number }>('/products', {
    collection, category: get('category'), min_price: get('min'), max_price: get('max'), sort: get('sort') || 'featured', limit: 48 });
  const chip = (active: boolean) => `border-b pb-0.5 ${active ? 'border-ink' : 'border-transparent text-mute hover:text-ink'}`;
  return <section className={collection ? 'px-5 pb-10 md:px-8' : 'px-5 pb-10 pt-28 md:px-8'}>
    {!collection && <h1 className="mb-8 font-serif text-5xl normal-case tracking-tight md:text-7xl">{title}</h1>}
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4 text-[10px]">
      <div className="flex flex-wrap gap-5">
        <button className={chip(!get('category'))} onClick={() => set('category', '')}>All</button>
        {cats.map((c) => <button key={c.slug} className={chip(get('category') === c.slug)} onClick={() => set('category', c.slug)}>{c.name}</button>)}
      </div>
      <div className="flex items-center gap-4">
        <label>Price <input inputMode="numeric" className="w-12 border-b border-line bg-transparent text-center outline-none" placeholder="min" value={get('min')} onChange={(e) => set('min', e.target.value.replace(/\D/g, ''))} />
          – <input inputMode="numeric" className="w-12 border-b border-line bg-transparent text-center outline-none" placeholder="max" value={get('max')} onChange={(e) => set('max', e.target.value.replace(/\D/g, ''))} /></label>
        <select aria-label="Sort" className="bg-transparent uppercase tracking-[.14em] outline-none" value={get('sort') || 'featured'} onChange={(e) => set('sort', e.target.value)}>
          <option value="featured">Featured</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
      </div>
    </div>
    {loading && !data ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-line/50" />)}</div>
      : data?.items.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      : <p className="py-24 text-center text-mute">No pieces found</p>}
  </section>;
}
