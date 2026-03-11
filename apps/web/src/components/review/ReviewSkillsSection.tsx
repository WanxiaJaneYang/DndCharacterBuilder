import type { UIText } from "../../uiText";
import type {
  LocalizeAbilityLabel,
  LocalizeEntityText,
  ReviewStepProps,
} from "./reviewTypes";
import { formatSigned } from "./reviewUtils";

type ReviewSkillsSectionProps = {
  text: UIText;
  reviewData: ReviewStepProps["reviewData"];
  reviewSkills: ReviewStepProps["computeResult"]["sheetViewModel"]["data"]["skills"];
  skillUiDetailById: ReviewStepProps["skillUiDetailById"];
  localizeEntityText: LocalizeEntityText;
  localizeAbilityLabel: LocalizeAbilityLabel;
};

export function ReviewSkillsSection({
  text,
  reviewData,
  reviewSkills,
  skillUiDetailById,
  localizeEntityText,
  localizeAbilityLabel,
}: ReviewSkillsSectionProps) {
  return (
    <article className="sheet">
      <h3>{text.REVIEW_SKILLS_BREAKDOWN}</h3>
      <p>
        {text.REVIEW_POINTS_SPENT_LABEL} {reviewData.skillBudget.spent} /{" "}
        {reviewData.skillBudget.total} ({reviewData.skillBudget.remaining}{" "}
        {text.REVIEW_REMAINING_LABEL})
      </p>
      <table className="review-table">
        <caption className="sr-only">{text.REVIEW_SKILLS_TABLE_CAPTION}</caption>
        <thead>
          <tr>
            <th>{text.REVIEW_SKILL_COLUMN}</th>
            <th>{text.REVIEW_RANKS_COLUMN}</th>
            <th>{text.REVIEW_ABILITY_COLUMN}</th>
            <th>{text.REVIEW_RACIAL_COLUMN}</th>
            <th>{text.REVIEW_MISC_COLUMN}</th>
            <th>{text.REVIEW_ACP_COLUMN}</th>
            <th>{text.REVIEW_TOTAL_COLUMN}</th>
            <th>{text.REVIEW_POINT_COST_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          {reviewSkills.map((skill) => {
            const detail = skillUiDetailById.get(skill.id);
            return (
              <tr key={skill.id}>
                <td className="review-cell-key">
                  {localizeEntityText("skills", skill.id, "name", skill.name)}
                </td>
                <td>{skill.ranks}</td>
                <td>
                  {formatSigned(skill.abilityMod)} (
                  {localizeAbilityLabel(skill.abilityKey)})
                </td>
                <td>{formatSigned(detail?.racialBonus ?? 0)}</td>
                <td>{formatSigned(skill.misc)}</td>
                <td>{formatSigned(skill.acp)}</td>
                <td>{skill.total}</td>
                <td>
                  {detail?.costSpent ?? 0} ({detail?.costPerRank ?? 0}
                  {text.REVIEW_PER_RANK_UNIT})
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
