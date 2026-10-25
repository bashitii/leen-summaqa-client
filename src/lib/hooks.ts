import { useEffect, useState } from 'react';
import { api } from './api';

// Tiny data-fetching hook: loads on mount / when params change, ignores stale responses (the `alive` flag).
export function useApi<T>(path: string, params?: Record<string, string | number | undefined | null>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const key = path + JSON.stringify(params ?? {});
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>(path, params).then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

// SEO: sets <title>, description, canonical, Open Graph + Twitter cards, robots and JSON-LD for each page.
// Every tag is overwritten or removed on each page change, so one page's image or "noindex" never leaks into the next.
const DEFAULT_DESC = 'Leen Summaqa: bold geometric handbags handcrafted in Egypt and Türkiye. We ship worldwide.';
const drop = (sel: string) => document.head.querySelector(sel)?.remove();
export function useSeo(o: { title: string; description?: string; image?: string; type?: 'website' | 'product'; noindex?: boolean; jsonLd?: object }) {
  useEffect(() => {
    const full = `${o.title} — Leen Summaqa`; document.title = full;
    const upsert = (sel: string, make: () => HTMLElement, attr: string, val: string) => {
      let el = document.head.querySelector<HTMLElement>(sel); if (!el) { el = make(); document.head.appendChild(el); } el.setAttribute(attr, val);
    };
    const meta = (name: string, val: string, prop = false) => upsert(`meta[${prop ? 'property' : 'name'}="${name}"]`,
      () => { const m = document.createElement('meta'); m.setAttribute(prop ? 'property' : 'name', name); return m; }, 'content', val);
    const desc = o.description || DEFAULT_DESC, url = location.origin + location.pathname;
    meta('description', desc); meta('og:description', desc, true); meta('twitter:description', desc);
    meta('og:title', full, true); meta('twitter:title', full); meta('og:type', o.type ?? 'website', true); meta('og:url', url, true);
    if (o.image) { meta('og:image', o.image, true); meta('twitter:image', o.image); } else { drop('meta[property="og:image"]'); drop('meta[name="twitter:image"]'); }
    meta('twitter:card', o.image ? 'summary_large_image' : 'summary');
    if (o.noindex) meta('robots', 'noindex, nofollow'); else drop('meta[name="robots"]');
    upsert('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }, 'href', url);
    document.getElementById('ld-json')?.remove();
    if (o.jsonLd) { const s = document.createElement('script'); s.id = 'ld-json'; s.type = 'application/ld+json'; s.text = JSON.stringify(o.jsonLd); document.head.appendChild(s); }
    return () => { document.getElementById('ld-json')?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.title, o.description, o.image, o.type, o.noindex, JSON.stringify(o.jsonLd)]);
}
