import { EDITIONS, FALLBACK_EDITION, type EditionOption } from "../editions";
import type { Language, UIText } from "../uiText";
import { LanguageSwitch } from "./LanguageSwitch";

type RulesSetupGateProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
  selectedEditionId: string;
  onEditionChange: (editionId: string) => void;
  selectedOptionalPackIds: string[];
  onOptionalPackToggle: (packId: string) => void;
  onBack: () => void;
  onStart: () => void;
};

export function RulesSetupGate({
  language,
  onLanguageChange,
  text,
  selectedEditionId,
  onEditionChange,
  selectedOptionalPackIds,
  onOptionalPackToggle,
  onBack,
  onStart,
}: RulesSetupGateProps) {
  const selectedEdition: EditionOption =
    EDITIONS.find((edition) => edition.id === selectedEditionId) ??
    EDITIONS[0] ??
    FALLBACK_EDITION;

  return (
    <main
      className={`container ${language === "zh" ? "lang-zh" : ""}`}
      lang={language}
    >
      <LanguageSwitch
        language={language}
        onLanguageChange={onLanguageChange}
        text={text}
      />
      <h1>{text.RULES_SETUP_TITLE}</h1>
      <section>
        <label htmlFor="edition-select">{text.EDITION_LABEL}</label>
        <select
          id="edition-select"
          value={selectedEditionId}
          onChange={(event) => onEditionChange(event.target.value)}
        >
          {EDITIONS.map((edition) => (
            <option key={edition.id} value={edition.id}>
              {edition.label}
            </option>
          ))}
        </select>
      </section>
      <section>
        <h2>{text.SOURCES_LABEL}</h2>
        <input
          id="base-pack-checkbox"
          type="checkbox"
          checked
          disabled
          aria-label={`${selectedEdition.basePackId} (${text.BASE_SOURCE_LOCKED_LABEL})`}
        />
        <label htmlFor="base-pack-checkbox">
          {selectedEdition.basePackId} ({text.BASE_SOURCE_LOCKED_LABEL})
        </label>
        {selectedEdition.optionalPackIds.length === 0 && <p>-</p>}
        {selectedEdition.optionalPackIds.map((packId) => (
          <label key={packId}>
            <input
              type="checkbox"
              checked={selectedOptionalPackIds.includes(packId)}
              onChange={() => onOptionalPackToggle(packId)}
            />
            {packId}
          </label>
        ))}
      </section>
      <footer className="actions">
        <button onClick={onBack}>{text.BACK}</button>
        <button onClick={onStart}>{text.START_WIZARD}</button>
      </footer>
    </main>
  );
}
