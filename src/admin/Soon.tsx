import { useLocation } from 'react-router-dom';
// Orders, customers, discounts, content and settings arrive in later phases.
export default function Soon() { const n = useLocation().pathname.split('/')[2]; return <><h1 className="font-serif text-4xl capitalize">{n}</h1><p className="label mt-3">Coming in a later phase</p></>; }
