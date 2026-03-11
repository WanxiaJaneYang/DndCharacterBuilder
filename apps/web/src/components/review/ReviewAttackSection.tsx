import type { UIText } from "../../uiText";
import type { ReviewStepProps } from "./reviewTypes";
import { formatSigned } from "./reviewUtils";

type ReviewAttackSectionProps = {
  text: UIText;
  combatData: ReviewStepProps["combatData"];
};

export function ReviewAttackSection({
  text,
  combatData,
}: ReviewAttackSectionProps) {
  return (
    <article className="sheet">
      <h3>{text.REVIEW_ATTACK_LINES}</h3>
      <table className="review-table">
        <thead>
          <tr>
            <th>{text.REVIEW_ATTACK_TYPE_COLUMN}</th>
            <th>{text.REVIEW_ATTACK_ITEM_COLUMN}</th>
            <th>{text.REVIEW_ATTACK_BONUS_COLUMN}</th>
            <th>{text.REVIEW_DAMAGE_COLUMN}</th>
            <th>{text.REVIEW_CRIT_COLUMN}</th>
            <th>{text.REVIEW_RANGE_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          {combatData.attacks.map((attack) => (
            <tr key={`${attack.category}-${attack.itemId}`}>
              <td className="review-cell-key">
                {attack.category === "melee"
                  ? text.REVIEW_ATTACK_MELEE_LABEL
                  : text.REVIEW_ATTACK_RANGED_LABEL}
              </td>
              <td>{attack.name}</td>
              <td>{formatSigned(attack.attackBonus)}</td>
              <td>{attack.damageLine}</td>
              <td>{attack.crit}</td>
              <td>{attack.category === "ranged" ? attack.range ?? "-" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
