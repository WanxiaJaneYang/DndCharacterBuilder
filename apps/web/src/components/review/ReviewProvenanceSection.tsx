import type { ComputeResult } from "@dcb/engine";
import type { UIText } from "../../uiText";

type ReviewProvenanceSectionProps = {
  text: UIText;
  provenance: ComputeResult["provenance"];
};

export function ReviewProvenanceSection({
  text,
  provenance,
}: ReviewProvenanceSectionProps) {
  return (
    <article className="sheet">
      <h3>{text.REVIEW_RAW_PROVENANCE}</h3>
      <pre>{JSON.stringify(provenance ?? [], null, 2)}</pre>
    </article>
  );
}
