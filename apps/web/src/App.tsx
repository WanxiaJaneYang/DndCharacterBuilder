import { useMemo, useState } from 'react';
import { resolveLoadedPacks } from '@dcb/datapack';
import { loadMinimalPack } from './loadMinimalPack';
import { applyChoice, finalizeCharacter, initialState, listChoices, type CharacterState } from '@dcb/engine';
import uiTextJson from './uiText.json';

const minimalPack = loadMinimalPack();
const resolvedData = resolveLoadedPacks([minimalPack], ['srd-35e-minimal']);
const context = { enabledPackIds: ['srd-35e-minimal'], resolvedData };

type Language = 'en' | 'zh';
type Role = 'dm' | 'player' | null;

type UIText = {
  appTitle: string;
  appSubtitle: string;
  stepCounter: string;
  back: string;
  next: string;
  review: string;
  exportJson: string;
  toggleProvenance: string;
  printableSheet: string;
  nameLabel: string;
  raceLabel: string;
  classLabel: string;
  metadataPlaceholder: string;
  abilitiesSuffix: string;
  roleAria: string;
  roleQuestion: string;
  roleIntro: string;
  roleEnterCta: string;
  dmTitle: string;
  dmSubtitle: string;
  playerTitle: string;
  playerSubtitle: string;
  dmUnsupported: string;
  languageLabel: string;
  english: string;
  chinese: string;
};

const uiText = uiTextJson as Record<Language, UIText>;

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [language, setLanguage] = useState<Language>('en');

  const wizardSteps = context.resolvedData.flow.steps;
  const currentStep = wizardSteps[stepIndex];

  const t = uiText[language];
  const choices = useMemo(() => listChoices(state, context), [state]);
  const choiceMap = new Map(choices.map((c) => [c.stepId, c]));
  const sheet = useMemo(() => finalizeCharacter(state, context), [state]);

  const setAbility = (key: string, value: number) => {
    setState((prev) => applyChoice(prev, 'abilities', { ...prev.abilities, [key]: value }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.metadata.name || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCurrentStep = () => {
    if (!currentStep) return null;

    if (currentStep.kind === 'review') {
      return (
        <section>
          <h2>{t.review}</h2>
          <p><strong>{sheet.metadata.name}</strong></p>
          <div className="grid two">
            {Object.entries(sheet.stats).map(([k, v]) => <div key={k}><strong>{k}</strong>: {String(v)}</div>)}
          </div>
          <button onClick={exportJson}>{t.exportJson}</button>
          <button onClick={() => setShowProv((s) => !s)}>{t.toggleProvenance}</button>
          {showProv && <pre>{JSON.stringify(sheet.provenance, null, 2)}</pre>}
          <h3>{t.printableSheet}</h3>
          <article className="sheet">
            <p>{t.nameLabel}: {sheet.metadata.name}</p>
            <p>{t.raceLabel}: {String(state.selections.race ?? '-')} / {t.classLabel}: {String(state.selections.class ?? '-')}</p>
            <p>AC: {String(sheet.stats.ac)} | HP: {String(sheet.stats.hp)} | BAB: {String(sheet.stats.bab)}</p>
          </article>
        </section>
      );
    }

    if (currentStep.kind === 'metadata') {
      return (
        <section>
          <h2>{currentStep.label}</h2>
          <input
            value={state.metadata.name ?? ''}
            onChange={(e) => setState((s) => applyChoice(s, currentStep.id, e.target.value))}
            placeholder={t.metadataPlaceholder}
          />
        </section>
      );
    }

    if (currentStep.kind === 'abilities') {
      return (
        <section>
          <h2>{currentStep.label} {t.abilitiesSuffix}</h2>
          <div className="grid">
            {Object.entries(state.abilities).map(([key, value]) => (
              <label key={key}>{key.toUpperCase()}
                <input type="number" min={3} max={18} value={value} onChange={(e) => setAbility(key, Number(e.target.value))} />
              </label>
            ))}
          </div>
        </section>
      );
    }

    if (currentStep.source.type === 'entityType') {
      const stepChoice = choiceMap.get(currentStep.id);
      const options = stepChoice?.options ?? [];
      const limit = currentStep.source.limit ?? 1;

      if (limit <= 1) {
        const currentValue = currentStep.id === 'feat'
          ? String(((state.selections.feats as string[] | undefined) ?? [])[0] ?? '')
          : String(state.selections[currentStep.id] ?? '');

        return (
          <Picker
            title={currentStep.label}
            options={options}
            value={currentValue}
            onSelect={(id) => {
              if (currentStep.id === 'feat') {
                setState((s) => applyChoice(s, currentStep.id, [id]));
                return;
              }
              setState((s) => applyChoice(s, currentStep.id, id));
            }}
          />
        );
      }

      const selected = (state.selections[currentStep.id] as string[] | undefined) ?? [];
      return (
        <fieldset>
          <legend>{currentStep.label}</legend>
          {options.map((o) => (
            <label key={o.id}>
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) => {
                  const next = e.target.checked ? [...selected, o.id] : selected.filter((item) => item !== o.id);
                  setState((s) => applyChoice(s, currentStep.id, next));
                }}
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      );
    }

    throw new Error(`Unknown flow step kind: ${currentStep.kind}`);
  };

  if (role !== 'player') {
    return (
      <RoleSelectionGate
        role={role}
        onChange={setRole}
        language={language}
        onLanguageChange={setLanguage}
        text={t}
      />
    );
  }

  return (
    <main className={`container ${language === 'zh' ? 'lang-zh' : ''}`}>
      <LanguageSwitch language={language} onLanguageChange={setLanguage} text={t} />
      <h1>{t.appTitle}</h1>
      <p className="subtitle">{t.appSubtitle}</p>
      <p>{t.stepCounter} {stepIndex + 1} / {wizardSteps.length}</p>
      {renderCurrentStep()}
      <footer className="actions">
        <button disabled={stepIndex === 0} onClick={() => setStepIndex((s) => s - 1)}>{t.back}</button>
        <button disabled={stepIndex === wizardSteps.length - 1} onClick={() => setStepIndex((s) => s + 1)}>{t.next}</button>
      </footer>
    </main>
  );
}

function RoleSelectionGate({
  role,
  onChange,
  language,
  onLanguageChange,
  text,
}: {
  role: Role;
  onChange: (value: Role) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
}) {
  const [phase, setPhase] = useState<'scroll' | 'tabs'>('scroll');

  return (
    <main className={`role-gate ${language === 'zh' ? 'lang-zh' : ''}`}>
      <section className="role-tabs-root">
        <LanguageSwitch language={language} onLanguageChange={onLanguageChange} text={text} />

        {phase === 'scroll' && (
          <section className="scroll-stage" aria-label={text.roleAria}>
            <div className="mist mist-left" aria-hidden="true" />
            <button className="scroll-card" type="button" onClick={() => setPhase('tabs')}>
              <h1 className="role-question">{text.roleQuestion}</h1>
              <p className="role-intro">{text.roleIntro}</p>
              <span className="scroll-cta">{text.roleEnterCta}</span>
            </button>
            <div className="mist mist-right" aria-hidden="true" />
          </section>
        )}

        {phase === 'tabs' && (
          <>
            <div className="role-tabs-grid" role="tablist" aria-label={text.roleAria}>
              <button
                type="button"
                role="tab"
                aria-selected={role === 'dm'}
                className={`role-tab role-tab-left ${role === 'dm' ? 'active' : ''}`}
                onClick={() => onChange('dm')}
              >
                <span className="role-tab-title">{text.dmTitle}</span>
                <span className="role-tab-subtitle">{text.dmSubtitle}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={role === 'player'}
                className={`role-tab role-tab-right ${role === 'player' ? 'active' : ''}`}
                onClick={() => onChange('player')}
              >
                <span className="role-tab-title">{text.playerTitle}</span>
                <span className="role-tab-subtitle">{text.playerSubtitle}</span>
              </button>
            </div>
            <h1 className="role-question tabs-overlay">{text.roleQuestion}</h1>
            {role === 'dm' && <p className="role-message" aria-live="polite">{text.dmUnsupported}</p>}
          </>
        )}
      </section>
    </main>
  );
}

function LanguageSwitch({
  language,
  onLanguageChange,
  text,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
}) {
  return (
    <div className="language-switch" aria-label={text.languageLabel}>
      <button type="button" className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => onLanguageChange('en')}>
        {text.english}
      </button>
      <button type="button" className={`lang-btn ${language === 'zh' ? 'active' : ''}`} onClick={() => onLanguageChange('zh')}>
        {text.chinese}
      </button>
    </div>
  );
}

function Picker({ title, options, value, onSelect }: { title: string; options: Array<{ id: string; label: string }>; value: string; onSelect: (id: string) => void; }) {
  return (
    <section>
      <h2>{title}</h2>
      {options.map((o) => (
        <label key={o.id}>
          <input type="radio" name={title} checked={value === o.id} onChange={() => onSelect(o.id)} />
          {o.label}
        </label>
      ))}
    </section>
  );
}
