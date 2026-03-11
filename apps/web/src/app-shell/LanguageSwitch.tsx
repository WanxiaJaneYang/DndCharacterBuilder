import type { Language, UIText } from "../uiText";

type LanguageSwitchProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
};

export function LanguageSwitch({
  language,
  onLanguageChange,
  text,
}: LanguageSwitchProps) {
  return (
    <div
      className="language-switch"
      role="radiogroup"
      aria-label={text.LANGUAGE_LABEL}
    >
      <label className={`lang-btn ${language === "en" ? "active" : ""}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="en"
          checked={language === "en"}
          onChange={() => onLanguageChange("en")}
        />
        <span>{text.ENGLISH}</span>
      </label>
      <label className={`lang-btn ${language === "zh" ? "active" : ""}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="zh"
          checked={language === "zh"}
          onChange={() => onLanguageChange("zh")}
        />
        <span>{text.CHINESE}</span>
      </label>
    </div>
  );
}
