export const money = (n: number, cur = 'JOD') => `${Number(n)} ${cur}`;
// Placeholder tint until real photos are uploaded: guess the bag colour from its name.
export function tintFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('navy')) return '#1f2a4a'; if (n.includes('lilac')) return '#b9a7d6'; if (n.includes('hot pink')) return '#e0245e';
  if (n.includes('pink')) return '#f1c4cf'; if (n.includes('sky') || n.includes('blue')) return '#a9cbe8'; if (n.includes('black')) return '#151515';
  return '#c9b99a';
}
