import type { CharacterState, ComputeResult } from "@dcb/engine";
import type { UIText } from "../../uiText";
import type {
  LocalizeAbilityLabel,
  ReviewStepProps,
} from "./reviewTypes";
import {
  REVIEW_ABILITY_ORDER,
  createFormatSourceLabel,
  formatSigned,
} from "./reviewUtils";

type ReviewAbilityTableProps = {
  text: UIText;
  state: CharacterState;
  reviewData: ReviewStepProps["reviewData"];
  provenanceByTargetPath: ReviewStepProps["provenanceByTargetPath"];
  sourceNameByEntityId: Map<string, string>;
  localizeAbilityLabel: LocalizeAbilityLabel;
};

export function ReviewAbilityTable({
  text,
  state,
  reviewData,
  provenanceByTargetPath,
  sourceNameByEntityId,
  localizeAbilityLabel,
}: ReviewAbilityTableProps) {
  const formatSourceLabel = createFormatSourceLabel(
    sourceNameByEntityId,
    text.REVIEW_UNRESOLVED_LABEL,
  );

  return (
    <article className="sheet">
      <h3>{text.REVIEW_ABILITY_BREAKDOWN}</h3>
      <table className="review-table">
        <caption className="sr-only">{text.REVIEW_ABILITY_TABLE_CAPTION}</caption>
        <thead>
          <tr>
            <th>{text.REVIEW_ABILITY_COLUMN}</th>
            <th>{text.REVIEW_BASE_COLUMN}</th>
            <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
            <th>{text.REVIEW_FINAL_COLUMN}</th>
            <th>{text.REVIEW_MODIFIER_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          {REVIEW_ABILITY_ORDER.map((ability) => {
            const targetPath = `abilities.${ability}.score`;
            const baseScore = Number(state.abilities[ability] ?? 10);
            const records = provenanceByTargetPath.get(targetPath) ?? [];
            const finalScore = reviewData.abilities[ability]?.score ?? baseScore;
            const finalMod = reviewData.abilities[ability]?.mod ?? 0;

            return (
              <tr key={ability}>
                <td className="review-cell-key">
                  {localizeAbilityLabel(ability)}
                </td>
                <td>{baseScore}</td>
                <td>
                  {records.length === 0 ? (
                    <span className="review-muted">-</span>
                  ) : (
                    <ReviewAdjustmentList
                      records={records}
                      targetPath={targetPath}
                      formatSourceLabel={formatSourceLabel}
                    />
                  )}
                </td>
                <td>{finalScore}</td>
                <td>{formatSigned(finalMod)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

function ReviewAdjustmentList({
  records,
  targetPath,
  formatSourceLabel,
}: {
  records: NonNullable<ComputeResult["provenance"]>;
  targetPath: string;
  formatSourceLabel: (packId: string, entityId: string) => string;
}) {
  return (
    <ul className="calc-list">
      {records.map((record, index) => (
        <li key={`${targetPath}-${index}`}>
          <code>
            {record.delta !== undefined
              ? formatSigned(record.delta)
              : `= ${record.setValue ?? 0}`}
          </code>{" "}
          {formatSourceLabel(record.source.packId, record.source.entityId)}
        </li>
      ))}
    </ul>
  );
}
