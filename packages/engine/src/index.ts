export {
  compute,
  COMPUTE_RESULT_SCHEMA_VERSION,
  DEFAULT_STATS,
  type ComputeResultValidationIssue,
  type ComputeResultUnresolvedEntry,
  type ComputeResultAssumptionEntry,
  type VersionedSheetViewModel,
  type ComputeResult,
  type RulepackInput,
  type ProvenanceRecord,
  type SkillBreakdown,
  type SkillMiscBreakdownEntry,
  type RacialModifierBreakdown,
  type SpellDcBonusBreakdown,
  type InnateSpellLikeAbilityBreakdown,
  type DecisionSummary,
  type AttackLine,
  type AttackBonusBreakdown,
  type SheetViewModel,
  type Phase1Sheet,
  type Phase2Sheet,
  type UnresolvedRule
} from "./compute";

export {
  listChoices,
  applyChoice,
  collectValidationErrorsFromState,
  validateState,
  buildCharacterSheetFromState,
  finalizeCharacter,
  buildSheetViewModel,
  initialState,
  type EngineContext,
  type Choice,
  type ValidationError,
  type CharacterSheet
} from "./legacyRuntime";

export {
  characterSpecToState,
  normalizeCharacterSpec,
  validateCharacterSpec
} from "./characterSpec";

export type {
  CharacterSpec,
  CharacterSpecClassSelection,
  CharacterSpecMeta,
  CharacterSpecValidationIssue,
  CharacterState
} from "./characterSpec";
