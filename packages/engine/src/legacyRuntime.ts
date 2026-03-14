import type { Constraint, Effect, Entity, Expr } from "@dcb/schema";
import type { ResolvedEntity } from "@dcb/datapack";
import { type CharacterState } from "./characterSpec";
import { initialState } from "./legacyRuntimeInitialState";
import { normalizeSkillId } from "./legacyRuntimeIds";
import {
  applyChoice,
  listChoices
} from "./legacyRuntimeChoices";
import {
  buildCharacterSheetFromState,
  finalizeCharacter
} from "./legacyRuntimeBuildCharacterSheet";
import {
  buildConditionalSkillBonusData,
  collectUnresolvedRules
} from "./legacyRuntimeRuleSurface";
import {
  applyEffect,
  getGrappleSizeModifier,
  getSrdMediumLoadLimits,
  inferAcBreakdown
} from "./legacyRuntimeCombatUtils";
import {
  collectValidationErrorsFromState,
  validateState
} from "./legacyRuntimeValidation";
import {
  abilityMod,
  checkConstraint,
  entityAllowed,
  evalExpr,
  getPath,
  setPath
} from "./legacyRuntimeExpression";
import {
  formatDamageWithModifier,
  normalizeCritProfile
} from "./legacyRuntimeFormatting";
import {
  getAbilityModeFromState,
  getAbilityScoreBounds,
  getAbilityStepConfig
} from "./legacyRuntimeAbilityConfig";
import {
  ABILITY_KEYS,
  ABILITY_STEP_ID,
  FEAT_SLOT_TYPE,
  FIRST_LEVEL_SKILL_MULTIPLIER,
  type AbilityGenerationMode,
  type AbilityKey,
  type AbilitySelectionPayload,
  type AbilityStepConfig,
  type Choice,
  type DecisionSummary,
  type EngineContext,
  type InnateSpellLikeAbilityBreakdown,
  type ProvenanceRecord,
  type RacialModifierBreakdown,
  type SkillBreakdown,
  type SkillMiscBreakdownEntry,
  type SpellDcBonusBreakdown,
  type UnresolvedRule,
  type ValidationError
} from "./legacyRuntimeTypes";
import {
  classIdBase,
  classIdLevel,
  getApplicableClassGains,
  getCharacterLevel,
  getClassProgressionFeatSlotBonus,
  getClassSkillPointsPerLevel,
  getClassSkills,
  getDerivedSkillRanks,
  getRaceSkillBonusAtLevel1,
  getRaceSkillBonusPerLevel,
  getSelectionCountForStep,
  getSkillMaxRanksForLevel,
  getStepSelectionLimit,
  parseClassProgressionGains
} from "./legacyRuntimeProgression";
import {
  buildDecisionSummary,
  buildSkillBreakdown
} from "./legacyRuntimeDecisions";
import {
  getEntityDataRecord,
  getEntityDataString,
  getItemArmorCheckPenalty,
  getItemWeight,
  isAttackItem,
  isRangedWeaponItem,
  skillIsAffectedByArmorCheckPenalty
} from "./legacyRuntimeEntityData";
import {
  DEFAULT_STATS,
  type CharacterSheet,
  type Phase1Sheet,
  type Phase2Sheet,
} from "./legacyRuntimeSheetTypes";
import {
  type AttackLine,
  type SheetViewModel
} from "./legacyRuntimeViewModelTypes";
import { buildSheetViewModel } from "./legacyRuntimeViewModel";
import {
  getRaceMovementOverrides,
  getRaceSizeModifiers,
  parseInnateSpellLikeAbilities,
  parseRaceAncestryTags,
  parseRacialModifiers,
  parseSpellDcBonuses
} from "./legacyRuntimeRaceData";
import {
  getRaceTraitCount,
  getSelectedClass,
  getSelectedFeatIds,
  getSelectedRace,
  getSelectedSkillRanks,
  isEntityTypeFlowStep,
  parseFiniteSkillRank,
  type EntityTypeFlowStep
} from "./legacyRuntimeSelectors";
import {
  buildEffectSkillBonusBreakdown,
  buildEffectSkillBonusMap,
  buildRacialSkillBonusMap,
  mergeSkillBonusBreakdownMaps
} from "./legacyRuntimeSkillBonusMaps";
export type {
  AbilityGenerationMode,
  AbilityKey,
  AbilitySelectionPayload,
  AbilityStepConfig,
  Choice,
  DecisionSummary,
  EngineContext,
  InnateSpellLikeAbilityBreakdown,
  ProvenanceRecord,
  RacialModifierBreakdown,
  SkillBreakdown,
  SkillMiscBreakdownEntry,
  SpellDcBonusBreakdown,
  UnresolvedRule,
  ValidationError
} from "./legacyRuntimeTypes";
export {
  ABILITY_KEYS,
  ABILITY_STEP_ID,
  FEAT_SLOT_TYPE,
  FIRST_LEVEL_SKILL_MULTIPLIER
} from "./legacyRuntimeTypes";
export type {
  CharacterSheet,
  Phase1Sheet,
  Phase2Sheet,
} from "./legacyRuntimeSheetTypes";
export { initialState } from "./legacyRuntimeInitialState";
export { DEFAULT_STATS } from "./legacyRuntimeSheetTypes";
export type {
  AttackBonusBreakdown,
  AttackLine,
  SheetViewModel
} from "./legacyRuntimeViewModelTypes";
export { buildSheetViewModel } from "./legacyRuntimeViewModel";
export {
  collectValidationErrorsFromState,
  validateState
} from "./legacyRuntimeValidation";
export {
  applyChoice,
  listChoices
} from "./legacyRuntimeChoices";
export {
  buildCharacterSheetFromState,
  finalizeCharacter
} from "./legacyRuntimeBuildCharacterSheet";


