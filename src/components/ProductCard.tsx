import { Link } from 'react-router-dom';
import type { Product } from '../lib/api';
import { money, tintFromName } from '../lib/format';
import Art from './Art';
import { useCurrency } from '../lib/currency';
import { SIZES, srcSet } from '../lib/img';

// Quick-add is intentionally left for Phase 5 (it needs the server cart).
export default function ProductCard({ p }: { p: Product }) {
  const { fmt } = useCurrency();
  const main = p.images[0], hover = p.hover_image;
  const colors = p.variants.map((v) => v.color_hex).filter(Boolean) as string[];
  const preorder = !p.sold_out && p.variants.every((v) => !v.available || v.preorder);
  return (
    <Link to={`/products/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden">
        {main ? <>
          <img src={main.url} srcSet={srcSet(main.url)} sizes={SIZES.grid} alt={main.alt_text ?? p.name} loading="lazy" className="h-full w-full object-cover" />
          {hover && <img src={hover.url} srcSet={srcSet(hover.url)} sizes={SIZES.grid} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />}
        </> : <Art tint={tintFromName(p.name)} className="h-full w-full" />}
        {(p.sold_out || preorder) && <span className="absolute left-3 top-3 bg-paper px-2 py-1 text-[10px]">{p.sold_out ? 'Sold out' : 'Pre-order'}</span>}
      </div>
      <div className="mt-3 flex justify-between gap-4 text-[11px]"><span>{p.name}</span><span className="shrink-0">{fmt(p.base_price)}</span></div>
      {colors.length > 0 && <div className="mt-2 flex gap-1.5">{colors.map((c) => <i key={c} className="h-2.5 w-2.5 rounded-full border border-line" style={{ background: c }} />)}</div>}
    </Link>
  );
}
