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

export type UIText = {
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
  dmTitle: string;
  dmSubtitle: string;
  playerTitle: string;
  playerSubtitle: string;
  dmUnsupported: string;
  languageLabel: string;
  english: string;
  chinese: string;
};

const uiTextKeys: Array<keyof UIText> = [
  'appTitle',
  'appSubtitle',
  'stepCounter',
  'back',
  'next',
  'review',
  'exportJson',
  'toggleProvenance',
  'printableSheet',
  'nameLabel',
  'raceLabel',
  'classLabel',
  'metadataPlaceholder',
  'abilitiesSuffix',
  'roleAria',
  'roleQuestion',
  'roleIntro',
  'dmTitle',
  'dmSubtitle',
  'playerTitle',
  'playerSubtitle',
  'dmUnsupported',
  'languageLabel',
  'english',
  'chinese',
];

function isUIText(value: unknown): value is UIText {
  if (!value || typeof value !== 'object') return false;
  return uiTextKeys.every((key) => typeof (value as Record<string, unknown>)[key] === 'string');
}

function parseUIText(input: unknown): Record<Language, UIText> {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid uiText.json format: expected object with en/zh keys.');
  }
  const record = input as Record<string, unknown>;
  if (!isUIText(record.en) || !isUIText(record.zh)) {
    throw new Error('Invalid uiText.json format: expected complete UIText payload for en and zh.');
  }
  return { en: record.en, zh: record.zh };
}

const uiText = parseUIText(uiTextJson);

function detectDefaultLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [language, setLanguage] = useState<Language>(detectDefaultLanguage);

  const wizardSteps = context.resolvedData.flow.steps;
  const currentStep = wizardSteps[stepIndex];

  const t = uiText[language];
  const choices = useMemo(() => listChoices(state, context), [state]);
  const choiceMap = new Map(choices.map((c) => [c.stepId, c]));
  const sheet = useMemo(() => finalizeCharacter(state, context), [state]);
  const skillEntities = useMemo(
    () => Object.values(context.resolvedData.entities.skills ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const selectedFeats = ((state.selections.feats as string[] | undefined) ?? []);

  const selectedStepValues = (stepId: string): string[] => {
    if (stepId === 'feat') return selectedFeats;
    const value = state.selections[stepId];
    if (Array.isArray(value)) return value.map(String);
    if (value === undefined || value === null || value === '') return [];
    return [String(value)];
  };

  const setAbility = (key: string, value: number) => {
    setState((prev) => applyChoice(prev, 'abilities', { ...prev.abilities, [key]: value }, context));
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
            <p>Favored class: {sheet.decisions.favoredClass ?? '-'} | XP penalty ignored: {sheet.decisions.ignoresMulticlassXpPenalty ? 'yes' : 'no'}</p>
            <p>Skill points: {sheet.decisions.skillPoints.spent} / {sheet.decisions.skillPoints.total}</p>
            <ul>
              {Object.entries(sheet.skills)
                .filter(([, skill]) => skill.ranks > 0 || skill.racialBonus !== 0)
                .map(([skillId, skill]) => (
                  <li key={skillId}>
                    {skill.name}: total {skill.total} (ranks {skill.ranks}, ability {skill.abilityMod >= 0 ? '+' : ''}{skill.abilityMod}, racial {skill.racialBonus >= 0 ? '+' : ''}{skill.racialBonus})
                  </li>
                ))}
            </ul>
          </article>
        </section>
      );
    }

    if (currentStep.kind === 'metadata') {
      return (
        <section>
          <h2>{currentStep.label}</h2>
          <label htmlFor="character-name-input">{t.nameLabel}</label>
          <input
            id="character-name-input"
            value={state.metadata.name ?? ''}
            onChange={(e) => setState((s) => applyChoice(s, currentStep.id, e.target.value, context))}
            placeholder={t.metadataPlaceholder}
            aria-label={t.nameLabel}
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

    if (currentStep.kind === 'skills') {
      const selectedRanks = (state.selections.skills as Record<string, number> | undefined) ?? {};

      return (
        <section>
          <h2>{currentStep.label}</h2>
          <p>
            Budget: {sheet.decisions.skillPoints.total} | Spent: {sheet.decisions.skillPoints.spent} | Remaining: {sheet.decisions.skillPoints.remaining}
          </p>
          <div className="grid">
            {skillEntities.map((skill) => {
              const detail = sheet.skills[skill.id];
              const ranks = selectedRanks[skill.id] ?? 0;
              const maxRanks = detail?.maxRanks ?? 2;
              const classSkill = detail?.classSkill ?? false;
              const costPerRank = detail?.costPerRank ?? 2;
              const racialBonus = detail?.racialBonus ?? 0;
              const inputStep = classSkill ? 1 : 0.5;

              return (
                <label key={skill.id}>
                  {skill.name} ({classSkill ? 'Class' : 'Cross'} | cost {costPerRank}/rank | max {maxRanks} | racial {racialBonus >= 0 ? '+' : ''}{racialBonus})
                  <input
                    type="number"
                    min={0}
                    max={maxRanks}
                    step={inputStep}
                    value={ranks}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const normalized = Number.isFinite(parsed)
                        ? (classSkill ? Math.round(parsed) : Math.round(parsed * 2) / 2)
                        : 0;
                      const clamped = Math.min(maxRanks, Math.max(0, normalized));
                      setState((s) => applyChoice(s, 'skills', { ...selectedRanks, [skill.id]: clamped }, context));
                    }}
                  />
                </label>
              );
            })}
          </div>
        </section>
      );
    }

    if (currentStep.source.type === 'entityType') {
      const stepChoice = choiceMap.get(currentStep.id);
      const options = stepChoice?.options ?? [];
      const limit = stepChoice?.limit ?? currentStep.source.limit ?? 1;

      if (limit <= 1) {
        const currentValue = currentStep.id === 'feat'
          ? String(selectedFeats[0] ?? '')
          : String(state.selections[currentStep.id] ?? '');

        return (
          <Picker
            title={currentStep.label}
            options={options}
            value={currentValue}
            onSelect={(id) => {
              if (currentStep.id === 'feat') {
                setState((s) => applyChoice(s, currentStep.id, [id], context));
                return;
              }
              setState((s) => applyChoice(s, currentStep.id, id, context));
            }}
          />
        );
      }

      const selected = selectedStepValues(currentStep.id);
      return (
        <section>
          <h2>{currentStep.label}</h2>
          <fieldset>
            <legend>{currentStep.label}</legend>
            {options.map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  disabled={!selected.includes(o.id) && selected.length >= limit}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, o.id] : selected.filter((item) => item !== o.id);
                  setState((s) => applyChoice(s, currentStep.id, next, context));
                }}
              />
                {o.label}
              </label>
            ))}
          </fieldset>
        </section>
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
    <main className={`container ${language === 'zh' ? 'lang-zh' : ''}`} lang={language}>
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
  return (
    <main className={`role-gate ${language === 'zh' ? 'lang-zh' : ''}`} lang={language}>
      <section className="role-tabs-root">
        <LanguageSwitch language={language} onLanguageChange={onLanguageChange} text={text} />
        <div className="role-tabs-grid" role="group" aria-label={text.roleAria}>
          <button
            type="button"
            aria-pressed={role === 'dm'}
            className={`role-tab role-tab-left ${role === 'dm' ? 'active' : ''}`}
            onClick={() => onChange('dm')}
          >
            <span className="role-tab-title">{text.dmTitle}</span>
            <span className="role-tab-subtitle">{text.dmSubtitle}</span>
          </button>
          <button
            type="button"
            aria-pressed={role === 'player'}
            className={`role-tab role-tab-right ${role === 'player' ? 'active' : ''}`}
            onClick={() => onChange('player')}
          >
            <span className="role-tab-title">{text.playerTitle}</span>
            <span className="role-tab-subtitle">{text.playerSubtitle}</span>
          </button>
        </div>
        <h1 className="role-question tabs-overlay">{text.roleQuestion}</h1>
        <p className="role-intro tabs-intro">{text.roleIntro}</p>
        {role === 'dm' && <p className="role-message" aria-live="polite">{text.dmUnsupported}</p>}
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
    <div className="language-switch" role="radiogroup" aria-label={text.languageLabel}>
      <label className={`lang-btn ${language === 'en' ? 'active' : ''}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="en"
          checked={language === 'en'}
          onChange={() => onLanguageChange('en')}
        />
        <span>{text.english}</span>
      </label>
      <label className={`lang-btn ${language === 'zh' ? 'active' : ''}`}>
        <input
          className="lang-radio"
          type="radio"
          name="language-switch"
          value="zh"
          checked={language === 'zh'}
          onChange={() => onLanguageChange('zh')}
        />
        <span>{text.chinese}</span>
      </label>
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
