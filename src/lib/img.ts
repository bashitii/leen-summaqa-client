// Responsive pictures. Admin uploads are stored at three widths (see uploadImage): <name>-480.webp, -960.webp, -1600.webp.
// Given the 1600 address saved in the database, these helpers let the browser download the smallest size that fits the screen
// (a phone grid card needs ~480px, not 1600px). Older single-size uploads simply get no srcset and still work.
const BIG = /-1600\.webp$/;
export const srcSet = (url?: string | null): string | undefined => url && BIG.test(url)
  ? `${url.replace(BIG, '-480.webp')} 480w, ${url.replace(BIG, '-960.webp')} 960w, ${url} 1600w` : undefined;
export const thumb = (url?: string | null): string | undefined => url && BIG.test(url) ? url.replace(BIG, '-480.webp') : url ?? undefined;
export const SIZES = { grid: '(min-width: 768px) 25vw, 50vw', full: '100vw', lead: '(min-width: 768px) 58vw, 100vw', gallery: '(min-width: 768px) 56vw, 100vw' };
