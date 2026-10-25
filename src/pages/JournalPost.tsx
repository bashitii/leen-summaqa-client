// ONE JOURNAL POST. The text is written in Admin > Journal and drawn by the safe Prose component (no raw HTML).
import { Link, useParams } from 'react-router-dom';
import Prose from '../components/Prose';
import { postDate, usePost } from '../lib/content';
import { useSeo } from '../lib/hooks';
import { SIZES, srcSet } from '../lib/img';

export default function JournalPost() {
  const { slug = '' } = useParams(); const { data: p, error } = usePost(slug);
  // Article data helps Google show the post properly in search results.
  useSeo({ title: p?.title ?? 'Journal', description: p?.excerpt || undefined, image: p?.image_url || undefined, noindex: !!error,
    jsonLd: p ? { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.published_at, image: p.image_url || undefined,
      author: { '@type': 'Organization', name: 'Leen Summaqa' }, publisher: { '@type': 'Organization', name: 'Leen Summaqa' } } : undefined });
  if (error) return <p className="grid min-h-[60vh] place-items-center pt-24 text-mute">Post not found</p>;
  if (!p) return <div className="min-h-[70vh]" />;
  return <article className="mx-auto max-w-3xl px-5 pb-20 pt-32">
    <Link to="/leens-world#journal" className="label link-line">← Leen's World</Link>
    <div className="label mb-5 mt-10">{postDate(p.published_at)}</div>
    <h1 className="mb-10 font-serif text-[clamp(38px,6vw,76px)] normal-case leading-[.98] tracking-tight">{p.title}</h1>
    {p.image_url && <img src={p.image_url} srcSet={srcSet(p.image_url)} sizes={SIZES.lead} alt="" className="mb-12 w-full object-cover" />}
    <Prose text={p.body ?? ''} />
    <div className="mt-16 flex justify-between border-t border-line pt-8"><Link to="/leens-world#journal" className="link-line">More stories</Link><Link to="/shop" className="link-line">Shop the collection</Link></div>
  </article>;
}
