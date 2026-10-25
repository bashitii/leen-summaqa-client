// ANALYTICS. Off by default. It switches on only when you set VITE_GA_ID (Google Analytics 4) and/or VITE_META_PIXEL_ID
// (Meta Pixel) AND the visitor accepts the cookie banner. Nothing is loaded or sent before consent.
// One function, track(), is called from the pages; it translates each event into Google's and Meta's names.
const GA = import.meta.env.VITE_GA_ID as string | undefined;
const PX = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
export const analyticsConfigured = !!(GA || PX);

const KEY = 'leen_consent';
export const getConsent = (): 'granted' | 'denied' | null => { try { return localStorage.getItem(KEY) as 'granted' | 'denied' | null; } catch { return null; } };
export const setConsent = (v: 'granted' | 'denied') => { try { localStorage.setItem(KEY, v); } catch { /* private mode: ignore */ } };

let loaded = false;
const w = window as any;
function load() {
  if (loaded || !analyticsConfigured) return; loaded = true;
  if (GA) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };            // Google's snippet needs the special `arguments` object
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`; document.head.appendChild(s);
    w.gtag('js', new Date()); w.gtag('config', GA, { send_page_view: false });   // page views are sent by hand (single-page app)
  }
  if (PX) {
    // Meta's standard loader snippet
    ((f: any, b: Document, e: string, v: string) => { if (f.fbq) return; const n: any = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement; t.async = true; t.src = v; const s = b.getElementsByTagName(e)[0]; s.parentNode!.insertBefore(t, s); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('init', PX);
  }
}
const on = () => loaded && getConsent() === 'granted';

export function enableAnalytics() { setConsent('granted'); load(); trackPage(location.pathname + location.search); }
export function declineAnalytics() { setConsent('denied'); }
/** Call when the visitor already accepted earlier: loads the scripts without asking again. */
export function resumeAnalytics() { if (getConsent() === 'granted') load(); }

export function trackPage(path: string) {
  if (!on()) return;
  if (GA) w.gtag('event', 'page_view', { page_path: path, page_title: document.title });
  if (PX) w.fbq('track', 'PageView');
}

export interface Item { id: string; name: string; price: number; quantity: number }
export type Params = { value?: number; currency?: string; items?: Item[]; term?: string; transaction_id?: string };
export function track(event: 'view_item' | 'search' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'newsletter_signup', p: Params = {}) {
  if (!on()) return;
  const items = p.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity }));
  if (GA) w.gtag('event', event === 'newsletter_signup' ? 'generate_lead' : event,
    { value: p.value, currency: p.currency, items, search_term: p.term, transaction_id: p.transaction_id });
  if (PX) {
    const ids = p.items?.map((i) => i.id), base = { value: p.value, currency: p.currency, content_ids: ids, content_type: 'product' };
    const map = { view_item: ['ViewContent', { ...base, content_name: p.items?.[0]?.name }], search: ['Search', { search_string: p.term }], add_to_cart: ['AddToCart', base],
      begin_checkout: ['InitiateCheckout', { ...base, num_items: p.items?.reduce((s, i) => s + i.quantity, 0) }], purchase: ['Purchase', base], newsletter_signup: ['Lead', {}] } as const;
    w.fbq('track', map[event][0], map[event][1]);
  }
}
