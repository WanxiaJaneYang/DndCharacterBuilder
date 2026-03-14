import type { Effect } from "@dcb/schema";
import type { ResolvedEntity } from "@dcb/datapack";
import type { Phase1Sheet } from "./legacyRuntimeSheetTypes";
import type { ProvenanceRecord } from "./legacyRuntimeTypes";
import { evalExpr, getPath, setPath } from "./legacyRuntimeExpression";
import { getEntityDataString } from "./legacyRuntimeEntityData";

export function applyEffect(effect: Effect, sheet: Record<string, any>, provenance: ProvenanceRecord[], source: ProvenanceRecord["source"]): void {
  if (effect.kind === "conditional") {
    const branch = evalExpr(effect.condition, sheet) ? effect.then : effect.else ?? [];
    branch.forEach((child: Effect) => applyEffect(child, sheet, provenance, source));
    return;
  }
  const nextValue = Number(evalExpr(effect.value, sheet));
  const previousValue = Number(getPath(sheet, effect.targetPath) ?? 0);
  switch (effect.kind) {
    case "set":
    case "derive":
      setPath(sheet, effect.targetPath, nextValue);
      provenance.push({ targetPath: effect.targetPath, setValue: nextValue, source });
      break;
    case "add":
      setPath(sheet, effect.targetPath, previousValue + nextValue);
      provenance.push({ targetPath: effect.targetPath, delta: nextValue, source });
      break;
    case "multiply":
      setPath(sheet, effect.targetPath, previousValue * nextValue);
      provenance.push({ targetPath: effect.targetPath, setValue: previousValue * nextValue, source });
      break;
    case "min":
      setPath(sheet, effect.targetPath, Math.min(previousValue, nextValue));
      provenance.push({ targetPath: effect.targetPath, setValue: Math.min(previousValue, nextValue), source });
      break;
    case "max":
      setPath(sheet, effect.targetPath, Math.max(previousValue, nextValue));
      provenance.push({ targetPath: effect.targetPath, setValue: Math.max(previousValue, nextValue), source });
      break;
  }
}

export function getGrappleSizeModifier(size: string | undefined): number {
  switch (String(size ?? "").trim().toLowerCase()) {
    case "fine": return -16;
    case "diminutive": return -12;
    case "tiny": return -8;
    case "small": return -4;
    case "large": return 4;
    case "huge": return 8;
    case "gargantuan": return 12;
    case "colossal": return 16;
    default: return 0;
  }
}

const SRD_MEDIUM_LOAD_TABLE: Array<{ light: number; medium: number; heavy: number } | null> = [
  null,
  { light: 3, medium: 6, heavy: 10 }, { light: 6, medium: 13, heavy: 20 }, { light: 10, medium: 20, heavy: 30 },
  { light: 13, medium: 26, heavy: 40 }, { light: 16, medium: 33, heavy: 50 }, { light: 20, medium: 40, heavy: 60 },
  { light: 23, medium: 46, heavy: 70 }, { light: 26, medium: 53, heavy: 80 }, { light: 30, medium: 60, heavy: 90 },
  { light: 33, medium: 66, heavy: 100 }, { light: 38, medium: 76, heavy: 115 }, { light: 43, medium: 86, heavy: 130 },
  { light: 50, medium: 100, heavy: 150 }, { light: 58, medium: 116, heavy: 175 }, { light: 66, medium: 133, heavy: 200 },
  { light: 76, medium: 153, heavy: 230 }, { light: 86, medium: 173, heavy: 260 }, { light: 100, medium: 200, heavy: 300 },
  { light: 116, medium: 233, heavy: 350 }, { light: 133, medium: 266, heavy: 400 }, { light: 153, medium: 306, heavy: 460 },
  { light: 173, medium: 346, heavy: 520 }, { light: 200, medium: 400, heavy: 600 }, { light: 233, medium: 466, heavy: 700 },
  { light: 266, medium: 533, heavy: 800 }, { light: 306, medium: 613, heavy: 920 }, { light: 346, medium: 693, heavy: 1040 },
  { light: 400, medium: 800, heavy: 1200 }, { light: 466, medium: 933, heavy: 1400 }
];

export function getSrdMediumLoadLimits(strScore: number): { light: number; medium: number; heavy: number } {
  const normalizedScore = Number.isFinite(strScore) ? Math.max(1, Math.floor(strScore)) : 10;
  if (normalizedScore < SRD_MEDIUM_LOAD_TABLE.length) {
    return SRD_MEDIUM_LOAD_TABLE[normalizedScore] ?? { light: 0, medium: 0, heavy: 0 };
  }
  const baseEntry = SRD_MEDIUM_LOAD_TABLE[20]!;
  const incrementsOfTen = Math.floor((normalizedScore - 20) / 10);
  const remainderScore = normalizedScore - (incrementsOfTen * 10);
  const remainderEntry = SRD_MEDIUM_LOAD_TABLE[remainderScore] ?? baseEntry;
  const multiplier = 4 ** incrementsOfTen;
  return {
    light: remainderEntry.light * multiplier,
    medium: remainderEntry.medium * multiplier,
    heavy: remainderEntry.heavy * multiplier
  };
}

export function inferAcBreakdown(
  provenance: ProvenanceRecord[],
  selectedEquipmentIds: Set<string>,
  selectedEquipmentById: Map<string, ResolvedEntity>,
  dexModifier: number,
  sizeModifier: number,
  acTotal: number
): Phase1Sheet["combat"]["ac"] {
  const acRecords = provenance.filter((record) => record.targetPath === "stats.ac");
  let armor = 0;
  let shield = 0;
  let misc = 0;
  for (const record of acRecords) {
    const sourceId = String(record.source.entityId ?? "").trim().toLowerCase();
    if (record.setValue !== undefined && Number.isFinite(record.setValue)) continue;
    if (record.delta === undefined || !Number.isFinite(record.delta)) continue;
    const delta = Number(record.delta);
    const sourceItem = selectedEquipmentById.get(sourceId);
    const sourceCategory = getEntityDataString(sourceItem, "category").toLowerCase();
    const isShield = sourceCategory === "shield" || (sourceCategory.length === 0 && sourceId.includes("shield") && selectedEquipmentIds.has(sourceId));
    if (isShield) {
      shield += delta;
      continue;
    }
    if (selectedEquipmentIds.has(sourceId)) {
      armor += delta;
      continue;
    }
    misc += delta;
  }
  return {
    total: acTotal,
    touch: acTotal - armor - shield,
    flatFooted: acTotal - Math.max(dexModifier, 0),
    breakdown: {
      armor,
      shield,
      dex: dexModifier,
      size: sizeModifier,
      natural: 0,
      deflection: 0,
      misc
    }
  };
}
