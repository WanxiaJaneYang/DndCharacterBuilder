import type { UIText } from "../../uiText";
import type { ReviewStepProps } from "./reviewTypes";

type ReviewStatCardsProps = {
  text: UIText;
  reviewData: ReviewStepProps["reviewData"];
  combatData: ReviewStepProps["combatData"];
};

export function ReviewStatCards({
  text,
  reviewData,
  combatData,
}: ReviewStatCardsProps) {
  const cards = [
    { label: text.REVIEW_AC_LABEL, value: combatData.ac.total },
    { label: text.REVIEW_AC_TOUCH_LABEL, value: combatData.ac.touch },
    {
      label: text.REVIEW_AC_FLAT_FOOTED_LABEL,
      value: combatData.ac.flatFooted,
    },
    { label: text.REVIEW_HP_LABEL, value: reviewData.hp.total },
    { label: text.REVIEW_INITIATIVE_LABEL, value: reviewData.initiative.total },
    { label: text.REVIEW_GRAPPLE_LABEL, value: reviewData.grapple.total },
  ];

  return (
    <div className="review-stat-cards">
      {cards.map((card) => (
        <article className="review-card" key={card.label}>
          <h3>{card.label}</h3>
          <p>{String(card.value)}</p>
        </article>
      ))}
    </div>
  );
}
