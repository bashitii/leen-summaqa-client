// The slowly moving "As featured in" strip. Shows the uploaded logos; until logos exist it shows the outlet names in the serif font.
// Each logo can carry an article link (link_url, set in Admin > Content > As featured in): a click opens the article in a new tab.
// Two identical copies sit side by side and CSS slides the track by 50% forever (see .marquee in index.css), so it loops without a jump.
import type { Section } from '../lib/content';

type Logo = { url: string; alt?: string; link_url?: string };
const SAFE = /^https?:\/\//;                                   // only real web links (blocks javascript: etc.)

export default function Marquee({ featured }: { featured: Section }) {
  const logos: Logo[] = featured.logos ?? [];
  const names: string[] = featured.outlets ?? [];
  const items: (Logo | string)[] = logos.length ? logos : names;
  if (!items.length) return null;
  // A copy must be wider than the screen, otherwise a gap shows. With few items we repeat them until there are at least 8.
  const copy = Array.from({ length: Math.ceil(8 / items.length) }).flatMap(() => items);
  const one = (key: string) => <div key={key} className="flex shrink-0 items-center gap-16 pr-16 md:gap-24 md:pr-24" aria-hidden={key === 'b'}>
    {copy.map((it, i) => typeof it === 'string'
      ? <span key={i} className="whitespace-nowrap font-serif text-3xl normal-case tracking-tight text-ink/70 md:text-5xl">{it}</span>
      : (() => { const img = <img src={it.url} alt={key === 'a' ? it.alt || 'Featured in' : ''} loading="lazy" className="h-12 w-auto max-w-none object-contain md:h-16" />;
          // The second copy only exists to make the loop seamless, so its links are skipped by keyboard and screen readers.
          return it.link_url && SAFE.test(it.link_url)
            ? <a key={i} href={it.link_url} target="_blank" rel="noopener noreferrer" tabIndex={key === 'b' ? -1 : 0} aria-label={key === 'a' ? `${it.alt || 'Article'} (opens the article)` : undefined}
                className="shrink-0 opacity-80 transition-opacity hover:opacity-100">{img}</a>
            : <span key={i} className="shrink-0">{img}</span>; })())}</div>;
  return <div className="marquee"><div className="marquee-track">{one('a')}{one('b')}</div></div>;
}
