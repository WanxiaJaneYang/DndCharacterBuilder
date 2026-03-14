import type {
  ProvenanceRecord,
  SkillBreakdown,
  SkillMiscBreakdownEntry,
  RacialModifierBreakdown,
  SpellDcBonusBreakdown,
  InnateSpellLikeAbilityBreakdown,
  UnresolvedRule
} from "./legacyRuntimeTypes";
import type {
  CharacterSheet,
  Phase1Sheet,
  Phase2Sheet
} from "./legacyRuntimeSheetTypes";
import type {
  AttackBonusBreakdown,
  AttackLine,
  SheetViewModel
} from "./legacyRuntimeViewModelTypes";
import type { EngineContext, DecisionSummary } from "./legacyRuntimeTypes";

type ComputeResultSchemaVersion = typeof COMPUTE_RESULT_SCHEMA_VERSION;

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
  UnresolvedRule,
  CharacterSheet
};
