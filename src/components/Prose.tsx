// Safe text renderer for admin-written content. It builds React elements (never raw HTML), so content cannot inject scripts.
// Supported: blank line = new paragraph, "## Title" = heading, lines starting "- " = bullet list, [label](link) = link, **bold**.
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

const SAFE = /^(https?:\/\/|\/|mailto:)/;
export function SmartLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (!SAFE.test(to)) return <span className={className}>{children}</span>;               // refuse javascript: and other schemes
  return to.startsWith('/') ? <Link to={to} className={className}>{children}</Link> : <a href={to} className={className} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{children}</a>;
}
function bold(text: string, k: string): ReactNode[] {                 // **word** -> <strong>word</strong>
  return text.split(/\*\*([^*]+)\*\*/).map((part, i) => i % 2 ? <strong key={`${k}${i}`} className="font-semibold">{part}</strong> : part);
}
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []; const re = /\[([^\]]+)\]\(([^)\s]+)\)/g; let last = 0, n = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) { if (m.index > last) out.push(...bold(text.slice(last, m.index), `b${n}`)); out.push(<SmartLink key={n++} to={m[2]} className="underline">{m[1]}</SmartLink>); last = m.index + m[0].length; }
  if (last < text.length) out.push(...bold(text.slice(last), 'bend')); return out;
}
export default function Prose({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`prose-soft space-y-4 ${className}`}>{text.split(/\n{2,}/).map((block, i) => {
    const b = block.trim(); if (!b) return null;
    if (b.startsWith('## ') && !b.includes('\n')) return <h2 key={i} className="pt-6 font-serif text-3xl normal-case leading-tight tracking-tight">{b.slice(3)}</h2>;
    const lines = b.split('\n');
    if (lines[0].startsWith('## ')) return <div key={i}><h2 className="pt-6 font-serif text-3xl normal-case leading-tight tracking-tight">{lines[0].slice(3)}</h2><p className="mt-3 whitespace-pre-line">{inline(lines.slice(1).join('\n'))}</p></div>;
    if (lines.every((l) => l.startsWith('- '))) return <ul key={i} className="list-disc space-y-1 pl-5">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
    return <p key={i} className="whitespace-pre-line">{inline(b)}</p>;
  })}</div>;
}
