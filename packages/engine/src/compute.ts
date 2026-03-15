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

function buildSkillRankNormalizationAssumptions(
  spec: CharacterSpec
): ComputeResultAssumptionEntry[] {
  if (!spec.skillRanks || typeof spec.skillRanks !== "object" || Array.isArray(spec.skillRanks)) {
    return [];
  }

  return Object.entries(spec.skillRanks).flatMap(([skillId, rawRank]) => {
    const numericRank = Number(rawRank);
    if (Number.isFinite(numericRank) && numericRank >= 0) {
      return [];
    }

    const normalizedSkillId = String(skillId).trim().toLowerCase();
    if (!normalizedSkillId) {
      return [];
    }

    return [{
      code: "SPEC_SKILL_RANK_DROPPED",
      message: `Skill rank for ${normalizedSkillId} was removed during normalization.`,
      path: `skillRanks.${normalizedSkillId}`,
      defaultUsed: 0
    }];
  });
}

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

  assumptions.push(...buildSkillRankNormalizationAssumptions(spec));

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
    ...(entry.dependsOn.length || entry.source.entityId || (entry.impacts?.length ?? 0) > 0
      ? {
          relatedIds: Array.from(
            new Set([
              entry.source.entityId,
              ...entry.dependsOn,
              ...(entry.impacts ?? [])
            ].filter((value): value is string => Boolean(value)))
          )
        }
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
