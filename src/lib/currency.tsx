// Currency choice. Prices are stored in JOD; this shows them in the visitor's chosen currency (display only: the server converts again
// with the same rule for the bag, checkout and the order, so what you see is what you pay). The choice is remembered in the browser.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import { convert } from './convert';
import { money } from './format';

export interface Cur { code: string; name: string; symbol: string; rate: number; decimals: number; round_step: number }
export const CURRENCY_KEY = 'leen_currency';
const stored = () => { try { return localStorage.getItem(CURRENCY_KEY) || 'JOD'; } catch { return 'JOD'; } };
interface Ctx { list: Cur[]; code: string; set: (c: string) => void; fmt: (jod: number) => string }
const C = createContext<Ctx>({ list: [], code: 'JOD', set: () => {}, fmt: (n) => money(n, 'JOD') });
export const useCurrency = () => useContext(C);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Cur[]>([]); const [code, setCode] = useState(stored);
  useEffect(() => { api<Cur[]>('/currencies').then((l) => { setList(l); if (!l.some((c) => c.code === code)) pick('JOD'); }).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (c: string) => { setCode(c); try { localStorage.setItem(CURRENCY_KEY, c); } catch { /* private mode */ } window.dispatchEvent(new Event('leen-currency')); };   // the bag listens and re-prices itself
  const cur = list.find((c) => c.code === code);
  const fmt = (jod: number) => cur && cur.code !== 'JOD' ? money(convert(jod, cur), cur.code) : money(jod, 'JOD');
  return <C.Provider value={{ list, code, set: pick, fmt }}>{children}</C.Provider>;
}

export function CurrencySelect({ className = '' }: { className?: string }) {
  const { list, code, set } = useCurrency();
  if (list.length < 2) return null;
  return <select aria-label="Currency" value={code} onChange={(e) => set(e.target.value)}
    className={`cursor-pointer bg-transparent uppercase tracking-[.14em] outline-none [&>option]:text-black ${className}`}>{list.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select>;
}
