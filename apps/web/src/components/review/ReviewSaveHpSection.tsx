import type { UIText } from "../../uiText";
import type { ReviewStepProps } from "./reviewTypes";

type ReviewSaveHpSectionProps = {
  text: UIText;
  reviewData: ReviewStepProps["reviewData"];
};

export function ReviewSaveHpSection({
  text,
  reviewData,
}: ReviewSaveHpSectionProps) {
  return (
    <article className="sheet">
      <h3>{text.REVIEW_SAVE_HP_BREAKDOWN}</h3>
      <table className="review-table">
        <thead>
          <tr>
            <th>{text.REVIEW_STAT_COLUMN}</th>
            <th>{text.REVIEW_BASE_COLUMN}</th>
            <th>{text.REVIEW_ABILITY_COLUMN}</th>
            <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
            <th>{text.REVIEW_FINAL_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="review-cell-key">{text.REVIEW_FORT_LABEL}</td>
            <td>{reviewData.saves.fort.base}</td>
            <td>{reviewData.saves.fort.ability}</td>
            <td>{reviewData.saves.fort.misc}</td>
            <td>{reviewData.saves.fort.total}</td>
          </tr>
          <tr>
            <td className="review-cell-key">{text.REVIEW_REF_LABEL}</td>
            <td>{reviewData.saves.ref.base}</td>
            <td>{reviewData.saves.ref.ability}</td>
            <td>{reviewData.saves.ref.misc}</td>
            <td>{reviewData.saves.ref.total}</td>
          </tr>
          <tr>
            <td className="review-cell-key">{text.REVIEW_WILL_LABEL}</td>
            <td>{reviewData.saves.will.base}</td>
            <td>{reviewData.saves.will.ability}</td>
            <td>{reviewData.saves.will.misc}</td>
            <td>{reviewData.saves.will.total}</td>
          </tr>
          <tr>
            <td className="review-cell-key">{text.REVIEW_HP_LABEL}</td>
            <td>{reviewData.hp.breakdown.hitDie}</td>
            <td>{reviewData.hp.breakdown.con}</td>
            <td>{reviewData.hp.breakdown.misc}</td>
            <td>{reviewData.hp.total}</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
