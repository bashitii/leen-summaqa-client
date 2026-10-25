import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi, useSeo } from '../lib/hooks';
import { money, tintFromName } from '../lib/format';
import type { Product } from '../lib/api';
import { useCart } from '../components/Cart';
import ProductCard from '../components/ProductCard';
import Art from '../components/Art';
import { SIZES, srcSet } from '../lib/img';
import { track } from '../lib/analytics';
import { useCurrency } from '../lib/currency';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="border-b border-line"><button className="flex w-full justify-between py-4" onClick={() => setOpen(!open)}><span>{title}</span><span>{open ? '–' : '+'}</span></button>
    <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} className="overflow-hidden"><div className="prose-soft pb-5 text-mute">{children}</div></motion.div></div>;
}

export default function ProductPage() {
  const { slug } = useParams(); const { data: p, error } = useApi<Product>(`/products/${slug}`); const { add } = useCart(); const { fmt } = useCurrency();
  const [vid, setVid] = useState<string>(''); const [qty, setQty] = useState(1);
  const v = p?.variants.find((x) => x.id === vid) ?? p?.variants.find((x) => x.available) ?? p?.variants[0];
  useSeo({ title: p?.name ?? 'Product', type: 'product', description: p?.description ?? (p ? `${p.name} by Leen Summaqa.` : undefined), image: p?.images[0]?.url,
    jsonLd: p && v ? { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description ?? undefined, image: p.images.map((i) => i.url), sku: v.sku,
      brand: { '@type': 'Brand', name: 'Leen Summaqa' },
      offers: { '@type': 'Offer', priceCurrency: p.currency, price: v.price, availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } } : undefined });
  useEffect(() => { if (p && v) track('view_item', { value: v.price, currency: p.currency, items: [{ id: v.sku, name: p.name, price: v.price, quantity: 1 }] }); }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <p className="grid min-h-[60vh] place-items-center pt-24 text-mute">Product not found</p>;
  if (!p || !v) return <div className="min-h-screen" />;
  // Colours show as circles; any variant without a colour name (old size-only products) keeps the text buttons.
  const dots = p.variants.filter((x) => x.color_name), others = p.variants.filter((x) => !x.color_name && x.size_label);
  // Photos: the chosen colour's own photos first, then the shared ones. A colour with no photos shows the shared ones (or all, if nothing is shared).
  const own = p.images.filter((i) => i.variant_id === v.id), shared = p.images.filter((i) => !i.variant_id);
  const gallery = own.length || shared.length ? [...own, ...shared] : p.images;
  return <>
    <section className="grid gap-8 px-5 pt-20 md:grid-cols-[1.4fr_1fr] md:gap-12 md:px-8 md:pt-24">
      {/* Gallery: large images stacked; gentle zoom on hover (desktop) */}
      <div key={v.id} className="grid gap-3 md:grid-cols-2">{gallery.length ? gallery.map((im, i) =>
        <div key={im.url} className={`group overflow-hidden ${i === 0 ? 'md:col-span-2' : ''}`}>
          <img src={im.url} srcSet={srcSet(im.url)} sizes={i === 0 ? SIZES.gallery : '(min-width: 768px) 28vw, 100vw'} alt={im.alt_text ?? p.name} loading={i ? 'lazy' : 'eager'} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>)
        : <Art tint={tintFromName(p.name)} className="aspect-[4/5] md:col-span-2" />}</div>
      {/* Purchase panel: sticky on desktop so it stays visible while the gallery scrolls */}
      <div className="md:sticky md:top-24 md:self-start">
        <h1 className="font-serif text-4xl normal-case leading-none tracking-tight md:text-5xl">{p.name}</h1>
        <p className="mt-3">{fmt(v.price)}</p>
        {dots.length > 1 && <div className="mt-6"><p className="label mb-3">Colour: <span className="text-ink">{v.color_name}</span></p>
          <div className="flex flex-wrap gap-3">{dots.map((x) => <button key={x.id} onClick={() => setVid(x.id)} disabled={!x.available} aria-label={x.color_name ?? 'Colour'} aria-pressed={x.id === v.id} title={x.color_name ?? ''}
            className={`relative h-8 w-8 rounded-full border border-line p-[3px] ${x.id === v.id ? 'ring-1 ring-ink ring-offset-2 ring-offset-paper' : ''} disabled:opacity-40`}>
            <span className="block h-full w-full rounded-full" style={{ background: x.color_hex ?? '#cccccc' }} />
            {!x.available && <span className="absolute left-1/2 top-0 h-full w-px rotate-45 bg-ink" />}</button>)}</div></div>}
        {others.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{others.map((x) => <button key={x.id} onClick={() => setVid(x.id)} disabled={!x.available}
          className={`border px-3 py-2 text-[10px] ${x.id === v.id ? 'border-ink' : 'border-line text-mute'} disabled:line-through disabled:opacity-40`}>{x.size_label}</button>)}</div>}
        <div className="mt-6 flex items-center gap-4"><span className="label">Qty</span>
          <button aria-label="Less" onClick={() => setQty(Math.max(1, qty - 1))}>–</button><span>{qty}</span><button aria-label="More" onClick={() => setQty(Math.min(20, qty + 1))}>+</button></div>
        <button disabled={!v.available} onClick={() => add(v.id, qty)}
          className="mt-6 w-full bg-ink p-4 text-paper transition-opacity disabled:opacity-40">{!v.available ? 'Sold out' : v.preorder ? 'Pre-order' : 'Add to bag'}</button>
        {v.preorder && <p className="label mt-3">Pre-order: 2 weeks production + shipping time applies</p>}
        <div className="mt-8 border-t border-line">
          {p.description && <Section title="Details">{p.description}</Section>}
          {p.material && <Section title="Material">{p.material}</Section>}
          {p.dimensions && <Section title="Dimensions">{p.dimensions}</Section>}
          <Section title="Delivery">We ship worldwide. <Link className="underline" to="/shipping">Shipping information</Link></Section>
          <Section title="Returns"><Link className="underline" to="/returns">Returns policy</Link></Section>
        </div>
      </div>
    </section>
    {p.related && p.related.length > 0 && <section className="px-5 pt-24 md:px-8"><h2 className="label mb-7">You may also like</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{p.related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
  </>;
}
