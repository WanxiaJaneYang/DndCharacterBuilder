import type { UIText } from "../uiText";

type RollSetChooserProps = {
  text: UIText;
  generatedRollSets: number[][];
  selectedRollSetIndex: number;
  applySelectedRollSet: (set: number[], index: number) => void;
  regenerateRollSetOptions: () => void;
};

export function RollSetChooser({
  text,
  generatedRollSets,
  selectedRollSetIndex,
  applySelectedRollSet,
  regenerateRollSetOptions,
}: RollSetChooserProps) {
  return (
    <section className="sheet">
      <div className="rollsets-header">
        <h3>{text.ROLL_SET_SELECTION_TITLE}</h3>
        <button type="button" onClick={regenerateRollSetOptions}>
          {text.ROLL_SET_REROLL_BUTTON}
        </button>
      </div>
      <p>{text.ROLL_SET_SELECTION_DESCRIPTION}</p>
      <fieldset role="radiogroup" aria-label={text.ROLL_SET_OPTIONS_ARIA_LABEL}>
        {generatedRollSets.map((set, index) => (
          <label key={`roll-set-${index}`} className="rollset-option">
            <input
              type="radio"
              name="roll-set-choice"
              checked={selectedRollSetIndex === index}
              onChange={() => applySelectedRollSet(set, index)}
            />
            <span>
              {[text.ROLL_SET_OPTION_PREFIX, String(index + 1), text.ROLL_SET_OPTION_SUFFIX]
                .filter(Boolean)
                .join(" ")}
            </span>
            <code>{set.join(", ")}</code>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
