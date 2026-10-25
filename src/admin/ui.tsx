import type { ReactNode } from 'react';
// Small shared bits so every admin form looks the same.
export const input = 'w-full border border-line bg-white/60 px-3 py-2 normal-case tracking-normal outline-none focus:border-ink';
export const btn = 'bg-ink px-4 py-2 text-paper disabled:opacity-40';
export const btn2 = 'border border-line px-4 py-2 hover:border-ink';
export const Field = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) =>
  <label className={`block ${className}`}><span className="label mb-1 block">{label}</span>{children}</label>;
export const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) =>
  <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
