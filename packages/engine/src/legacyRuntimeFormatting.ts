export function formatDamageWithModifier(baseDamage: string, modifier: number): string {
  if (!Number.isFinite(modifier) || modifier === 0) return baseDamage;
  return `${baseDamage}${modifier > 0 ? "+" : ""}${modifier}`;
}

export function normalizeCritProfile(rawCrit: string | undefined): string {
  const crit = (rawCrit ?? "").trim().toLowerCase();
  if (!crit) return "20/x2";
  if (/^x\d+$/.test(crit)) return `20/${crit}`;
  if (/^\d{1,2}(?:-\d{1,2})?\/x\d+$/.test(crit)) return crit;
  return "20/x2";
}
