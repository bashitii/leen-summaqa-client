// Identical to server/src/pricing.ts `convert` (and the database's convert_price): the SAME rule everywhere, so the price shown here
// is the price the server charges. Integer arithmetic, no floating-point drift at .5.
export interface Rule { rate: number; round_step: number; decimals: number }
export function convert(base: number, c: Rule): number {
  const baseMilli = Math.round(base * 1000), rateMicro = Math.round(c.rate * 1e6), stepMilli = Math.round(c.round_step * 1000);
  const units = Math.round((baseMilli * rateMicro) / (1e6 * stepMilli));
  return Number(((units * stepMilli) / 1000).toFixed(c.decimals));
}
