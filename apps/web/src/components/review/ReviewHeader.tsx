import type { UIText } from "../../uiText";

type ReviewHeaderProps = {
  text: UIText;
  characterName?: string;
  selectedRaceName: string;
  selectedClassName: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
};

export function ReviewHeader({
  text,
  characterName,
  selectedRaceName,
  selectedClassName,
  onExportJson,
  onToggleProvenance,
}: ReviewHeaderProps) {
  return (
    <header className="review-hero">
      <div>
        <h3 className="review-character-name">
          {characterName || text.UNNAMED_CHARACTER}
        </h3>
        <p className="review-character-meta">
          {text.RACE_LABEL}: <strong>{selectedRaceName}</strong> |{" "}
          {text.CLASS_LABEL}: <strong>{selectedClassName}</strong>
        </p>
      </div>
      <div className="review-actions">
        <button onClick={onExportJson}>{text.EXPORT_JSON}</button>
        <button onClick={onToggleProvenance}>{text.TOGGLE_PROVENANCE}</button>
      </div>
    </header>
  );
}
