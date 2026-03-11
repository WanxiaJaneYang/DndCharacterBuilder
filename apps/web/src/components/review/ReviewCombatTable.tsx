import type { UIText } from "../../uiText";
import type { ReviewStepProps } from "./reviewTypes";
import {
  REVIEW_STAT_ORDER,
  createFormatSourceLabel,
  formatSigned,
  getReviewStatBaseDefaults,
} from "./reviewUtils";

type ReviewCombatTableProps = {
  text: UIText;
  finalStatValues: Record<(typeof REVIEW_STAT_ORDER)[number], number>;
  provenanceByTargetPath: ReviewStepProps["provenanceByTargetPath"];
  sourceNameByEntityId: Map<string, string>;
};

export function ReviewCombatTable({
  text,
  finalStatValues,
  provenanceByTargetPath,
  sourceNameByEntityId,
}: ReviewCombatTableProps) {
  const statBaseDefaults = getReviewStatBaseDefaults();
  const statLabels = {
    hp: text.REVIEW_HP_LABEL,
    ac: text.REVIEW_AC_LABEL,
    initiative: text.REVIEW_INITIATIVE_LABEL,
    speed: text.REVIEW_SPEED_LABEL,
    bab: text.REVIEW_BAB_LABEL,
    fort: text.REVIEW_FORT_LABEL,
    ref: text.REVIEW_REF_LABEL,
    will: text.REVIEW_WILL_LABEL,
  } as const;
  const formatSourceLabel = createFormatSourceLabel(
    sourceNameByEntityId,
    text.REVIEW_UNRESOLVED_LABEL,
  );

  return (
    <article className="sheet">
      <h3>{text.REVIEW_COMBAT_BREAKDOWN}</h3>
      <table className="review-table">
        <caption className="sr-only">{text.REVIEW_COMBAT_TABLE_CAPTION}</caption>
        <thead>
          <tr>
            <th>{text.REVIEW_STAT_COLUMN}</th>
            <th>{text.REVIEW_BASE_COLUMN}</th>
            <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
            <th>{text.REVIEW_FINAL_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          {REVIEW_STAT_ORDER.map((statKey) => {
            const targetPath = `stats.${statKey}`;
            const records = provenanceByTargetPath.get(targetPath) ?? [];
            const firstSetIndex = records.findIndex(
              (record) => record.setValue !== undefined,
            );
            const baseValue =
              firstSetIndex >= 0
                ? Number(
                    records[firstSetIndex]?.setValue ?? statBaseDefaults[statKey],
                  )
                : statBaseDefaults[statKey];
            const adjustmentRecords = records.filter(
              (_, index) => index !== firstSetIndex,
            );

            return (
              <tr key={statKey}>
                <td className="review-cell-key">{statLabels[statKey]}</td>
                <td>{baseValue}</td>
                <td>
                  {adjustmentRecords.length === 0 ? (
                    <span className="review-muted">-</span>
                  ) : (
                    <ul className="calc-list">
                      {adjustmentRecords.map((record, index) => (
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
                  )}
                </td>
                <td>{String(finalStatValues[statKey])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
