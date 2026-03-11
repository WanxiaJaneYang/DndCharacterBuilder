import type { ResolvedPackSet } from "@dcb/datapack";
import type { CharacterState, ComputeResult } from "@dcb/engine";
import type { EditionOption } from "../../editions";
import type { UIText } from "../../uiText";

export type EntityLike = {
  name: string;
  data?: unknown;
};

export type ReviewStepProps = {
  text: UIText;
  state: CharacterState;
  spec: {
    meta: { name?: string };
    class?: { classId?: string; level?: number };
  };
  computeResult: ComputeResult;
  reviewData: ComputeResult["sheetViewModel"]["data"]["review"];
  combatData: ComputeResult["sheetViewModel"]["data"]["combat"];
  entities: ResolvedPackSet["entities"];
  selectedEdition: EditionOption;
  fingerprint: string;
  selectedFeats: string[];
  selectedRaceEntity?: EntityLike;
  selectedClassEntity?: EntityLike;
  provenanceByTargetPath: Map<string, NonNullable<ComputeResult["provenance"]>>;
  sourceNameByEntityId: Map<string, string>;
  packVersionById: Map<string, string>;
  enabledPackIds: string[];
  showProv: boolean;
  onToggleProvenance: () => void;
  onExportJson: () => void;
  localizeLoadCategory: (category: "light" | "medium" | "heavy") => string;
  formatSpeedImpact: (adjustedSpeed: number, reducesSpeed: boolean) => string;
  formatMovementNotes: (reducedByArmorOrLoad: boolean) => string[];
  localizeAbilityLabel: (ability: string) => string;
  localizeEntityText: (
    entityType: string,
    entityId: string,
    path: string,
    fallback: string,
  ) => string;
};

export type LocalizeEntityText = ReviewStepProps["localizeEntityText"];
export type LocalizeAbilityLabel = ReviewStepProps["localizeAbilityLabel"];
export type FormatSpeedImpact = ReviewStepProps["formatSpeedImpact"];
export type FormatMovementNotes = ReviewStepProps["formatMovementNotes"];
export type LocalizeLoadCategory = ReviewStepProps["localizeLoadCategory"];
