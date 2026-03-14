import {
  buildCharacterSheetFromState,
  collectValidationErrorsFromState,
  type EngineContext,
  DEFAULT_STATS
} from "./legacyRuntime";
import {
  normalizeCharacterSpec,
  validateCharacterSpec,
  type CharacterSpec
} from "./characterSpec";
import {
  buildComputeStateFromSpec,
  mapStepIdToSpecPath,
  sanitizeStateForComputeOutput
} from "./computeStateBridge";
import {
  COMPUTE_RESULT_SCHEMA_VERSION,
  type ComputeResultValidationIssue,
  type ComputeResultUnresolvedEntry,
  type ComputeResultAssumptionEntry,
  type ComputeResult,
  type RulepackInput
} from "./computeTypes";
export { COMPUTE_RESULT_SCHEMA_VERSION };
export type {
  ComputeResult,
  ComputeResultAssumptionEntry,
  ComputeResultUnresolvedEntry,
  ComputeResultValidationIssue,
  RulepackInput
} from "./computeTypes";
export type {
  AttackBonusBreakdown,
  AttackLine,
  DecisionSummary,
  InnateSpellLikeAbilityBreakdown,
  Phase1Sheet,
  Phase2Sheet,
  ProvenanceRecord,
  RacialModifierBreakdown,
  SheetViewModel,
  SkillBreakdown,
  SkillMiscBreakdownEntry,
  SpellDcBonusBreakdown,
  UnresolvedRule,
  VersionedSheetViewModel
} from "./computeTypes";

export function compute(spec: CharacterSpec, rulepack: RulepackInput): ComputeResult {
  const normalizedSpec = normalizeCharacterSpec(spec);
  const validationIssues: ComputeResultValidationIssue[] = [
    ...validateCharacterSpec(spec).map((issue) => ({
      code: issue.code,
      severity: "error" as const,
      message: issue.message,
      ...(issue.path ? { path: issue.path } : {})
    }))
  ];
  const assumptions: ComputeResultAssumptionEntry[] = [];

  if (spec.class && normalizedSpec.class) {
    const originalLevel = Number(spec.class.level);
    const normalizedLevel = normalizedSpec.class.level;

    if (originalLevel !== normalizedLevel) {
      assumptions.push({
        code: "SPEC_CLASS_LEVEL_CLAMPED",
        message: `Class level was adjusted during normalization (set to ${normalizedLevel}).`,
        path: "class.level",
        defaultUsed: normalizedLevel
      });
    }
  }

  const state = buildComputeStateFromSpec(normalizedSpec);
  const context: EngineContext = {
    resolvedData: rulepack.resolvedData,
    enabledPackIds: rulepack.enabledPackIds ?? normalizedSpec.meta.sourceIds
  };
  const sanitized = sanitizeStateForComputeOutput(state);

  assumptions.push(...sanitized.assumptions);

  validationIssues.push(
    ...collectValidationErrorsFromState(sanitized.state, context, { allowFlowDefaultAbilityMode: false }).map((issue) => ({
      code: issue.code,
      severity: "error" as const,
      message: issue.message,
      ...(issue.stepId && mapStepIdToSpecPath(issue.stepId)
        ? { path: mapStepIdToSpecPath(issue.stepId) }
        : {})
    }))
  );

  const sheet = buildCharacterSheetFromState(sanitized.state, context);
  const unresolved: ComputeResultUnresolvedEntry[] = sheet.unresolvedRules.map((entry) => ({
    code: entry.id,
    message: entry.description,
    ...(entry.dependsOn.length || entry.source.entityId
      ? { relatedIds: [entry.source.entityId, ...entry.dependsOn] }
      : {})
  }));

  return {
    schemaVersion: COMPUTE_RESULT_SCHEMA_VERSION,
    sheetViewModel: {
      schemaVersion: COMPUTE_RESULT_SCHEMA_VERSION,
      data: sheet.sheetViewModel
    },
    validationIssues,
    unresolved,
    assumptions,
    provenance: sheet.provenance
  };
}
export { DEFAULT_STATS };
