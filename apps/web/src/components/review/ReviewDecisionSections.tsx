import type { UIText } from "../../uiText";
import type {
  FormatMovementNotes,
  FormatSpeedImpact,
  LocalizeEntityText,
  LocalizeLoadCategory,
  ReviewStepProps,
} from "./reviewTypes";

type ReviewDecisionSectionsProps = {
  text: UIText;
  reviewData: ReviewStepProps["reviewData"];
  selectedEdition: ReviewStepProps["selectedEdition"];
  fingerprint: string;
  enabledPackDetails: Array<{ packId: string; version: string }>;
  localizeEntityText: LocalizeEntityText;
  localizeLoadCategory: LocalizeLoadCategory;
  formatSpeedImpact: FormatSpeedImpact;
  formatMovementNotes: FormatMovementNotes;
};

export function ReviewDecisionSections({
  text,
  reviewData,
  selectedEdition,
  fingerprint,
  enabledPackDetails,
  localizeEntityText,
  localizeLoadCategory,
  formatSpeedImpact,
  formatMovementNotes,
}: ReviewDecisionSectionsProps) {
  return (
    <>
      <article className="sheet review-decisions">
        <h3>{text.REVIEW_EQUIPMENT_LOAD}</h3>
        <p>
          {text.REVIEW_SELECTED_ITEMS_LABEL}:{" "}
          {reviewData.equipmentLoad.selectedItems
            .map((itemId) => localizeEntityText("items", itemId, "name", itemId))
            .join(", ") || "-"}
        </p>
        <p>{text.REVIEW_TOTAL_WEIGHT_LABEL}: {reviewData.equipmentLoad.totalWeight}</p>
        <p>
          {text.REVIEW_LOAD_CATEGORY_LABEL}:{" "}
          {localizeLoadCategory(reviewData.equipmentLoad.loadCategory)}
        </p>
        <p>
          {text.REVIEW_SPEED_IMPACT_LABEL}:{" "}
          {formatSpeedImpact(
            reviewData.movement.adjusted,
            reviewData.equipmentLoad.reducesSpeed,
          )}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_MOVEMENT_DETAIL}</h3>
        <p>{text.REVIEW_SPEED_BASE_LABEL}: {reviewData.movement.base}</p>
        <p>{text.REVIEW_SPEED_ADJUSTED_LABEL}: {reviewData.movement.adjusted}</p>
        <p>
          {text.REVIEW_MOVEMENT_NOTES_LABEL}:{" "}
          {formatMovementNotes(reviewData.movement.reducedByArmorOrLoad).join("; ")}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_RULES_DECISIONS}</h3>
        <p>
          {text.REVIEW_FAVORED_CLASS_LABEL}:{" "}
          {!reviewData.rulesDecisions.favoredClass
            ? "-"
            : reviewData.rulesDecisions.favoredClass === "any"
              ? text.REVIEW_FAVORED_CLASS_ANY
              : localizeEntityText(
                  "classes",
                  reviewData.rulesDecisions.favoredClass,
                  "name",
                  reviewData.rulesDecisions.favoredClass,
                )}
        </p>
        <p>
          {text.REVIEW_MULTICLASS_XP_IGNORED_LABEL}:{" "}
          {reviewData.rulesDecisions.ignoresMulticlassXpPenalty
            ? text.REVIEW_YES
            : text.REVIEW_NO}
        </p>
        <p>
          {text.REVIEW_FEAT_SLOTS_LABEL}:{" "}
          {reviewData.rulesDecisions.featSelectionLimit}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_PACK_INFO}</h3>
        <p>
          {text.REVIEW_SELECTED_EDITION_LABEL}:{" "}
          {selectedEdition.label || selectedEdition.id || "-"}
        </p>
        <p>{text.REVIEW_ENABLED_PACKS_LABEL}:</p>
        <ul>
          {enabledPackDetails.map((pack) => (
            <li key={pack.packId}>
              {pack.packId} ({pack.version})
            </li>
          ))}
        </ul>
        <p>
          {text.REVIEW_FINGERPRINT_LABEL}: <code>{fingerprint}</code>
        </p>
      </article>
    </>
  );
}
