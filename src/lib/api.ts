// All talking to the Express API goes through here: one place for the base URL, errors and types.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export interface Variant { id: string; sku: string; color_name: string | null; color_hex: string | null; size_label: string | null;
  price: number; available: boolean; preorder: boolean }
export interface Img { url: string; alt_text: string | null; sort_order: number; is_hover: boolean; variant_id?: string | null }   // variant_id = the colour this photo belongs to; empty = shared
export interface Product { id: string; slug: string; name: string; description: string | null; material: string | null; dimensions: string | null;
  base_price: number; currency: string; is_featured: boolean; images: Img[]; hover_image: Img | null; variants: Variant[];
  sold_out: boolean; category: { slug: string; name: string } | null; related?: Product[] }
export interface Collection { id: string; slug: string; title: string; description: string | null; hero_image_url: string | null; intro_text?: string | null }
export interface Category { slug: string; name: string }

export async function api<T>(path: string, params?: Record<string, string | number | undefined | null>, init?: RequestInit): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
  const q = qs.toString();
  const res = await fetch(`${BASE}${path}${q ? `?${q}` : ''}`, init);
  if (!res.ok) throw new Error(res.status === 404 ? 'NOT_FOUND' : 'REQUEST_FAILED');
  return res.json() as Promise<T>;
}
