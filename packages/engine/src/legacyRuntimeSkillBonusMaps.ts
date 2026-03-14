import type { CharacterState } from "./characterSpec";
import type { EngineContext, SkillMiscBreakdownEntry } from "./legacyRuntimeTypes";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { getSelectedRace } from "./legacyRuntimeSelectors";

export function buildRacialSkillBonusMap(state: CharacterState, context: EngineContext): Record<string, number> {
  const race = getSelectedRace(state, context);
  const bonuses = (race?.data?.skillBonuses as Array<{ skill?: unknown; bonus?: unknown }> | undefined) ?? [];
  return bonuses.reduce<Record<string, number>>((acc, entry) => {
    const skillId = normalizeSkillId(String(entry.skill ?? ""));
    const bonus = Number(entry.bonus ?? 0);
    if (!skillId || !Number.isFinite(bonus)) return acc;
    acc[skillId] = (acc[skillId] ?? 0) + bonus;
    return acc;
  }, {});
}

export function buildEffectSkillBonusMap(sheet: Record<string, unknown>): Record<string, number> {
  const raw = sheet.skillBonuses;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.entries(raw as Record<string, unknown>).reduce<Record<string, number>>((acc, [skillId, bonus]) => {
    const normalizedSkillId = normalizeSkillId(skillId);
    const numericBonus = Number(bonus);
    if (!normalizedSkillId || !Number.isFinite(numericBonus)) return acc;
    acc[normalizedSkillId] = (acc[normalizedSkillId] ?? 0) + numericBonus;
    return acc;
  }, {});
}

export function buildEffectSkillBonusBreakdown(effectBonuses: Record<string, number>): Record<string, SkillMiscBreakdownEntry[]> {
  const breakdown: Record<string, SkillMiscBreakdownEntry[]> = {};
  for (const [skillId, bonus] of Object.entries(effectBonuses)) {
    if (!Number.isFinite(bonus) || bonus === 0) continue;
    breakdown[skillId] = [{
      id: `effect:${skillId}`,
      sourceType: "effect",
      bonus
    }];
  }
  return breakdown;
}

export function mergeSkillBonusBreakdownMaps(
  ...maps: Array<Record<string, SkillMiscBreakdownEntry[]>>
): Record<string, SkillMiscBreakdownEntry[]> {
  const merged: Record<string, SkillMiscBreakdownEntry[]> = {};
  for (const map of maps) {
    for (const [skillId, entries] of Object.entries(map)) {
      if (!entries.length) continue;
      (merged[skillId] ??= []).push(...entries);
    }
  }
  return merged;
}
