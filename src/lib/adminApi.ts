// Admin-side API helper: keeps the login tokens, attaches them to every request, refreshes once if they expired.
// NOTE: tokens live in localStorage for simplicity. Fine for a small admin; a hardened version would use httpOnly cookies.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const K = 'leen_admin_tokens';
type Tokens = { access: string; refresh: string };
export const tokens = {
  get: (): Tokens | null => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch { return null; } },
  set: (t: Tokens) => localStorage.setItem(K, JSON.stringify(t)),
  clear: () => localStorage.removeItem(K),
};

async function send(path: string, init: RequestInit, retry = true): Promise<Response> {
  const t = tokens.get();
  const res = await fetch(BASE + path, { ...init, headers: { ...(init.headers as object), ...(t ? { Authorization: `Bearer ${t.access}` } : {}) } });
  if (res.status === 401 && retry && t?.refresh) {                       // access token expired -> try the refresh token once
    const r = await fetch(BASE + '/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: t.refresh }) });
    if (r.ok) { const j = await r.json(); tokens.set({ access: j.access_token, refresh: j.refresh_token }); return send(path, init, false); }
    tokens.clear();
  }
  return res;
}
// Despite the name this is the generic "signed-in API call" used by customers AND admins.
export async function adminApi<T>(path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}): Promise<T> {
  const res = await send(path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Request failed'); }
  return res.status === 204 ? (undefined as T) : res.json();
}
export async function adminLogin(email: string, password: string) {
  const res = await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('Invalid email or password');
  const j = await res.json(); tokens.set({ access: j.access_token, refresh: j.refresh_token });
}

// Shrink big camera photos in the browser BEFORE uploading (max 2000px, WebP) -> faster uploads and a faster storefront.
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file); const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.85));
    return blob ?? file;
  } catch { return file; }
}
// The same picture at three widths, so phones download a small one (see lib/img.ts). Falls back to one file if WebP is unsupported.
const WIDTHS = [480, 960, 1600] as const;
async function resized(file: File): Promise<{ w: number; blob: Blob }[] | null> {
  try {
    const bmp = await createImageBitmap(file); const out: { w: number; blob: Blob }[] = [];
    for (const w of WIDTHS) {
      const k = Math.min(1, w / bmp.width); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82));
      if (!blob || blob.type !== 'image/webp') return null;
      out.push({ w, blob });
    }
    return out;
  } catch { return null; }
}
export async function uploadImage(file: File, bucket: 'products' | 'campaigns' | 'editorial' | 'branding' = 'products'): Promise<string> {
  const post = async (blob: Blob, qs: string) => {
    const res = await send(`/admin/uploads?bucket=${bucket}${qs}`, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Upload failed'); }
    return (await res.json()).url as string;
  };
  const sizes = await resized(file); if (!sizes) return post(await shrink(file), '');
  const id = crypto.randomUUID();
  const urls = await Promise.all(sizes.map((x) => post(x.blob, `&name=${id}&w=${x.w}`)));
  return urls[urls.length - 1];                       // the 1600px version is the address saved in the database
}
