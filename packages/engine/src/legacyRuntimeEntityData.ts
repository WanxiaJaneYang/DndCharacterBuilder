import type { ResolvedEntity } from "@dcb/datapack";

export type DeferredMechanicRecord = {
  id: string;
  category: string;
  description: string;
  dependsOn: string[];
  sourceRefs?: string[];
  impactPaths?: string[];
  impacts?: string[];
};

export function getEntityDataRecord(entity: ResolvedEntity | undefined): Record<string, unknown> {
  const rawData = entity?.data;
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return {};
  }
  return rawData as Record<string, unknown>;
}

export function getEntityDataNumber(entity: ResolvedEntity | undefined, key: string, fallback = 0): number {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getEntityDataString(entity: ResolvedEntity | undefined, key: string): string {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function parseDeferredMechanics(value: unknown): DeferredMechanicRecord[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const id = String(record.id ?? "").trim();
    const category = String(record.category ?? "").trim();
    const description = String(record.description ?? "").trim();
    const dependsOn = parseStringList(record.dependsOn);
    if (!id || !category || !description || !dependsOn) return [];

    return [{
      id,
      category,
      description,
      dependsOn,
      sourceRefs: parseStringList(record.sourceRefs),
      impactPaths: parseStringList(record.impactPaths),
      impacts: parseStringList(record.impacts)
    }];
  });
}

export function isRangedWeaponItem(item: ResolvedEntity): boolean {
  const category = getEntityDataString(item, "category").toLowerCase();
  const weaponType = getEntityDataString(item, "weaponType").toLowerCase();
  if (category !== "weapon") return false;
  if (weaponType === "ranged") return true;
  return getEntityDataString(item, "range").length > 0;
}

export function isAttackItem(item: ResolvedEntity): boolean {
  const category = getEntityDataString(item, "category").toLowerCase();
  if (category === "weapon") return true;
  if (category === "armor" || category === "shield" || category === "gear") return false;
  return (
    getEntityDataString(item, "weaponType").length > 0 ||
    getEntityDataString(item, "damage").length > 0 ||
    getEntityDataString(item, "crit").length > 0 ||
    getEntityDataString(item, "range").length > 0
  );
}

export function getItemWeight(item: ResolvedEntity): number {
  return getEntityDataNumber(item, "weight", 0);
}

export function getItemArmorCheckPenalty(item: ResolvedEntity): number {
  return getEntityDataNumber(item, "armorCheckPenalty", 0);
}

export function skillIsAffectedByArmorCheckPenalty(skillEntity: ResolvedEntity | undefined): boolean {
  return getEntityDataRecord(skillEntity).armorCheckPenaltyApplies === true;
}
