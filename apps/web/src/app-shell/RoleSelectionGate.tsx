import type { Language, UIText } from "../uiText";
import type { Role } from "./constants";
import { LanguageSwitch } from "./LanguageSwitch";

type RoleSelectionGateProps = {
  role: Role;
  onChange: (value: Role) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
};

export function RoleSelectionGate({
  role,
  onChange,
  language,
  onLanguageChange,
  text,
}: RoleSelectionGateProps) {
  return (
    <main
      className={`role-gate ${language === "zh" ? "lang-zh" : ""}`}
      lang={language}
    >
      <section className="role-tabs-root">
        <LanguageSwitch
          language={language}
          onLanguageChange={onLanguageChange}
          text={text}
        />
        <div className="role-tabs-grid" role="group" aria-label={text.ROLE_ARIA}>
          <button
            type="button"
            aria-pressed={role === "dm"}
            className={`role-tab role-tab-left ${role === "dm" ? "active" : ""}`}
            onClick={() => onChange("dm")}
          >
            <span className="role-tab-title">{text.DM_TITLE}</span>
            <span className="role-tab-subtitle">{text.DM_SUBTITLE}</span>
          </button>
          <button
            type="button"
            aria-pressed={role === "player"}
            className={`role-tab role-tab-right ${role === "player" ? "active" : ""}`}
            onClick={() => onChange("player")}
          >
            <span className="role-tab-title">{text.PLAYER_TITLE}</span>
            <span className="role-tab-subtitle">{text.PLAYER_SUBTITLE}</span>
          </button>
        </div>
        <div className="role-copy-overlay">
          <h1 className="role-question tabs-overlay">{text.ROLE_QUESTION}</h1>
          <p className="role-intro tabs-intro">{text.ROLE_INTRO}</p>
        </div>
        {role === "dm" && (
          <p className="role-message" aria-live="polite">
            {text.DM_UNSUPPORTED}
          </p>
        )}
      </section>
    </main>
  );
}
