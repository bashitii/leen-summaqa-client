// Customer session. The same token store is used by the admin area (a user is a user; the ROLE decides what they can do).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { adminApi, adminLogin, tokens } from './adminApi';

export interface User { id: string; email: string; role: 'CUSTOMER' | 'ADMIN'; profile: { first_name: string | null; last_name: string | null; phone: string | null } | null }
interface Ctx { user: User | null; loading: boolean; login: (e: string, p: string) => Promise<void>;
  register: (b: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => Promise<'signed-in' | 'confirm-email'>;
  logout: () => void; reload: () => Promise<void> }
const A = createContext<Ctx>(null!);
export const useAuth = () => useContext(A);
const announce = () => window.dispatchEvent(new Event('leen-auth'));   // tells the cart "the user changed: merge + refresh"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!tokens.get()) { setUser(null); setLoading(false); return; }
    try { setUser(await adminApi<User>('/me')); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); window.addEventListener('leen-auth', reload); return () => window.removeEventListener('leen-auth', reload); }, [reload]);
  const login = async (email: string, password: string) => { await adminLogin(email, password); announce(); };
  const register: Ctx['register'] = async (body) => {
    const r = await adminApi<{ session: { access_token: string; refresh_token: string } | null }>('/auth/register', 'POST', body);
    if (r.session) { tokens.set({ access: r.session.access_token, refresh: r.session.refresh_token }); announce(); return 'signed-in'; }
    return 'confirm-email';          // Supabase is configured to require e-mail confirmation first
  };
  const logout = () => { tokens.clear(); announce(); };
  return <A.Provider value={{ user, loading, login, register, logout, reload }}>{children}</A.Provider>;
}
