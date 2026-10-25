import { useLocation } from 'react-router-dom';
import { useSeo } from '../lib/hooks';
export default function Static({ notFound = false }: { notFound?: boolean }) {
  const name = useLocation().pathname.replace('/', '') || 'page';
  useSeo({ title: notFound ? 'Not found' : name, noindex: notFound });
  return <section className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center">
    <div><h1 className="font-serif text-5xl normal-case tracking-normal md:text-7xl">{notFound ? 'Page not found' : name}</h1>
      {!notFound && <p className="label mt-4">Coming in a later phase</p>}</div></section>;
}
