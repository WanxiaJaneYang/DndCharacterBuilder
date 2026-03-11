import {
  getCharacterLevel,
  getEntityDataNumber,
  getRacialTraitIds,
  type SkillBudgetSummary,
} from "./entityDataHelpers";

const FIRST_LEVEL_SKILL_MULTIPLIER = 4;

export function buildSkillBudgetSummary(input: {
  classEntity: { data?: unknown } | undefined;
  classSelection: { level: number } | undefined;
  raceEntity: { data?: unknown } | undefined;
  intMod: number;
  skillRanks: Record<string, number>;
  classSkillIds: Set<string>;
}): SkillBudgetSummary {
  const characterLevel = getCharacterLevel(input.classSelection);
  const classSkillPointsPerLevel = Math.max(
    0,
    Math.floor(getEntityDataNumber(input.classEntity, "skillPointsPerLevel", 0)),
  );
  const racialTraitIds = getRacialTraitIds(input.raceEntity);
  const racialBonusAtLevel1 = racialTraitIds.has("extra-skill-points") ? 4 : 0;
  const racialBonusPerLevel = racialTraitIds.has("extra-skill-points") ? 1 : 0;
  const baseSkillPointsPerLevelWithInt = Math.max(
    1,
    classSkillPointsPerLevel + input.intMod,
  );
  const total = Array.from({ length: characterLevel }).reduce<number>(
    (sum, _, index) => {
      const level = index + 1;
      const levelPoints =
        level === 1
          ? baseSkillPointsPerLevelWithInt * FIRST_LEVEL_SKILL_MULTIPLIER +
            racialBonusAtLevel1
          : baseSkillPointsPerLevelWithInt + racialBonusPerLevel;
      return sum + Math.max(0, levelPoints);
    },
    0,
  );
  const spent = Object.entries(input.skillRanks).reduce<number>(
    (sum, [skillId, ranks]) => {
      const costPerRank = input.classSkillIds.has(skillId) ? 1 : 2;
      return sum + ranks * costPerRank;
    },
    0,
  );
  return {
    total,
    spent,
    remaining: total - spent,
  };
}
