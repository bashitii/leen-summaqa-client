// LEEN'S WORLD: everything about the brand that is not a product, in one calm editorial page.
// Order: intro -> story -> recognition (Queen Rania) -> moving "as featured in" strip -> journal (blog).
// All text/images come from Admin > Content (sections: world, story, press, featured) and Admin > Journal.
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Reveal from '../components/Reveal';
import Prose, { SmartLink } from '../components/Prose';
import Marquee from '../components/Marquee';
import { useHomeContent, useJournal, postDate } from '../lib/content';
import { useSeo } from '../lib/hooks';
import { SIZES, srcSet } from '../lib/img';

const H2 = 'font-serif text-[clamp(34px,5vw,76px)] normal-case leading-none tracking-tight';
const GRADS = ['linear-gradient(120deg,#d7ccea,#b9a7d6)', 'linear-gradient(120deg,#f1c4cf,#e8a9bb)', 'linear-gradient(120deg,#a9cbe8,#7fa9d1)'];

export default function World() {
  const c = useHomeContent(); const world = c('world'), story = c('story'), press = c('press'), featured = c('featured');
  const posts = useJournal().data ?? [];
  const { hash } = useLocation();
  useSeo({ title: "Leen's World", description: 'The story of Leen Summaqa, the moments that shaped the brand, and the journal.' });
  // Links like /leens-world#journal: the router starts every page at the top, so we scroll to the section once the page is drawn.
  useEffect(() => { if (!hash) return; const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150); return () => clearTimeout(t); }, [hash, posts.length]);

  return <>
    {/* INTRO */}
    <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-44">
      {/* The three dots from the logo (same purples), stacked, instead of triangles. Purely decorative. */}
      <div aria-hidden className="pointer-events-none absolute right-[6vw] top-[22vmin] flex flex-col gap-[3vmin] md:right-[10vw] md:top-[20vmin] md:gap-[3.5vmin]">
        {['#571176', '#955fad', '#d6bfe0'].map((col) => <span key={col} className="block h-[12vmin] w-[12vmin] rounded-full md:h-[17vmin] md:w-[17vmin]" style={{ background: col }} />)}
      </div>
      <Reveal className="relative max-w-4xl"><div className="label mb-7">{world.eyebrow}</div>
        <h1 className="font-serif text-[clamp(48px,9vw,140px)] normal-case leading-[.92] tracking-tight">{world.headline}</h1>
        <p className="prose-soft mt-8 max-w-[44ch] text-mute">{world.text}</p>
        <nav className="label mt-10 flex flex-wrap gap-x-8 gap-y-2 text-ink">{[['Our story', 'story'], ['Recognition', 'recognition'], ['As featured in', 'featured'], ['The journal', 'journal']].map(([t, id]) =>
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); history.replaceState(null, '', `#${id}`); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }} className="link-line">{t}</a>)}</nav></Reveal>
      {world.image_url && <Reveal className="relative mt-14"><img src={world.image_url} srcSet={srcSet(world.image_url)} sizes={SIZES.full} alt="" className="aspect-[16/9] w-full object-cover" /></Reveal>}
    </section>

    {/* OUR STORY */}
    <section id="story" className="grid scroll-mt-24 items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24">
      <Reveal><div className="relative aspect-[4/5] overflow-hidden bg-navy">{story.image_url ? <img src={story.image_url} srcSet={srcSet(story.image_url)} sizes={SIZES.lead} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="tri absolute left-[15%] top-[18%] h-[70%] w-[70%] bg-lilac" />}</div></Reveal>
      <Reveal delay={0.1}><div className="label mb-7">{story.eyebrow}</div><h2 className={H2}>{story.headline}</h2><Prose text={story.body} className="mt-6 max-w-[46ch]" />
        {story.cta_url && <SmartLink to={story.cta_url} className="link-line mt-8 inline-block">{story.cta_label}</SmartLink>}</Reveal>
    </section>

    {/* RECOGNITION */}
    <section id="recognition" className="scroll-mt-24 bg-navy px-5 py-24 text-center text-white md:px-8 md:py-32">
      <Reveal><div className="mb-7 text-[10px] text-white/60">{press.eyebrow}</div>
        <h2 className={`${H2} mx-auto max-w-[18ch]`}>{press.headline}</h2>
        {press.image_url && <img src={press.image_url} srcSet={srcSet(press.image_url)} sizes={SIZES.lead} alt="" loading="lazy" className="mx-auto mt-12 max-h-[520px] w-auto object-contain" />}
        <p className="prose-soft mx-auto my-8 max-w-[52ch] text-white/75">{press.text}</p>
        {press.cta_url && <SmartLink to={press.cta_url} className="link-line">{press.cta_label}</SmartLink>}</Reveal></section>

    {/* AS FEATURED IN: moving strip */}
    <section id="featured" className="scroll-mt-24 py-20 md:py-28">
      <Reveal><div className="label mb-10 text-center">{featured.eyebrow}</div></Reveal>
      <Marquee featured={featured} /></section>

    {/* THE JOURNAL */}
    <section id="journal" className="scroll-mt-24 border-t border-line px-5 py-20 md:px-8 md:py-28">
      <Reveal><div className="mb-12 flex items-end justify-between"><h2 className={H2}>The Journal</h2><span className="label hidden md:block">Stories, guides and style notes</span></div></Reveal>
      {posts.length === 0 ? <p className="text-mute">New stories are coming soon.</p> :
        <div className="grid gap-x-6 gap-y-14 md:grid-cols-3">{posts.map((p, i) => <Reveal key={p.slug} delay={i * 0.06}>
          <Link to={`/leens-world/journal/${p.slug}`} className="group block">
            <div className="relative mb-5 aspect-[4/5] overflow-hidden" style={{ background: GRADS[i % 3] }}>
              {p.image_url ? <img src={p.image_url} srcSet={srcSet(p.image_url)} sizes="(min-width: 768px) 33vw, 100vw" alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.04]" />
                : <div className="tri absolute left-[20%] top-[22%] h-[56%] w-[60%] bg-white/50 transition-transform duration-700 group-hover:scale-105" />}</div>
            <div className="label mb-3">{postDate(p.published_at)}</div>
            <h3 className="font-serif text-3xl normal-case leading-tight tracking-tight">{p.title}</h3>
            {p.excerpt && <p className="prose-soft mt-3 text-mute">{p.excerpt}</p>}
            <span className="link-line mt-5 inline-block">Read</span></Link></Reveal>)}</div>}
    </section>
  </>;
}
