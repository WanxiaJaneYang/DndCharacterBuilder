export type SkillBudgetSummary = {
  total: number;
  spent: number;
  remaining: number;
};

export type LocalSkillUiDetail = {
  classSkill: boolean;
  costPerRank: number;
  costSpent: number;
  maxRanks: number;
  racialBonus: number;
};

export function getEntityDataRecord(
  entity: { data?: unknown } | undefined,
): Record<string, unknown> {
  if (!entity?.data || typeof entity.data !== "object" || Array.isArray(entity.data)) {
    return {};
  }
  return entity.data as Record<string, unknown>;
}

export function getEntityDataNumber(
  entity: { data?: unknown } | undefined,
  key: string,
  fallback = 0,
): number {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getEntityDataString(
  entity: { data?: unknown } | undefined,
  key: string,
): string {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getClassSkillIds(
  classEntity: { data?: unknown } | undefined,
): Set<string> {
  const raw = getEntityDataRecord(classEntity).classSkills;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map((entry) => String(entry ?? "").trim()).filter(Boolean));
}

export function getCharacterLevel(
  classSelection: { level: number } | undefined,
): number {
  const level = Number(classSelection?.level ?? 0);
  return Number.isInteger(level) && level > 0 ? level : 0;
}

export function getSkillMaxRanksForLevel(
  level: number,
  classSkill: boolean,
): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  return classSkill ? level + 3 : (level + 3) / 2;
}

export function getRacialTraitIds(
  raceEntity: { data?: unknown } | undefined,
): Set<string> {
  const raw = getEntityDataRecord(raceEntity).racialTraits;
  if (!Array.isArray(raw)) return new Set();
  return new Set(
    raw
      .map((entry) =>
        entry && typeof entry === "object" && !Array.isArray(entry)
          ? String((entry as Record<string, unknown>).id ?? "").trim()
          : "",
      )
      .filter(Boolean),
  );
}

export function getRacialSkillBonuses(
  raceEntity: { data?: unknown } | undefined,
): Map<string, number> {
  const raw = getEntityDataRecord(raceEntity).skillBonuses;
  const bonuses = new Map<string, number>();
  if (!Array.isArray(raw)) return bonuses;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const skillId = String(record.skill ?? "").trim();
    const bonus = Number(record.bonus ?? 0);
    if (!skillId || !Number.isFinite(bonus)) continue;
    bonuses.set(skillId, (bonuses.get(skillId) ?? 0) + bonus);
  }
  return bonuses;
}
