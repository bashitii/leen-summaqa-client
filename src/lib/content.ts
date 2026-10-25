// Editable site content. The homepage asks the API for its sections (/content/homepage); anything missing falls back to
// DEFAULTS below, so the site never shows empty blocks. The same words are seeded in the database (supabase/seed_content.sql).
import { useApi } from './hooks';
export type Section = Record<string, any>;

export const DEFAULTS: Record<string, Section> = {
  hero: { headline: 'Designed to stand out', cta_label: 'Shop the collection', cta_url: '/shop', image_url: '', video_url: '' },
  featured_collection: { eyebrow: 'The Summer Edit', title: 'Leila Raffia Bag', text: 'Discover our latest collection featuring premium quality and modern handmade design.', collection_slug: 'the-summer-edit', image_url: '', cta_label: 'Shop now', cta_url: '/products/leila-bag' },
  campaign: { eyebrow: 'The Leen woman', headline: 'Confident. Individual. Unapologetic.', text: '', image_url: '', video_url: '', cta_label: 'Shop the collection', cta_url: '/shop' },
  press: { eyebrow: 'Recognition', headline: 'Worn by Her Majesty Queen Rania on Independence Day.', text: 'Her Majesty Queen Rania Al Abdullah chose to celebrate Independence Day with our Mini Triangular bag.', image_url: '', cta_label: 'Shop the bag', cta_url: '/shop', outlets: [] },
  story: { eyebrow: 'The House', headline: 'Art, carried every day.', image_url: '', cta_label: 'Read the story', cta_url: '/about', body: 'Founded by Leen Abu Summaqa in 2019, the brand transforms bold geometric design, especially triangles, into standout handbags that blend art with everyday function.\n\nEach piece reflects confidence and individuality, made for women who express, not blend in.' },
  clique: { eyebrow: '#Leenclique', headline: 'Join the #Leenclique', text: 'Share your Leen bag on Instagram with the hashtag #Leenclique.', instagram_url: 'https://www.instagram.com/leensummaqa', images: [] },
  world: { eyebrow: "Leen's World", headline: 'Inside the world of Leen', text: 'The story, the moments and the people behind the bags.', image_url: '' },
  featured: { eyebrow: 'As featured in', logos: [], outlets: ['ET بالعربي', 'سيدتي', 'زهرة الخليج', 'Soigné Middle East', "Harper's Bazaar Arabia", 'Marie Claire Arabia', 'HIA', 'Marseille Provence Airport'] },
  newsletter: { headline: 'Enter the Leen world', text: 'Be the first to discover new collections, limited pieces and exclusive releases.' },
};

export function useHomeContent() {
  const { data } = useApi<Record<string, Section>>('/content/homepage');
  return (key: string): Section => ({ ...DEFAULTS[key], ...(data?.[key] ?? {}) });
}
export interface Post { slug: string; title: string; excerpt: string; image_url: string; published_at: string; body?: string }
export const useJournal = () => useApi<Post[]>('/content/journal');
export const usePost = (slug: string) => useApi<Post>(`/content/journal/${slug}`);
export const postDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export const usePage = (slug: string) => useApi<Section>(`/content/pages/${slug}`);
