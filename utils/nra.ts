/**
 * Net Royalty Acres (NRA) from NMA and ROY (prod_acreage_schedule.ROY).
 * ROY 12.50 → NMA × 1
 * ROY 18.75 → NMA × 1.5
 * ROY 20.00 → NMA × 1.6
 * ROY 25.00 → NMA × 2
 * Any other ROY → NMA × (ROY / 100) as fallback.
 */
export function netRoyaltyAcresMultiplier(roy: number): number {
  const r = Number(roy);
  if (!Number.isFinite(r)) return 0;
  if (Math.abs(r - 12.5) < 0.02) return 1;
  if (Math.abs(r - 18.75) < 0.02) return 1.5;
  if (Math.abs(r - 20) < 0.02) return 1.6;
  if (Math.abs(r - 25) < 0.02) return 2;
  return r / 100;
}

export function netRoyaltyAcresFromNmaAndRoy(nma: number, roy: number | string): number {
  const n = Number(nma);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n * netRoyaltyAcresMultiplier(Number(roy));
}

/** SQL fragment: multiplier from pas.ROY for use in SUM(NMA * mult). Alias pas. as needed. */
export const SQL_NRA_MULTIPLIER_FROM_ROY = `(
  CASE
    WHEN ABS(CAST(pas.ROY AS DECIMAL(10,4)) - 12.5) < 0.02 THEN 1
    WHEN ABS(CAST(pas.ROY AS DECIMAL(10,4)) - 18.75) < 0.02 THEN 1.5
    WHEN ABS(CAST(pas.ROY AS DECIMAL(10,4)) - 20) < 0.02 THEN 1.6
    WHEN ABS(CAST(pas.ROY AS DECIMAL(10,4)) - 25) < 0.02 THEN 2
    ELSE CAST(pas.ROY AS DECIMAL(10,4)) / 100
  END
)`;
