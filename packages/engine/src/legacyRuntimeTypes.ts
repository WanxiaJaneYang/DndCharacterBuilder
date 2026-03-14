import type { ResolvedPackSet } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
export const FIRST_LEVEL_SKILL_MULTIPLIER = 4;
export const FEAT_SLOT_TYPE = "feat";
export const ABILITY_STEP_ID = "abilities";

export type AbilityGenerationMode = "pointBuy" | "phb" | "rollSets";

type AbilityScoresRecord = Record<string, number>;

export type AbilitySelectionPayload = {
  mode?: AbilityGenerationMode;
  pointCap?: number;
  scores?: AbilityScoresRecord;
  rollSets?: {
    generatedSets?: number[][];
    selectedSetIndex?: number;
  };
};

export type AbilityStepConfig = {
  modes?: AbilityGenerationMode[];
  defaultMode?: AbilityGenerationMode;
  pointBuy?: {
    costTable?: Record<string, number>;
    defaultPointCap?: number;
    minPointCap?: number;
    maxPointCap?: number;
    pointCapStep?: number;
    minScore?: number;
    maxScore?: number;
  };
  phb?: {
    methodType?: "standardArray" | "manualRange";
    standardArray?: number[];
    manualRange?: { minScore?: number; maxScore?: number };
  };
  rollSets?: {
    setsCount?: number;
  };
};

export interface EngineContext {
  enabledPackIds: string[];
  resolvedData: ResolvedPackSet;
  predicates?: Record<string, (state: CharacterState, args?: Record<string, unknown>) => boolean>;
}

export interface Choice {
  stepId: string;
  label: string;
  options: Array<{ id: string; label: string }>;
  limit?: number;
}

export interface ValidationError {
  code: string;
  message: string;
  stepId?: string;
}

export interface ProvenanceRecord {
  targetPath: string;
  delta?: number;
  setValue?: number;
  source: { packId: string; entityId: string; choiceStepId?: string };
}

export interface SkillMiscBreakdownEntry {
  id: string;
  sourceType: string;
  bonus: number;
  bonusType?: string;
  note?: string;
}

export interface SkillBreakdown {
  name: string;
  ability: AbilityKey;
  classSkill: boolean;
  isClassSkill?: boolean;
  ranks: number;
  maxRanks: number;
  costPerRank: number;
  costSpent: number;
  abilityMod: number;
  racialBonus: number;
  miscBonus: number;
  miscBreakdown: SkillMiscBreakdownEntry[];
  total: number;
}

export interface RacialModifierBreakdown {
  target: string;
  bonus: number;
  type?: string;
  when?: string;
}

export interface SpellDcBonusBreakdown {
  school: string;
  bonus: number;
  type?: string;
  when?: string;
}

export interface InnateSpellLikeAbilityBreakdown {
  spell: string;
  frequency: string;
  casterLevel?: string;
  scope?: string;
}

export interface DecisionSummary {
  featSelectionLimit: number;
  favoredClass: string | null;
  ignoresMulticlassXpPenalty: boolean;
  classSkills: string[];
  ancestryTags: string[];
  sizeModifiers: {
    ac: number;
    attack: number;
    hide: number;
    carryingCapacityMultiplier: number;
  };
  movementOverrides: {
    ignoreArmorSpeedReduction: boolean;
  };
  racialSaveBonuses: RacialModifierBreakdown[];
  racialAttackBonuses: RacialModifierBreakdown[];
  racialAcBonuses: RacialModifierBreakdown[];
  racialSpellDcBonuses: SpellDcBonusBreakdown[];
  racialInnateSpellLikeAbilities: InnateSpellLikeAbilityBreakdown[];
  skillPoints: {
    basePerLevel: number;
    racialBonusAtLevel1: number;
    racialBonusPerLevel: number;
    firstLevelMultiplier: number;
    total: number;
    spent: number;
    remaining: number;
  };
}

export interface UnresolvedRule {
  id: string;
  category: string;
  description: string;
  dependsOn: string[];
  impacts?: string[];
  source: {
    entityType: string;
    entityId: string;
    packId: string;
    sourceRefs?: string[];
  };
}
