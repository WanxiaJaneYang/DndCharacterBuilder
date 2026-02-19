import { useEffect, useMemo, useState } from 'react';
import { resolveLoadedPacks } from '@dcb/datapack';
import { loadMinimalPack } from './loadMinimalPack';
import { applyChoice, finalizeCharacter, initialState, listChoices, type CharacterState } from '@dcb/engine';
import { EDITIONS, FALLBACK_EDITION, type EditionOption, defaultEditionId } from './editions';
import { detectDefaultLanguage, uiText, type Language, type UIText } from './uiText';

const embeddedPacks = [loadMinimalPack()];
type Role = 'dm' | 'player' | null;

const STEP_ID_FEAT = 'feat';
const STEP_ID_SKILLS = 'skills';
const STEP_ID_ABILITIES = 'abilities';
const DEFAULT_EXPORT_NAME = 'character';
const ABILITY_SCORE_MIN = 3;
const ABILITY_SCORE_MAX = 18;

function clampAbilityScore(value: number): number {
  if (!Number.isFinite(value)) return ABILITY_SCORE_MIN;
  return Math.min(ABILITY_SCORE_MAX, Math.max(ABILITY_SCORE_MIN, value));
}

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [language, setLanguage] = useState<Language>(detectDefaultLanguage);
  const [selectedEditionId, setSelectedEditionId] = useState<string>(() => defaultEditionId(EDITIONS));
  const [selectedOptionalPackIds, setSelectedOptionalPackIds] = useState<string[]>([]);
  const [rulesReady, setRulesReady] = useState(false);

  const selectedEdition = useMemo(
    () => EDITIONS.find((edition) => edition.id === selectedEditionId) ?? EDITIONS[0] ?? FALLBACK_EDITION,
    [selectedEditionId]
  );
  const enabledPackIds = useMemo(
    () =>
      [selectedEdition.basePackId, ...selectedOptionalPackIds.filter((packId) => selectedEdition.optionalPackIds.includes(packId))]
        .filter((packId) => packId.trim().length > 0),
    [selectedEdition, selectedOptionalPackIds]
  );
  const resolvedData = useMemo(() => resolveLoadedPacks(embeddedPacks, enabledPackIds), [enabledPackIds]);
  const context = useMemo(() => ({ enabledPackIds, resolvedData }), [enabledPackIds, resolvedData]);

  const wizardSteps = context.resolvedData.flow.steps;
  const currentStep = wizardSteps[stepIndex];

  useEffect(() => {
    if (stepIndex >= wizardSteps.length) {
      setStepIndex(0);
    }
  }, [stepIndex, wizardSteps.length]);

  const t = uiText[language];
  const choices = useMemo(() => listChoices(state, context), [context, state]);
  const choiceMap = new Map(choices.map((c) => [c.stepId, c]));
  const sheet = useMemo(() => finalizeCharacter(state, context), [context, state]);
  const skillEntities = useMemo(
    () => Object.values(context.resolvedData.entities.skills ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [context.resolvedData.entities.skills]
  );
  const selectedFeats = ((state.selections.feats as string[] | undefined) ?? []);

  const selectedStepValues = (stepId: string): string[] => {
    if (stepId === STEP_ID_FEAT) return selectedFeats;
    const value = state.selections[stepId];
    if (Array.isArray(value)) return value.map(String);
    if (value === undefined || value === null || value === '') return [];
    return [String(value)];
  };

  const setAbility = (key: string, value: number) => {
    if (!Number.isFinite(value)) return;
    setState((prev) => applyChoice(prev, STEP_ID_ABILITIES, { ...prev.abilities, [key]: value }, context));
  };

  const clampAbilityOnBlur = (key: string) => {
    setState((prev) => {
      const current = Number(prev.abilities[key]);
      const clamped = clampAbilityScore(current);
      if (current === clamped) return prev;
      return applyChoice(prev, STEP_ID_ABILITIES, { ...prev.abilities, [key]: clamped }, context);
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.metadata.name || DEFAULT_EXPORT_NAME}.json`;
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
              <input
                type="number"
                min={ABILITY_SCORE_MIN}
                max={ABILITY_SCORE_MAX}
                value={value}
                onChange={(e) => setAbility(key, Number(e.target.value))}
                onBlur={() => clampAbilityOnBlur(key)}
              />
              </label>
            ))}
          </div>
        </section>
      );
    }

    if (currentStep.kind === 'skills') {
      const selectedRanks = (state.selections[STEP_ID_SKILLS] as Record<string, number> | undefined) ?? {};

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
                      const value = Number.isFinite(parsed) ? Math.min(maxRanks, Math.max(0, parsed)) : 0;
                      const nextRanks = { ...selectedRanks, [skill.id]: value };
                      setState((s) => applyChoice(s, STEP_ID_SKILLS, nextRanks, context));
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
        const currentValue = currentStep.id === STEP_ID_FEAT
          ? String(selectedFeats[0] ?? '')
          : String(state.selections[currentStep.id] ?? '');

        return (
          <Picker
            title={currentStep.label}
            options={options}
            value={currentValue}
            onSelect={(id) => {
              if (currentStep.id === STEP_ID_FEAT) {
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

  if (!rulesReady) {
    return (
      <RulesSetupGate
        language={language}
        onLanguageChange={setLanguage}
        text={t}
        editions={EDITIONS}
        selectedEditionId={selectedEditionId}
        onEditionChange={(editionId) => {
          setSelectedEditionId(editionId);
          setSelectedOptionalPackIds([]);
          setState(initialState);
          setStepIndex(0);
        }}
        selectedOptionalPackIds={selectedOptionalPackIds}
        onOptionalPackToggle={(packId) => {
          setSelectedOptionalPackIds((current) => (current.includes(packId) ? current.filter((id) => id !== packId) : [...current, packId]));
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
    <main className={`container ${language === 'zh' ? 'lang-zh' : ''}`} lang={language}>
      <LanguageSwitch language={language} onLanguageChange={setLanguage} text={t} />
      <h1>{t.appTitle}</h1>
      <p className="subtitle">{t.appSubtitle}</p>
      <p>{t.stepCounter} {stepIndex + 1} / {wizardSteps.length}</p>
      {renderCurrentStep()}
      <footer className="actions">
        <button
          onClick={() => {
            if (stepIndex === 0) {
              setRulesReady(false);
              return;
            }
            setStepIndex((s) => s - 1);
          }}
        >
          {t.back}
        </button>
        <button disabled={stepIndex === wizardSteps.length - 1} onClick={() => setStepIndex((s) => s + 1)}>{t.next}</button>
      </footer>
    </main>
  );
}

function RulesSetupGate({
  language,
  onLanguageChange,
  text,
  editions,
  selectedEditionId,
  onEditionChange,
  selectedOptionalPackIds,
  onOptionalPackToggle,
  onBack,
  onStart,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  text: UIText;
  editions: EditionOption[];
  selectedEditionId: string;
  onEditionChange: (editionId: string) => void;
  selectedOptionalPackIds: string[];
  onOptionalPackToggle: (packId: string) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const selectedEdition = editions.find((edition) => edition.id === selectedEditionId) ?? editions[0] ?? FALLBACK_EDITION;

  return (
    <main className={`container ${language === 'zh' ? 'lang-zh' : ''}`} lang={language}>
      <LanguageSwitch language={language} onLanguageChange={onLanguageChange} text={text} />
      <h1>{text.rulesSetupTitle}</h1>
      <section>
        <label htmlFor="edition-select">{text.editionLabel}</label>
        <select id="edition-select" value={selectedEditionId} onChange={(event) => onEditionChange(event.target.value)}>
          {editions.map((edition) => (
            <option key={edition.id} value={edition.id}>
              {edition.label}
            </option>
          ))}
        </select>
      </section>
      <section>
        <h2>{text.sourcesLabel}</h2>
        <input
          id="base-pack-checkbox"
          type="checkbox"
          checked
          disabled
          aria-label={`${selectedEdition.basePackId} (${text.baseSourceLockedLabel})`}
        />
        <label htmlFor="base-pack-checkbox">
          {selectedEdition.basePackId} ({text.baseSourceLockedLabel})
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
        <button onClick={onBack}>{text.back}</button>
        <button onClick={onStart}>{text.startWizard}</button>
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
