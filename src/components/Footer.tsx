import { Link } from 'react-router-dom';
import { analyticsConfigured } from '../lib/analytics';
import { CurrencySelect } from '../lib/currency';
const col = (title: string, links: [string, string][]) => <div><h5 className="label mb-3">{title}</h5>
  <ul className="space-y-2">{links.map(([t, to]) => <li key={t}><Link to={to}>{t}</Link></li>)}</ul></div>;
export default function Footer() {
  return <footer className="mt-24 grid grid-cols-2 gap-8 border-t border-line px-5 py-14 text-[10px] md:grid-cols-4 md:px-8">
    {col('Shop', [['Shop', '/shop'], ['Collections', '/collections']])}
    {col('Help', [['FAQ', '/faq'], ['Shipping', '/shipping'], ['Returns', '/returns'], ['Contact', '/contact']])}
    {col('House', [["Leen's World", '/leens-world'], ['Journal', '/leens-world#journal'], ['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']])}
    <div><h5 className="label mb-3">Follow</h5><ul className="space-y-2">
      <li><a href="https://www.instagram.com/leensummaqa" target="_blank" rel="noreferrer">Instagram</a></li>
      <li><a href="https://www.facebook.com/leensummaqa" target="_blank" rel="noreferrer">Facebook</a></li></ul>
      <div className="mt-6"><CurrencySelect /></div></div>
    <div className="label col-span-full flex justify-between border-t border-line pt-6"><span>© 2026 Leen Summaqa</span><span>We ship worldwide{analyticsConfigured && <> · <button onClick={() => window.dispatchEvent(new Event('leen-cookie-settings'))}>Cookie settings</button></>}</span></div>
  </footer>;
}
