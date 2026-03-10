import type { AbilityCode, UIText } from "../uiText";
import {
  buildReviewSheetData,
  type ReviewSheetData,
} from "./pageDataBuilders";

type EntityWithData = {
  name?: string;
  data?: unknown;
};

type ReviewDataInput = Parameters<typeof buildReviewSheetData>[0]["reviewData"];
type ReviewCombatInput = Parameters<typeof buildReviewSheetData>[0]["reviewCombat"];
type ReviewSkillsInput = Parameters<typeof buildReviewSheetData>[0]["skills"];
type ProvenanceInput = Parameters<typeof buildReviewSheetData>[0]["provenanceByTargetPath"];
type FeatLookup = Parameters<typeof buildReviewSheetData>[0]["featsById"];

type Args = {
  t: UIText;
  characterName?: string;
  selectedRaceId: string;
  selectedClassId: string;
  selectedRaceEntity?: EntityWithData;
  selectedClassEntity?: EntityWithData;
  reviewData: ReviewDataInput;
  reviewCombat: ReviewCombatInput;
  selectedFeats: string[];
  featsById: FeatLookup;
  skills: ReviewSkillsInput;
  baseAbilityScores: Record<string, number>;
  provenanceByTargetPath: ProvenanceInput;
  sourceNameByEntityId: Map<string, string>;
  localizeAbilityLabel: (ability: AbilityCode) => string;
  localizeEntityText: (
    entityType: string,
    entityId: string,
    path: string,
    fallback: string,
  ) => string;
  enabledPackIds: string[];
  packVersionById: Map<string, string>;
  selectedEditionLabel: string;
  fingerprint: string;
  localizeLoadCategory: (category: "light" | "medium" | "heavy") => string;
  formatSpeedImpact: (adjustedSpeed: number, reducesSpeed: boolean) => string;
  formatMovementNotes: (reducedByArmorOrLoad: boolean) => string[];
  showProvenance: boolean;
  provenanceJson: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
};

function getEntityDataRecord(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data as Record<string, unknown>;
}

export function buildReviewSheetPageData(args: Args): ReviewSheetData {
  const selectedRaceName = args.selectedRaceId
    ? args.localizeEntityText(
        "races",
        args.selectedRaceId,
        "name",
        args.selectedRaceEntity?.name ?? args.t.REVIEW_UNRESOLVED_LABEL,
      )
    : args.t.REVIEW_UNRESOLVED_LABEL;
  const selectedClassName = args.selectedClassId
    ? args.localizeEntityText(
        "classes",
        args.selectedClassId,
        "name",
        args.selectedClassEntity?.name ?? args.t.REVIEW_UNRESOLVED_LABEL,
      )
    : args.t.REVIEW_UNRESOLVED_LABEL;
  const racialTraits = Array.isArray(
    getEntityDataRecord(args.selectedRaceEntity?.data).racialTraits,
  )
    ? (getEntityDataRecord(args.selectedRaceEntity?.data).racialTraits as Array<
        Record<string, unknown>
      >)
    : [];

  return buildReviewSheetData({
    t: args.t,
    characterName: args.characterName,
    selectedRaceName,
    selectedClassName,
    reviewData: args.reviewData,
    reviewCombat: args.reviewCombat,
    selectedFeats: args.selectedFeats,
    featsById: args.featsById,
    racialTraits,
    skills: args.skills,
    baseAbilityScores: args.baseAbilityScores,
    provenanceByTargetPath: args.provenanceByTargetPath,
    formatSourceLabel: (packId, entityId) =>
      args.sourceNameByEntityId.get(`${packId}:${entityId}`) ??
      args.t.REVIEW_UNRESOLVED_LABEL,
    localizeAbilityLabel: args.localizeAbilityLabel,
    localizeEntityText: args.localizeEntityText,
    enabledPackIds: args.enabledPackIds,
    packVersionById: args.packVersionById,
    selectedEditionLabel: args.selectedEditionLabel,
    fingerprint: args.fingerprint,
    localizeLoadCategory: args.localizeLoadCategory,
    formatSpeedImpact: args.formatSpeedImpact,
    formatMovementNotes: args.formatMovementNotes,
    showProvenance: args.showProvenance,
    provenanceJson: args.provenanceJson,
    onExportJson: args.onExportJson,
    onToggleProvenance: args.onToggleProvenance,
  });
}
