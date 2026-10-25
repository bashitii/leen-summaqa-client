// Fallback "image" when a product has no photo yet: a coloured triangle on a warm ground (the brand geometry).
export default function Art({ tint, className = '' }: { tint: string; className?: string }) {
  return <div className={`group relative flex items-center justify-center bg-[#e9e5de] ${className}`}>
    <div className="tri aspect-[1/1.1] w-[58%] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" style={{ background: tint }} />
  </div>;
}
