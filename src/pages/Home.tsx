// HOMEPAGE = a fashion editorial. Every text and image block below is editable in Admin > Content (see lib/content.ts).
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import { SmartLink } from '../components/Prose';
import Art from '../components/Art';
import { useApi, useSeo } from '../lib/hooks';
import { useHomeContent, useJournal } from '../lib/content';
import { tintFromName } from '../lib/format';
import type { Collection, Product } from '../lib/api';
import { SIZES, srcSet } from '../lib/img';

// Gradients stand in for campaign photos until real images are uploaded in Admin > Content.
const GRADS = ['linear-gradient(120deg,#f1c4cf,#e8a9bb)', 'radial-gradient(circle at 70% 40%,#f6d98a,#e9a05a 55%,#c9763d)', 'linear-gradient(120deg,#d7ccea,#b9a7d6)'];
const TILES = ['bg-navy', 'bg-lilac', 'bg-blush', 'bg-sky', 'bg-hot', 'bg-lilac'];
const H2 = 'font-serif text-[clamp(34px,5vw,76px)] normal-case leading-none tracking-tight';

// Photo or looping muted video, covering its parent. Renders nothing if neither exists.
const Media = ({ image, video }: { image?: string; video?: string }) => video
  ? <video className="absolute inset-0 h-full w-full object-cover" src={video} poster={image || undefined} autoPlay muted loop playsInline />
  : image ? <img src={image} srcSet={srcSet(image)} sizes={SIZES.full} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null;

export default function Home() {
  const c = useHomeContent(); const journal = useJournal();
  const hero = c('hero'), fc = c('featured_collection'), world = c('world'), camp = c('campaign'), clique = c('clique'), news = c('newsletter');
  useSeo({ title: hero.headline || 'Leen Summaqa', description: 'Leen Summaqa: bold geometric handbags handcrafted in Egypt and Türkiye. We ship worldwide.',
    // Tells Google who the brand is and that the site has a search box (can show a search field under the result).
    jsonLd: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', name: 'Leen Summaqa', url: location.origin, foundingDate: '2019', founder: { '@type': 'Person', name: 'Leen Abu Summaqa' },
        sameAs: [clique.instagram_url, 'https://www.facebook.com/leensummaqa'].filter(Boolean) },
      { '@type': 'WebSite', name: 'Leen Summaqa', url: location.origin,
        potentialAction: { '@type': 'SearchAction', target: `${location.origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }] } });
  const cols = useApi<Collection[]>('/collections').data ?? [];
  const feat = useApi<{ items: Product[] }>('/products', { sort: 'featured', limit: 4 }).data?.items ?? [];
  const fcItems = useApi<{ items: Product[] }>('/products', { collection: fc.collection_slug, limit: 3 }).data?.items ?? [];
  const lead = fcItems[0], hasHeroMedia = !!(hero.image_url || hero.video_url);

  return <>
    {/* HERO: full viewport, minimal text */}
    <section className="relative flex h-[100svh] min-h-[560px] items-end justify-center overflow-hidden bg-gradient-to-br from-[#2a2f4f] to-[#14172b] pb-[9vh] text-white">
      {hasHeroMedia ? <><Media image={hero.image_url} video={hero.video_url} /><div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" /></> : <>
        <div className="tri absolute left-1/2 top-[16%] h-[72vmin] w-[62vmin] -translate-x-1/2 bg-lilac" />
        <div className="tri absolute left-[12%] top-[44%] h-[46vmin] w-[40vmin] bg-hot/90" />
        <div className="tri absolute right-[10%] top-[22%] h-[40vmin] w-[34vmin] rotate-180 bg-sky/90" /></>}
      <h1 className={`absolute bottom-[20vh] left-5 max-w-[12ch] font-serif text-[clamp(44px,9vw,150px)] normal-case leading-[.9] tracking-tight md:left-8 ${hasHeroMedia ? '' : 'mix-blend-difference'}`}>{hero.headline}</h1>
      <SmartLink to={hero.cta_url || '/shop'} className="link-line relative">{hero.cta_label}</SmartLink>
    </section>

    {/* One full-bleed block per collection (label only, like a campaign) */}
    {cols.slice(0, 3).map((x, i) => <Link key={x.id} to={`/collections/${x.slug}`} className="group relative flex min-h-[420px] items-end justify-center overflow-hidden pb-9 text-white md:aspect-video">
      <div className="absolute inset-0 transition-transform duration-[1400ms] group-hover:scale-[1.035]" style={{ background: x.hero_image_url ? `center/cover url(${x.hero_image_url})` : GRADS[i % 3] }} />
      <span className="link-line relative">{x.title}</span></Link>)}

    {/* FEATURED COLLECTION: editorial layout (one large image, one text column, two supporting pieces) */}
    <section className="grid gap-8 px-5 py-24 md:grid-cols-12 md:gap-12 md:px-8">
      <Reveal className="md:col-span-7"><SmartLink to={fc.cta_url || '/shop'} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e5de]">{fc.image_url ? <img src={fc.image_url} srcSet={srcSet(fc.image_url)} sizes={SIZES.lead} alt={fc.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.03]" />
          : lead?.images[0] ? <img src={lead.images[0].url} srcSet={srcSet(lead.images[0].url)} sizes={SIZES.lead} alt={lead.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.03]" />
          : <Art tint={lead ? tintFromName(lead.name) : '#b9a7d6'} className="h-full w-full" />}</div></SmartLink></Reveal>
      <Reveal className="flex flex-col justify-between gap-12 md:col-span-5" delay={0.1}>
        <div><div className="label mb-6">{fc.eyebrow}</div><h2 className={H2}>{fc.title}</h2><p className="prose-soft mt-6 max-w-[40ch]">{fc.text}</p>
          <SmartLink to={fc.cta_url || '/shop'} className="link-line mt-8 inline-block">{fc.cta_label}</SmartLink></div>
        {fcItems.length > 1 && <div className="grid grid-cols-2 gap-4">{fcItems.slice(1, 3).map((p) => <ProductCard key={p.id} p={p} />)}</div>}</Reveal>
    </section>

    {/* SIGNATURE PIECES */}
    <section className="px-5 pb-24 md:px-8">
      <Reveal><div className="label mb-7 flex justify-between"><span>Signature pieces</span><Link to="/shop">View all</Link></div></Reveal>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{feat.map((p, i) => <Reveal key={p.id} delay={i * 0.06}><ProductCard p={p} /></Reveal>)}</div>
    </section>

    {/* CAMPAIGN: immersive, minimal copy */}
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-5 text-center text-white" style={{ background: GRADS[2] }}>
      <Media image={camp.image_url} video={camp.video_url} />{(camp.image_url || camp.video_url) && <div className="absolute inset-0 bg-black/30" />}
      <Reveal className="relative"><div className="mb-6 text-[10px]">{camp.eyebrow}</div>
        <h2 className="mx-auto max-w-[14ch] font-serif text-[clamp(40px,8vw,120px)] normal-case leading-[.95] tracking-tight">{camp.headline}</h2>
        {camp.text && <p className="mx-auto mt-5 max-w-[44ch]">{camp.text}</p>}
        {camp.cta_url && <SmartLink to={camp.cta_url} className="link-line mt-8 inline-block">{camp.cta_label}</SmartLink>}</Reveal></section>

    {/* LEEN'S WORLD teaser: story, recognition and journal live on their own page, the homepage just opens the door */}
    <section className="px-5 pb-24 pt-8 md:px-8">
      <Reveal><div className="mb-8 flex items-end justify-between"><div><div className="label mb-4">{world.eyebrow}</div><h2 className={H2}>{world.headline}</h2></div>
        <Link to="/leens-world" className="link-line hidden md:inline-block">Enter Leen's World</Link></div></Reveal>
      {/* Each card shows a photo when one exists (Admin > Content > Our story / Recognition, and the newest Journal post); otherwise the colour block with a triangle. */}
      <div className="grid gap-3 md:grid-cols-3 md:gap-5">{[
        { t: 'Our story', d: 'How a triangle became a bag.', to: '/leens-world#story', bg: 'bg-navy text-white', tri: 'bg-lilac', img: c('story').image_url },
        { t: 'Recognition', d: 'Worn by Her Majesty Queen Rania.', to: '/leens-world#recognition', bg: 'bg-lilac', tri: 'bg-white/60', img: c('press').image_url },
        { t: 'The Journal', d: 'Stories, guides and style notes.', to: '/leens-world#journal', bg: 'bg-blush', tri: 'bg-hot/70', img: journal.data?.find((p) => p.image_url)?.image_url },
      ].map((x, i) => <Reveal key={x.t} delay={i * 0.06}><Link to={x.to} className={`group relative flex aspect-[4/3] flex-col justify-end overflow-hidden p-7 md:aspect-[4/5] ${x.img ? 'bg-ink text-white' : x.bg}`}>
        {x.img ? <><Media image={x.img} /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" /></>
          : <div className={`tri absolute right-[10%] top-[12%] h-[46%] w-[42%] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 ${x.tri}`} />}
        <h3 className="relative font-serif text-4xl normal-case leading-none tracking-tight">{x.t}</h3>
        <p className="prose-soft relative mt-3 opacity-80">{x.d}</p><span className="link-line relative mt-5 inline-block self-start">Discover</span></Link></Reveal>)}</div>
      <Link to="/leens-world" className="link-line mt-8 inline-block md:hidden">Enter Leen's World</Link>
    </section>

    {/* #LEENCLIQUE: community */}
    <section className="px-5 py-24 md:px-8">
      <Reveal><div className="mx-auto mb-10 max-w-2xl text-center"><div className="label mb-5">{clique.eyebrow}</div><h2 className={H2}>{clique.headline}</h2><p className="prose-soft mt-5">{clique.text}</p>
        {clique.instagram_url && <SmartLink to={clique.instagram_url} className="link-line mt-6 inline-block">Follow on Instagram</SmartLink>}</div></Reveal>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">{clique.images?.length ? clique.images.slice(0, 12).map((im: { url: string; alt?: string }, i: number) =>
        <SmartLink key={i} to={clique.instagram_url || '/'} className="block aspect-square overflow-hidden"><img src={im.url} alt={im.alt || 'Leen community'} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" /></SmartLink>)
        : TILES.map((t, i) => <div key={i} className={`flex aspect-square items-center justify-center ${t}/30`}><div className={`tri h-1/2 w-1/2 ${t}`} /></div>)}</div></section>

    {/* NEWSLETTER */}
    <section className="px-5 pb-16 pt-8 text-center md:px-8"><Reveal><h2 className={H2}>{news.headline}</h2><p className="mt-5 text-mute">{news.text}</p><Newsletter /></Reveal></section>
  </>;
}
