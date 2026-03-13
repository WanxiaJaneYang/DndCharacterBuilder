import type { ResolvedPackSet } from "@dcb/datapack";
import type { UIText } from "../../uiText";

type ReviewFeatTraitSectionProps = {
  text: UIText;
  entities: ResolvedPackSet["entities"];
  selectedFeats: string[];
  racialTraits: Array<Record<string, unknown>>;
};

export function ReviewFeatTraitSection({
  text,
  entities,
  selectedFeats,
  racialTraits,
}: ReviewFeatTraitSectionProps) {
  return (
    <>
      <article className="sheet">
        <h3>{text.REVIEW_FEAT_SUMMARY}</h3>
        {selectedFeats.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {selectedFeats.map((featId) => {
              const feat = entities.feats?.[featId];
              return (
                <li key={featId}>
                  <strong>{feat?.name ?? featId}</strong>:{" "}
                  {feat?.summary ?? feat?.description ?? featId}
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_TRAIT_SUMMARY}</h3>
        {racialTraits.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {racialTraits.map((trait, index) => (
              <li key={`${String(trait.name ?? "")}-${index}`}>
                <strong>{String(trait.name ?? "")}</strong>:{" "}
                {String(trait.description ?? "").trim()}
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
