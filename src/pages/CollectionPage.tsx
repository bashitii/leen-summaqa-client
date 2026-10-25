import { useParams } from 'react-router-dom';
import { useApi, useSeo } from '../lib/hooks';
import type { Collection } from '../lib/api';
import Shop from './Shop';
// Editorial header (admin-set hero image + intro text) followed by the same filterable grid as /shop, scoped to this collection.
export default function CollectionPage() {
  const { slug } = useParams(); const { data: c, error } = useApi<Collection>(`/collections/${slug}`);
  useSeo({ title: c?.title ?? 'Collection', description: c?.description ?? undefined, image: c?.hero_image_url ?? undefined });
  if (error) return <p className="grid min-h-[60vh] place-items-center pt-24 text-mute">Collection not found</p>;
  return <>
    <header className="relative flex min-h-[55vh] items-end overflow-hidden bg-lilac px-5 pb-10 pt-32 md:px-8"
      style={c?.hero_image_url ? { background: `center/cover url(${c.hero_image_url})` } : undefined}>
      <div><h1 className="font-serif text-[clamp(44px,8vw,120px)] normal-case leading-none tracking-tight">{c?.title}</h1>
        {(c?.intro_text || c?.description) && <p className="prose-soft mt-4 max-w-[52ch]">{c?.intro_text ?? c?.description}</p>}</div></header>
    <div className="pt-10"><Shop collection={slug} title={c?.title} /></div></>;
}
