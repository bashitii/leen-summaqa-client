// The card payment page. HyperPay's own form (COPYandPAY) is loaded into the box below: the card number is typed into
// HyperPay's iframe and goes straight to HyperPay, so it never touches our code, server or database.
// After paying (and 3-D Secure) HyperPay sends the customer to /checkout/complete?id=..., where the server verifies the result.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeo } from '../lib/hooks';

export default function CardPay() {
  useSeo({ title: 'Payment', noindex: true });
  const [sp] = useSearchParams();
  const checkout = sp.get('checkout') ?? '', widget = sp.get('widget') ?? '', back = sp.get('return') ?? '', charge = sp.get('charge') ?? '';
  // Subresource Integrity hash from HyperPay (e.g. "sha384-..."): the browser refuses to run the card-form script if it does not match it.
  const integrityRaw = sp.get('integrity') ?? '', integrity = /^sha(256|384|512)-[A-Za-z0-9+/=]+$/.test(integrityRaw) ? integrityRaw : '';
  // Never load a script from an address the URL tells us to, unless it is HyperPay's own domain; only return to our own site.
  const widgetOk = /^https:\/\/[a-z0-9-]+\.oppwa\.com$/.test(widget) && /^[A-Za-z0-9._-]{8,80}$/.test(checkout);
  const backOk = back.startsWith(window.location.origin + '/');

  useEffect(() => {
    if (!widgetOk) return;
    // paymentTarget "_top" = 3-D Secure opens in the full window (HyperPay's instruction for full 3DS redirection).
    (window as any).wpwlOptions = { paymentTarget: '_top' };
    const s = document.createElement('script');
    if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }   // both must be set BEFORE src, or the browser skips the check
    s.src = `${widget}/v1/paymentWidgets.js?checkoutId=${encodeURIComponent(checkout)}`; s.async = true;
    document.body.appendChild(s);
    return () => { s.remove(); delete (window as any).wpwlOptions; };
  }, [widgetOk, widget, checkout, integrity]);

  if (!widgetOk || !backOk) return <p className="grid min-h-[70vh] place-items-center pt-24 text-mute">This payment link is not valid. Please go back to your order and press Pay now.</p>;
  return <section className="mx-auto min-h-[70vh] max-w-lg px-5 pb-16 pt-28 text-[11px]">
    <h1 className="font-serif text-5xl normal-case tracking-tight">Payment</h1>
    <p className="mt-3">Secure card payment by HyperPay (Visa, Mastercard).</p>
    <p className="mt-1 normal-case tracking-normal text-mute">Your card is charged in Jordanian dinar (JOD): <b className="text-ink">{charge} JOD</b>. If your order was shown in another currency, your bank converts it.</p>
    <div className="mt-8"><form action={back} className="paymentWidgets" data-brands="VISA MASTER" /></div>
    <a href={back} className="link-line mt-8 inline-block">Back to my order</a>
  </section>;
}
