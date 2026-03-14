import type { Effect } from "@dcb/schema";
import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import {
  FEAT_SLOT_TYPE,
  type AbilityStepConfig,
  type EngineContext
} from "./legacyRuntimeTypes";
import { normalizeSkillId } from "./legacyRuntimeIds";
import {
  getRaceTraitCount,
  getSelectedClass,
  getSelectedSkillRanks,
  type EntityTypeFlowStep
} from "./legacyRuntimeSelectors";

export function getClassSkills(state: CharacterState, context: EngineContext): Set<string> {
  const classEntity = getSelectedClass(state, context);
  const list = (classEntity?.data?.classSkills as unknown[] | undefined) ?? [];
  return new Set(list.map((id) => normalizeSkillId(String(id))).filter(Boolean));
}

export function getClassSkillPointsPerLevel(state: CharacterState, context: EngineContext): number {
  const classEntity = getSelectedClass(state, context);
  const raw = Number(classEntity?.data?.skillPointsPerLevel ?? 0);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

export function getRaceSkillBonusAtLevel1(state: CharacterState, context: EngineContext): number {
  return getRaceTraitCount(state, context, "extra-skill-points") > 0 ? 4 : 0;
}

export function getRaceSkillBonusPerLevel(state: CharacterState, context: EngineContext): number {
  return getRaceTraitCount(state, context, "extra-skill-points") > 0 ? 1 : 0;
}

export function getCharacterLevel(state: CharacterState): number {
  return classIdLevel(String(state.selections.class ?? ""));
}

export function getSkillMaxRanksForLevel(level: number, classSkill: boolean): number {
  const safeLevel = Math.floor(level);
  if (!Number.isFinite(safeLevel) || safeLevel <= 0) return 0;
  return classSkill ? safeLevel + 3 : (safeLevel + 3) / 2;
}

export function getDerivedSkillRanks(state: CharacterState, context: EngineContext): Record<string, number> {
  const rawRanks = getSelectedSkillRanks(state);
  const classSkills = getClassSkills(state, context);
  const normalized: Record<string, number> = {};

  for (const [skillId, rank] of Object.entries(rawRanks)) {
    normalized[skillId] = classSkills.has(skillId)
      ? Math.floor(rank)
      : Math.floor(rank * 2) / 2;
  }

  return normalized;
}

export function getSelectionCountForStep(step: EntityTypeFlowStep, state: CharacterState): number {
  if (step.id === "feat") return ((state.selections.feats as string[] | undefined) ?? []).length;
  const value = state.selections[step.id];
  if (value === undefined || value === null || value === "") return 0;
  if (Array.isArray(value)) return value.length;
  return 1;
}

export function classIdBase(classId: string | undefined): string | undefined {
  if (!classId) return undefined;
  return classId.replace(/-\d+$/, "");
}

export function classIdLevel(classId: string | undefined): number {
  if (!classId) return 0;
  const match = classId.match(/-(\d+)$/);
  if (!match?.[1]) return 1;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export type ClassProgressionGrant = {
  kind: string;
  slotType?: string;
  featureId?: string;
  count?: number;
};

export type ClassLevelGain = {
  level: number;
  effects: Effect[];
  grants: ClassProgressionGrant[];
};

export function parseClassProgressionGains(classEntity: ResolvedEntity | undefined): ClassLevelGain[] {
  const progression = classEntity?.data?.progression as { levelGains?: unknown } | undefined;
  if (!progression || !Array.isArray(progression.levelGains)) return [];

  return progression.levelGains
    .map((rawGain): ClassLevelGain | null => {
      if (!rawGain || typeof rawGain !== "object") return null;
      const record = rawGain as Record<string, unknown>;
      const level = Number(record.level);
      if (!Number.isFinite(level) || level < 1) return null;
      const effects = Array.isArray(record.effects) ? (record.effects as Effect[]) : [];
      const grants = Array.isArray(record.grants) ? (record.grants as ClassProgressionGrant[]) : [];
      return { level: Math.floor(level), effects, grants };
    })
    .filter((gain): gain is ClassLevelGain => Boolean(gain))
    .sort((a, b) => a.level - b.level);
}

export function getApplicableClassGains(state: CharacterState, context: EngineContext): ClassLevelGain[] {
  const selectedClass = getSelectedClass(state, context);
  if (!selectedClass) return [];
  const selectedLevel = classIdLevel(String(state.selections.class ?? ""));
  return parseClassProgressionGains(selectedClass).filter((gain) => gain.level <= selectedLevel);
}

export function getClassProgressionFeatSlotBonus(state: CharacterState, context: EngineContext): number {
  return getApplicableClassGains(state, context).reduce((total, gain) => {
    const gainBonus = gain.grants.reduce((count, grant) => {
      if (grant.kind === "featureSlot") {
        if (String(grant.slotType ?? "").trim().toLowerCase() !== FEAT_SLOT_TYPE) return count;
        const slotCount = Number(grant.count ?? 0);
        if (!Number.isFinite(slotCount) || slotCount < 1) return count;
        return count + Math.floor(slotCount);
      }
      if (grant.kind === "grantFeature" && String(grant.featureId ?? "").trim().toLowerCase() === "bonus-feat") {
        return count + 1;
      }
      return count;
    }, 0);
    return total + gainBonus;
  }, 0);
}

export function getStepSelectionLimit(step: EntityTypeFlowStep, state: CharacterState, context: EngineContext): number | undefined {
  const baseLimit = step.source.limit;
  if (step.id === "feat") {
    const racialBonusFeats = getRaceTraitCount(state, context, "bonus-feat");
    const classBonusFeats = getClassProgressionFeatSlotBonus(state, context);
    return (baseLimit ?? 0) + racialBonusFeats + classBonusFeats;
  }
  return baseLimit;
}
