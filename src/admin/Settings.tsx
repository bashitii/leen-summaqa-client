import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { btn, btn2, Check, Field, input } from './ui';
import { convert } from '../lib/convert';
// SETTINGS = which countries you ship to + the shipping price for each. Checkout refuses a country with no rate,
// so nothing is ever guessed: you enter the real prices here.
export default function Settings() {
  const [countries, setCountries] = useState<any[]>([]); const [rates, setRates] = useState<any[]>([]); const [err, setErr] = useState('');
  const [c, setC] = useState({ code: '', name: '', currency: 'JOD', ships_to: true }); const [r, setR] = useState({ country_code: '', min_subtotal: '0', price: '' });
  const load = () => { adminApi<any[]>('/admin/countries').then(setCountries); adminApi<any[]>('/admin/shipping-rates').then(setRates); }; useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>) => { setErr(''); try { await fn(); load(); } catch (e) { setErr((e as Error).message); } };
  return <div className="max-w-3xl space-y-12"><h1 className="font-serif text-4xl">Settings</h1>{err && <p className="text-hot">{err}</p>}
    <CurrencyRates />
    <section><h2 className="label mb-3">Countries</h2>
      <table className="w-full text-left"><tbody>{countries.map((x) => <tr key={x.code} className="border-t border-line"><td className="py-2">{x.code}</td><td>{x.name}</td><td>{x.currency}</td>
        <td><Check label="Ships here" checked={x.ships_to} onChange={(b) => run(() => adminApi(`/admin/countries/${x.code}`, 'PUT', { name: x.name, currency: x.currency, ships_to: b }))} /></td>
        <td className="text-right"><button className="text-mute hover:text-hot" onClick={() => confirm(`Remove ${x.name}?`) && run(() => adminApi(`/admin/countries/${x.code}`, 'DELETE'))}>Remove</button></td></tr>)}</tbody></table>
      <form className="mt-4 grid grid-cols-[70px_1fr_80px_auto] items-end gap-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await adminApi(`/admin/countries/${c.code}`, 'PUT', { name: c.name, currency: c.currency, ships_to: c.ships_to }); setC({ ...c, code: '', name: '' }); }); }}>
        <Field label="Code"><input className={input} required maxLength={2} placeholder="JO" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Name"><input className={input} required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
        <Field label="Currency"><input className={input} required maxLength={3} value={c.currency} onChange={(e) => setC({ ...c, currency: e.target.value.toUpperCase() })} /></Field><button className={btn2}>Add country</button></form></section>
    <section><h2 className="label mb-3">Shipping rates</h2>
      <p className="mb-3 text-mute">The matching rate with the highest "from subtotal" applies. Add a second rate with price 0 for a free-shipping threshold.</p>
      <table className="w-full text-left"><tbody>{rates.map((x) => <tr key={x.id} className="border-t border-line"><td className="py-2">{x.country_code}</td><td>from subtotal {x.min_subtotal}</td><td>price {x.price}</td>
        <td className="text-right"><button className="text-mute hover:text-hot" onClick={() => run(() => adminApi(`/admin/shipping-rates/${x.id}`, 'DELETE'))}>Remove</button></td></tr>)}</tbody></table>
      <form className="mt-4 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await adminApi('/admin/shipping-rates', 'POST', { country_code: r.country_code, min_subtotal: Number(r.min_subtotal) || 0, price: Number(r.price) }); setR({ ...r, price: '' }); }); }}>
        <Field label="Country"><select className={input} required value={r.country_code} onChange={(e) => setR({ ...r, country_code: e.target.value })}><option value="">Select</option>{countries.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select></Field>
        <Field label="From subtotal (JOD)"><input className={input} type="number" min="0" step="0.001" value={r.min_subtotal} onChange={(e) => setR({ ...r, min_subtotal: e.target.value })} /></Field>
        <Field label="Shipping price (JOD)"><input className={input} required type="number" min="0" step="0.001" value={r.price} onChange={(e) => setR({ ...r, price: e.target.value })} /></Field><button className={btn}>Add rate</button></form></section></div>;
}

// CURRENCIES. Prices everywhere are entered in JOD. For another currency the site multiplies by the rate below and rounds to the step
// (step 1 = whole numbers). "On" makes the currency available to customers: switch on only currencies your payment account can charge.
interface CurRow { code: string; name: string; symbol: string; rate: string; round_step: string; decimals: string; is_active: boolean; rate_updated_at: string | null }
function CurrencyRates() {
  const [rows, setRows] = useState<CurRow[]>([]); const [err, setErr] = useState(''); const [saved, setSaved] = useState('');
  useEffect(() => { adminApi<any[]>('/admin/currencies').then((l) => setRows(l.map((x) => ({ ...x, code: String(x.code).trim(), rate: String(x.rate), round_step: String(x.round_step), decimals: String(x.decimals) })))).catch((e) => setErr(e.message)); }, []);
  const load = () => adminApi<any[]>('/admin/currencies').then((l) => setRows(l.map((x) => ({ ...x, code: String(x.code).trim(), rate: String(x.rate), round_step: String(x.round_step), decimals: String(x.decimals) })))).catch((e) => setErr(e.message));
  // "Refresh now": the server fetches today's live rates for every currency that is on "Live", then we reload the table.
  const refresh = async () => { setErr(''); setSaved('refreshing'); try { const r = await adminApi<{ error?: string }>('/admin/currencies/refresh', 'POST', {}); if (r.error) setErr(`Could not reach the rates service (old rates kept): ${r.error}`); await load(); setSaved('refreshed'); } catch (e) { setErr((e as Error).message); } };
  const edit = (code: string, patch: Partial<CurRow>) => { setRows((r) => r.map((x) => x.code === code ? { ...x, ...patch } : x)); setSaved(''); };
  const save = async (x: CurRow) => { setErr('');
    try { await adminApi(`/admin/currencies/${x.code}`, 'PUT', { name: x.name, symbol: x.symbol, rate: Number(x.rate), decimals: Number(x.decimals), round_step: Number(x.round_step), is_active: x.is_active }); setSaved(x.code); }
    catch (e) { setErr((e as Error).message); } };
  return <section><h2 className="label mb-3">Currencies</h2>
    <p className="mb-3 text-mute">Rate = how many units equal 1 JOD. Rates are live: the server reads them from an exchange-rate service every few hours and nobody types them. The example column shows what a 60 JOD bag would cost.</p>
    <button className={`${btn2} mb-3`} onClick={refresh}>{saved === 'refreshing' ? 'Refreshing…' : saved === 'refreshed' ? 'Rates refreshed' : 'Refresh rates now'}</button>
    {err && <p className="mb-2 text-hot">{err}</p>}
    <table className="w-full text-left"><thead className="label"><tr><th className="py-2 font-normal">Currency</th><th className="font-normal">Live rate</th><th className="font-normal">Round to</th><th className="font-normal">60 JOD =</th><th className="font-normal">On</th><th /></tr></thead>
      <tbody>{rows.map((x) => { const ok = Number(x.rate) > 0 && Number(x.round_step) > 0;
        return <tr key={x.code} className="border-t border-line"><td className="py-2">{x.code} <span className="text-mute">{x.name}</span>{x.code !== 'JOD' && x.rate_updated_at && <span className="block text-[10px] text-mute">live · updated {new Date(x.rate_updated_at).toLocaleString()}</span>}</td>
          <td>{x.code === 'JOD' ? <span className="text-mute">base</span> : Number(x.rate).toFixed(4)}</td>
          <td><input className={`${input} !w-20`} type="number" step="0.001" min="0.001" disabled={x.code === 'JOD'} value={x.round_step} onChange={(e) => edit(x.code, { round_step: e.target.value })} /></td>
          <td>{ok ? `${convert(60, { rate: Number(x.rate), round_step: Number(x.round_step), decimals: Number(x.decimals) })} ${x.code}` : '—'}</td>
          <td><Check label="" checked={x.is_active} onChange={(b) => x.code !== 'JOD' && edit(x.code, { is_active: b })} /></td>
          <td className="text-right"><button className={btn2} onClick={() => save(x)}>{saved === x.code ? 'Saved' : 'Save'}</button></td></tr>; })}</tbody></table></section>;
}
