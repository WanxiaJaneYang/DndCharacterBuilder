import { initialState } from "@dcb/engine/legacy";
import { LanguageSwitch } from "./LanguageSwitch";
import { RoleSelectionGate } from "./RoleSelectionGate";
import { RulesSetupGate } from "./RulesSetupGate";
import { WizardStepContent } from "./WizardStepContent";
import type { AppController } from "./useAppController";

export function WizardMainView({ controller }: { controller: AppController }) {
  const {
    role,
    setRole,
    language,
    setLanguage,
    rulesReady,
    setRulesReady,
    selectedEditionId,
    setSelectedEditionId,
    selectedOptionalPackIds,
    setSelectedOptionalPackIds,
    stepIndex,
    setStepIndex,
    setShowProv,
    canGoNext,
    appData,
    setState,
  } = controller;

  if (role !== "player") {
    return (
      <RoleSelectionGate
        role={role}
        onChange={setRole}
        language={language}
        onLanguageChange={setLanguage}
        text={appData.text}
      />
    );
  }

  if (!rulesReady) {
    return (
      <RulesSetupGate
        language={language}
        onLanguageChange={setLanguage}
        text={appData.text}
        selectedEditionId={selectedEditionId}
        onEditionChange={(editionId) => {
          setSelectedEditionId(editionId);
          setSelectedOptionalPackIds([]);
          setState(initialState);
          setStepIndex(0);
        }}
        selectedOptionalPackIds={selectedOptionalPackIds}
        onOptionalPackToggle={(packId) => {
          setSelectedOptionalPackIds((current) =>
            current.includes(packId)
              ? current.filter((id) => id !== packId)
              : [...current, packId],
          );
          setState(initialState);
          setStepIndex(0);
        }}
        onBack={() => {
          setRulesReady(false);
          setRole(null);
        }}
        onStart={() => {
          setState(initialState);
          setStepIndex(0);
          setShowProv(false);
          setRulesReady(true);
        }}
      />
    );
  }

  return (
    <main className={`container ${language === "zh" ? "lang-zh" : ""}`} lang={language}>
      <LanguageSwitch
        language={language}
        onLanguageChange={setLanguage}
        text={appData.text}
      />
      <h1>{appData.text.APP_TITLE}</h1>
      <p className="subtitle">{appData.text.APP_SUBTITLE}</p>
      <p>{appData.text.STEP_COUNTER} {stepIndex + 1} / {appData.wizardSteps.length}</p>
      <WizardStepContent controller={controller} />
      <footer className="actions">
        <button
          onClick={() => {
            if (stepIndex === 0) {
              setRulesReady(false);
              return;
            }
            setStepIndex((current) => current - 1);
          }}
        >
          {appData.text.BACK}
        </button>
        <button
          disabled={!canGoNext}
          onClick={() => setStepIndex((current) => current + 1)}
        >
          {appData.text.NEXT}
        </button>
      </footer>
    </main>
  );
}
