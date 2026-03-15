import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import { skillIsAffectedByArmorCheckPenalty } from "./legacyRuntimeEntityData";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { getClassSkills } from "./legacyRuntimeProgression";
import type { EngineContext } from "./legacyRuntimeTypes";

export interface LegacyProficiencyState {
  skillIds: Set<string>;
}

// Bridge the future proficiency-aware runtime seam onto the current class-skill knowledge.
export function buildLegacyProficiencyState(state: CharacterState, context: EngineContext): LegacyProficiencyState {
  return buildLegacyProficiencyStateFromClassSkills(getClassSkills(state, context));
}

export function buildLegacyProficiencyStateFromClassSkills(skillIds: Iterable<string>): LegacyProficiencyState {
  return {
    skillIds: new Set(
      Array.from(skillIds)
        .map((skillId) => normalizeSkillId(skillId))
        .filter(Boolean)
    )
  };
}

export function hasSkillProficiency(proficiencyState: LegacyProficiencyState | undefined, skillId: string): boolean {
  const normalizedSkillId = normalizeSkillId(skillId);
  return normalizedSkillId.length > 0 && Boolean(proficiencyState?.skillIds.has(normalizedSkillId));
}

export function resolveSkillArmorCheckPenalty(
  skillEntity: ResolvedEntity | undefined,
  acpPenalty: number,
  _proficiencyState: LegacyProficiencyState
): { acpApplied: boolean; acp: number } {
  const acpApplied = skillIsAffectedByArmorCheckPenalty(skillEntity);
  return {
    acpApplied,
    acp: acpApplied ? acpPenalty : 0
  };
}
