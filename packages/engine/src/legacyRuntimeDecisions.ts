import type { CharacterState } from "./characterSpec";
import {
  ABILITY_KEYS,
  FIRST_LEVEL_SKILL_MULTIPLIER,
  type AbilityKey,
  type DecisionSummary,
  type EngineContext,
  type SkillBreakdown,
  type SkillMiscBreakdownEntry
} from "./legacyRuntimeTypes";
import { normalizeSkillId } from "./legacyRuntimeIds";
import {
  classIdBase,
  getCharacterLevel,
  getClassSkillPointsPerLevel,
  getClassSkills,
  getDerivedSkillRanks,
  getRaceSkillBonusAtLevel1,
  getRaceSkillBonusPerLevel,
  getSkillMaxRanksForLevel,
  getStepSelectionLimit
} from "./legacyRuntimeProgression";
import { getSelectedRace, isEntityTypeFlowStep } from "./legacyRuntimeSelectors";
import {
  getRaceMovementOverrides,
  getRaceSizeModifiers,
  parseInnateSpellLikeAbilities,
  parseRaceAncestryTags,
  parseRacialModifiers,
  parseSpellDcBonuses
} from "./legacyRuntimeRaceData";

export function buildDecisionSummary(
  state: CharacterState,
  context: EngineContext,
  abilities: Record<string, { score: number; mod: number }>
): DecisionSummary {
  const featStepCandidate = context.resolvedData.flow.steps.find((step) => step.id === "feat");
  const featStep = featStepCandidate && isEntityTypeFlowStep(featStepCandidate) ? featStepCandidate : undefined;
  const featSelectionLimit = featStep ? (getStepSelectionLimit(featStep, state, context) ?? 0) : 0;
  const classSkills = getClassSkills(state, context);
  const selectedSkillRanks = getDerivedSkillRanks(state, context);
  const classSkillPointsPerLevel = getClassSkillPointsPerLevel(state, context);
  const intModifier = abilities.int?.mod ?? 0;
  const racialBonusAtLevel1 = getRaceSkillBonusAtLevel1(state, context);
  const racialBonusPerLevel = getRaceSkillBonusPerLevel(state, context);
  const baseSkillPointsPerLevelWithInt = Math.max(1, classSkillPointsPerLevel + intModifier);
  const characterLevel = getCharacterLevel(state);
  const totalSkillPoints = Array.from({ length: characterLevel }).reduce<number>((total, _, index) => {
    const level = index + 1;
    const levelPoints = level === 1
      ? (baseSkillPointsPerLevelWithInt * FIRST_LEVEL_SKILL_MULTIPLIER) + racialBonusAtLevel1
      : baseSkillPointsPerLevelWithInt + racialBonusPerLevel;
    return total + Math.max(0, levelPoints);
  }, 0);

  let spentSkillPoints = 0;
  for (const [skillId, ranks] of Object.entries(selectedSkillRanks)) {
    spentSkillPoints += ranks * (classSkills.has(skillId) ? 1 : 2);
  }

  const race = getSelectedRace(state, context);
  const favoredClass = race?.data?.favoredClass ? String(race.data.favoredClass) : null;
  const selectedClassBase = classIdBase(state.selections.class as string | undefined);

  return {
    featSelectionLimit,
    favoredClass,
    ignoresMulticlassXpPenalty: favoredClass === null || favoredClass === "any" || favoredClass === selectedClassBase,
    classSkills: Array.from(classSkills).sort((left, right) => left.localeCompare(right)),
    ancestryTags: parseRaceAncestryTags((race?.data as { ancestryTags?: unknown } | undefined)?.ancestryTags),
    sizeModifiers: getRaceSizeModifiers(state, context),
    movementOverrides: getRaceMovementOverrides(state, context),
    racialSaveBonuses: parseRacialModifiers(race?.data?.saveBonuses),
    racialAttackBonuses: parseRacialModifiers(race?.data?.attackBonuses),
    racialAcBonuses: parseRacialModifiers((race?.data as { acBonuses?: unknown } | undefined)?.acBonuses),
    racialSpellDcBonuses: parseSpellDcBonuses((race?.data as { spellDcBonuses?: unknown } | undefined)?.spellDcBonuses),
    racialInnateSpellLikeAbilities: parseInnateSpellLikeAbilities(race?.data?.innateSpellLikeAbilities),
    skillPoints: {
      basePerLevel: classSkillPointsPerLevel,
      racialBonusAtLevel1,
      racialBonusPerLevel,
      firstLevelMultiplier: FIRST_LEVEL_SKILL_MULTIPLIER,
      total: totalSkillPoints,
      spent: spentSkillPoints,
      remaining: totalSkillPoints - spentSkillPoints
    }
  };
}

export function buildSkillBreakdown(
  state: CharacterState,
  context: EngineContext,
  abilities: Record<string, { score: number; mod: number }>,
  decisions: DecisionSummary,
  effectBonuses: Record<string, number>,
  miscBreakdownBySkill: Record<string, SkillMiscBreakdownEntry[]>,
  racialBonuses: Record<string, number>
): Record<string, SkillBreakdown> {
  const selectedRanks = getDerivedSkillRanks(state, context);
  const characterLevel = getCharacterLevel(state);
  const skills = Object.values(context.resolvedData.entities.skills ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  const output: Record<string, SkillBreakdown> = {};

  for (const skillEntity of skills) {
    const rawAbility = String(skillEntity.data?.ability ?? "int").toLowerCase() as AbilityKey;
    const ability: AbilityKey = ABILITY_KEYS.includes(rawAbility) ? rawAbility : "int";
    const normalizedSkillId = normalizeSkillId(skillEntity.id);
    const classSkill = decisions.classSkills.includes(normalizedSkillId);
    const ranks = selectedRanks[normalizedSkillId] ?? 0;
    const abilityModifier = abilities[ability]?.mod ?? 0;

    output[skillEntity.id] = {
      name: skillEntity.name,
      ability,
      classSkill,
      isClassSkill: classSkill,
      ranks,
      maxRanks: getSkillMaxRanksForLevel(characterLevel, classSkill),
      costPerRank: classSkill ? 1 : 2,
      costSpent: ranks * (classSkill ? 1 : 2),
      abilityMod: abilityModifier,
      racialBonus: racialBonuses[normalizedSkillId] ?? 0,
      miscBonus: effectBonuses[normalizedSkillId] ?? 0,
      miscBreakdown: miscBreakdownBySkill[normalizedSkillId] ?? [],
      total: ranks + abilityModifier + (racialBonuses[normalizedSkillId] ?? 0) + (effectBonuses[normalizedSkillId] ?? 0)
    };
  }

  return output;
}
