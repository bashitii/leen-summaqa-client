import { Link } from 'react-router-dom';
import { useApi, useSeo } from '../lib/hooks';
import type { Collection } from '../lib/api';
export default function Collections() {
  useSeo({ title: 'Collections', description: 'Explore Leen Summaqa collections.' });
  const cols = useApi<Collection[]>('/collections').data ?? [];
  return <section className="px-5 pb-10 pt-28 md:px-8"><h1 className="mb-8 font-serif text-5xl normal-case tracking-tight md:text-7xl">Collections</h1>
    {cols.length === 0 ? <p className="text-mute">No collections yet</p> : <div className="grid gap-3 md:grid-cols-2">{cols.map((c) =>
      <Link key={c.id} to={`/collections/${c.slug}`} className="group relative flex aspect-[4/3] items-end justify-center overflow-hidden bg-line pb-8">
        {c.hero_image_url && <img src={c.hero_image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />}
        <span className="link-line relative">{c.title}</span></Link>)}</div>}</section>;
}
