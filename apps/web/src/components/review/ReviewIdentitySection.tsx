import type { UIText } from "../../uiText";
import type { ReviewStepProps } from "./reviewTypes";

type ReviewIdentitySectionProps = {
  text: UIText;
  reviewData: ReviewStepProps["reviewData"];
};

export function ReviewIdentitySection({
  text,
  reviewData,
}: ReviewIdentitySectionProps) {
  return (
    <article className="sheet review-decisions">
      <h3>{text.REVIEW_IDENTITY_PROGRESSION}</h3>
      <p>{text.REVIEW_LEVEL_LABEL}: {reviewData.identity.level}</p>
      <p>{text.REVIEW_XP_LABEL}: {reviewData.identity.xp}</p>
      <p>{text.REVIEW_SIZE_LABEL}: {reviewData.identity.size}</p>
      <p>{text.REVIEW_SPEED_BASE_LABEL}: {reviewData.identity.speed.base}</p>
      <p>
        {text.REVIEW_SPEED_ADJUSTED_LABEL}: {reviewData.identity.speed.adjusted}
      </p>
    </article>
  );
}
