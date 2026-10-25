import { CartBody } from '../components/Cart';
import { useSeo } from '../lib/hooks';
export default function CartPage() {
  useSeo({ title: 'Bag', noindex: true });
  return <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-5 pb-10 pt-28"><h1 className="mb-6 font-serif text-5xl normal-case tracking-tight">Bag</h1><CartBody /></section>;
}
