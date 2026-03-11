export function deriveValueFromProvenance(
  records: Array<{ delta?: number; setValue?: unknown }>,
  fallback: number,
): number {
  let value = fallback;
  for (const record of records) {
    if (record.setValue !== undefined) {
      const nextValue = Number(record.setValue);
      if (Number.isFinite(nextValue)) {
        value = nextValue;
      }
      continue;
    }
    const delta = Number(record.delta ?? 0);
    if (Number.isFinite(delta)) {
      value += delta;
    }
  }
  return value;
}
