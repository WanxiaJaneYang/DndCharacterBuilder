import {
  buildCharacterSheetFromState,
  collectValidationErrorsFromState,
  type EngineContext,
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
  type UnresolvedRule,
  DEFAULT_STATS
} from "./legacyRuntime";
import {
  normalizeCharacterSpec,
  validateCharacterSpec,
  type CharacterSpec,
  type CharacterState
} from "./characterSpec";

type ComputeResultSchemaVersion = typeof COMPUTE_RESULT_SCHEMA_VERSION;
type AbilityKey = keyof CharacterState["abilities"];

const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

const STEP_ID_TO_SPEC_PATH: Record<string, string> = {
  name: "meta.name",
  abilities: "abilities",
  race: "raceId",
  races: "raceId",
  class: "class.classId",
  classes: "class.classId",
  feat: "featIds",
  feats: "featIds",
  skills: "skillRanks",
  equipment: "equipmentIds",
  items: "equipmentIds"
};

export const COMPUTE_RESULT_SCHEMA_VERSION = "0.1" as const;

export interface ComputeResultValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  path?: string;
  relatedIds?: string[];
}

export interface ComputeResultUnresolvedEntry {
  code: string;
  message: string;
  path?: string;
  relatedIds?: string[];
  suggestedNext?: string;
}

export interface ComputeResultAssumptionEntry {
  code: string;
  message: string;
  path?: string;
  defaultUsed: unknown;
}

export interface VersionedSheetViewModel {
  schemaVersion: ComputeResultSchemaVersion;
  data: SheetViewModel;
}

export interface ComputeResult {
  schemaVersion: ComputeResultSchemaVersion;
  sheetViewModel: VersionedSheetViewModel;
  validationIssues: ComputeResultValidationIssue[];
  unresolved: ComputeResultUnresolvedEntry[];
  assumptions: ComputeResultAssumptionEntry[];
  provenance?: ProvenanceRecord[];
}

export interface RulepackInput {
  resolvedData: EngineContext["resolvedData"];
  enabledPackIds?: string[];
}

function mapStepIdToSpecPath(stepId: string): string | undefined {
  return STEP_ID_TO_SPEC_PATH[stepId];
}

function buildComputeStateFromSpec(spec: CharacterSpec): CharacterState {
  const hasSkillRanks = Object.keys(spec.skillRanks ?? {}).length > 0;
  const classId = spec.class
    ? spec.class.level > 1
      ? `${spec.class.classId.replace(/-\d+$/, "")}-${spec.class.level}`
      : spec.class.classId.replace(/-\d+$/, "")
    : undefined;

  return {
    metadata: spec.meta.name?.length ? { name: spec.meta.name } : {},
    abilities: { ...spec.abilities },
    selections: {
      ...(spec.raceId ? { race: spec.raceId } : {}),
      ...(classId ? { class: classId } : {}),
      ...(hasSkillRanks ? { skills: spec.skillRanks } : {}),
      feats: spec.featIds ?? [],
      equipment: spec.equipmentIds ?? []
    }
  };
}

function sanitizeStateForComputeOutput(
  state: CharacterState
): { state: CharacterState; assumptions: ComputeResultAssumptionEntry[] } {
  let nextState: CharacterState | undefined;
  const assumptions: ComputeResultAssumptionEntry[] = [];

  const toSanitizedAbilityScore = (
    value: unknown
  ): { valid: true; numeric: number } | { valid: false } => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? { valid: true, numeric: value } : { valid: false };
    }
    if (typeof value !== "string") return { valid: false };

    const trimmed = value.trim();
    if (!trimmed) return { valid: false };
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return { valid: false };

    try {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? { valid: true, numeric } : { valid: false };
    } catch {
      return { valid: false };
    }
  };

  for (const ability of ABILITY_KEYS) {
    const sanitized = toSanitizedAbilityScore(state.abilities[ability]);
    if (sanitized.valid) {
      if (sanitized.numeric === state.abilities[ability]) continue;
      nextState ??= {
        ...state,
        abilities: { ...state.abilities }
      };
      nextState.abilities[ability] = sanitized.numeric;
      continue;
    }

    nextState ??= {
      ...state,
      abilities: { ...state.abilities }
    };
    nextState.abilities[ability] = 10;
    assumptions.push({
      code: "SPEC_ABILITY_DEFAULTED",
      message: `${ability.toUpperCase()} was defaulted to 10 for compute output because the input value was not finite.`,
      path: `abilities.${ability}`,
      defaultUsed: 10
    });
  }

  return {
    state: nextState ?? state,
    assumptions
  };
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

export type {
  ProvenanceRecord,
  SkillBreakdown,
  SkillMiscBreakdownEntry,
  RacialModifierBreakdown,
  SpellDcBonusBreakdown,
  InnateSpellLikeAbilityBreakdown,
  DecisionSummary,
  AttackLine,
  AttackBonusBreakdown,
  SheetViewModel,
  Phase1Sheet,
  Phase2Sheet,
  UnresolvedRule
};

export { DEFAULT_STATS };
