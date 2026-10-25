import { useEffect, useState } from 'react';
import { analyticsConfigured, declineAnalytics, enableAnalytics, getConsent, resumeAnalytics } from '../lib/analytics';
// Cookie banner. It only exists when analytics is configured (VITE_GA_ID / VITE_META_PIXEL_ID); otherwise there is nothing to ask.
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!analyticsConfigured) return;
    resumeAnalytics(); if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true); window.addEventListener('leen-cookie-settings', reopen); return () => window.removeEventListener('leen-cookie-settings', reopen);
  }, []);
  if (!open) return null;
  return <div role="dialog" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-[90] flex flex-wrap items-center justify-between gap-4 border-t border-line bg-paper px-5 py-4 text-[11px]">
    <span className="max-w-xl normal-case tracking-normal text-[13px]">We use cookies to understand how the shop is used and to improve it. You can accept or decline.</span>
    <span className="flex gap-5"><button onClick={() => { declineAnalytics(); setOpen(false); }} className="underline">Decline</button>
      <button onClick={() => { enableAnalytics(); setOpen(false); }} className="bg-ink px-5 py-2 text-paper">Accept</button></span></div>;
}
