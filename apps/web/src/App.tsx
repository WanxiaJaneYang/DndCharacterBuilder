import { useEffect, useMemo, useState } from 'react';
import { resolveLoadedPacks } from '@dcb/datapack';
import { loadMinimalPack } from './loadMinimalPack';
import { applyChoice, finalizeCharacter, initialState, listChoices, type CharacterState } from '@dcb/engine';
import uiTextJson from './uiText.json';

const embeddedPacks = [loadMinimalPack()];

type EditionOption = {
  id: string;
  label: string;
  basePackId: string;
  optionalPackIds: string[];
};

const editions: EditionOption[] = [
  {
    id: 'dnd-3.5-srd',
    label: 'D&D 3.5 SRD',
    basePackId: 'srd-35e-minimal',
    optionalPackIds: [],
  },
];
const fallbackEdition: EditionOption = {
  id: '',
  label: '',
  basePackId: '',
  optionalPackIds: [],
};

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
  rulesSetupTitle: string;
  editionLabel: string;
  sourcesLabel: string;
  baseSourceLockedLabel: string;
  startWizard: string;
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
  'rulesSetupTitle',
  'editionLabel',
  'sourcesLabel',
  'baseSourceLockedLabel',
  'startWizard',
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
  const [selectedEditionId, setSelectedEditionId] = useState<string>(editions[0]?.id ?? '');
  const [selectedOptionalPackIds, setSelectedOptionalPackIds] = useState<string[]>([]);
  const [rulesReady, setRulesReady] = useState(false);

  const selectedEdition = useMemo(
    () => editions.find((edition) => edition.id === selectedEditionId) ?? editions[0] ?? fallbackEdition,
    [selectedEditionId]
  );
  const enabledPackIds = useMemo(
    () => [selectedEdition.basePackId, ...selectedOptionalPackIds.filter((packId) => selectedEdition.optionalPackIds.includes(packId))],
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
  const choices = useMemo(() => listChoices(state, context), [state]);
  const choiceMap = new Map(choices.map((c) => [c.stepId, c]));
  const sheet = useMemo(() => finalizeCharacter(state, context), [state]);
  const skillEntities = useMemo(
    () => Object.values(context.resolvedData.entities.skills ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [context.resolvedData.entities.skills]
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
      const abilityOrder = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
      const statOrder = ['hp', 'ac', 'initiative', 'speed', 'bab', 'fort', 'ref', 'will', 'attackBonus', 'damageBonus'] as const;
      const statLabels: Record<(typeof statOrder)[number], string> = {
        hp: 'HP',
        ac: 'Armor Class',
        initiative: 'Initiative',
        speed: 'Speed',
        bab: 'Base Attack Bonus',
        fort: 'Fort Save',
        ref: 'Ref Save',
        will: 'Will Save',
        attackBonus: 'Melee Attack Bonus',
        damageBonus: 'Melee Damage Bonus',
      };
      const statBaseDefaults: Record<(typeof statOrder)[number], number> = {
        hp: 0,
        ac: 10,
        initiative: 0,
        speed: 30,
        bab: 0,
        fort: 0,
        ref: 0,
        will: 0,
        attackBonus: 0,
        damageBonus: 0,
      };
      const sourceNameByEntityId = new Map<string, string>();
      for (const bucket of Object.values(context.resolvedData.entities)) {
        for (const entity of Object.values(bucket)) {
          sourceNameByEntityId.set(entity.id, entity.name);
        }
      }
      const byTargetPath = new Map<string, typeof sheet.provenance>();
      for (const record of sheet.provenance) {
        const existing = byTargetPath.get(record.targetPath);
        if (existing) {
          existing.push(record);
        } else {
          byTargetPath.set(record.targetPath, [record]);
        }
      }
      const formatSigned = (value: number) => `${value >= 0 ? '+' : ''}${value}`;
      const formatSourceLabel = (entityId: string) => sourceNameByEntityId.get(entityId) ?? entityId;
      const selectedRaceId = String(state.selections.race ?? '');
      const selectedClassId = String(state.selections.class ?? '');
      const selectedRaceName = context.resolvedData.entities.races?.[selectedRaceId]?.name ?? (selectedRaceId || '-');
      const selectedClassName = context.resolvedData.entities.classes?.[selectedClassId]?.name ?? (selectedClassId || '-');
      const reviewSkills = Object.entries(sheet.skills)
        .filter(([, skill]) => skill.ranks > 0 || skill.racialBonus !== 0)
        .sort((a, b) => b[1].total - a[1].total || a[1].name.localeCompare(b[1].name));

      return (
        <section className="review-page">
          <h2>{t.review}</h2>
          <header className="review-hero">
            <div>
              <p className="review-character-name">{sheet.metadata.name || 'Unnamed Character'}</p>
              <p className="review-character-meta">
                {t.raceLabel}: <strong>{selectedRaceName}</strong> | {t.classLabel}: <strong>{selectedClassName}</strong>
              </p>
            </div>
            <div className="review-actions">
              <button onClick={exportJson}>{t.exportJson}</button>
              <button onClick={() => setShowProv((s) => !s)}>{t.toggleProvenance}</button>
            </div>
          </header>

          <div className="review-stat-cards">
            <article className="review-card">
              <h3>AC</h3>
              <p>{String(sheet.stats.ac)}</p>
            </article>
            <article className="review-card">
              <h3>HP</h3>
              <p>{String(sheet.stats.hp)}</p>
            </article>
            <article className="review-card">
              <h3>BAB</h3>
              <p>{String(sheet.stats.bab)}</p>
            </article>
            <article className="review-card">
              <h3>Initiative</h3>
              <p>{String(sheet.stats.initiative)}</p>
            </article>
          </div>

          <article className="sheet">
            <h3>Ability Score Breakdown</h3>
            <table className="review-table">
              <thead>
                <tr>
                  <th>Ability</th>
                  <th>Base</th>
                  <th>Adjustments</th>
                  <th>Final</th>
                  <th>Modifier</th>
                </tr>
              </thead>
              <tbody>
                {abilityOrder.map((ability) => {
                  const baseScore = Number(state.abilities[ability] ?? 10);
                  const targetPath = `abilities.${ability}.score`;
                  const records = byTargetPath.get(targetPath) ?? [];
                  const finalScore = sheet.abilities[ability]?.score ?? baseScore;
                  const finalMod = sheet.abilities[ability]?.mod ?? 0;

                  return (
                    <tr key={ability}>
                      <td className="review-cell-key">{ability.toUpperCase()}</td>
                      <td>{baseScore}</td>
                      <td>
                        {records.length === 0 ? (
                          <span className="review-muted">-</span>
                        ) : (
                          <ul className="calc-list">
                            {records.map((record, index) => (
                              <li key={`${targetPath}-${index}`}>
                                <code>{record.delta !== undefined ? formatSigned(record.delta) : `= ${record.setValue ?? 0}`}</code>
                                {' '}
                                {formatSourceLabel(record.source.entityId)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>{finalScore}</td>
                      <td>{formatSigned(finalMod)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>Combat and Defense Breakdown</h3>
            <table className="review-table">
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>Base</th>
                  <th>Adjustments</th>
                  <th>Final</th>
                </tr>
              </thead>
              <tbody>
                {statOrder.map((statKey) => {
                  const targetPath = `stats.${statKey}`;
                  const records = byTargetPath.get(targetPath) ?? [];
                  const derivedRows: Array<{ label: string; value: number }> = [];
                  if (statKey === 'initiative') {
                    derivedRows.push({ label: 'DEX modifier', value: sheet.abilities.dex?.mod ?? 0 });
                  }
                  if (statKey === 'attackBonus') {
                    derivedRows.push({ label: 'BAB', value: Number(sheet.stats.bab ?? 0) });
                    derivedRows.push({ label: 'STR modifier', value: sheet.abilities.str?.mod ?? 0 });
                  }
                  if (statKey === 'damageBonus') {
                    derivedRows.push({ label: 'STR modifier', value: sheet.abilities.str?.mod ?? 0 });
                  }

                  return (
                    <tr key={statKey}>
                      <td className="review-cell-key">{statLabels[statKey]}</td>
                      <td>{statBaseDefaults[statKey]}</td>
                      <td>
                        {records.length === 0 && derivedRows.length === 0 ? (
                          <span className="review-muted">-</span>
                        ) : (
                          <ul className="calc-list">
                            {records.map((record, index) => (
                              <li key={`${targetPath}-${index}`}>
                                <code>{record.delta !== undefined ? formatSigned(record.delta) : `= ${record.setValue ?? 0}`}</code>
                                {' '}
                                {formatSourceLabel(record.source.entityId)}
                              </li>
                            ))}
                            {derivedRows.map((row) => (
                              <li key={`${targetPath}-${row.label}`}>
                                <code>{formatSigned(row.value)}</code> {row.label}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>{String(sheet.stats[statKey])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <article className="sheet">
            <h3>Skills and Point Spending</h3>
            <p>
              Points spent {sheet.decisions.skillPoints.spent} / {sheet.decisions.skillPoints.total}
              {' '}({sheet.decisions.skillPoints.remaining} remaining)
            </p>
            <table className="review-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Ranks</th>
                  <th>Ability</th>
                  <th>Racial</th>
                  <th>Total</th>
                  <th>Point Cost</th>
                </tr>
              </thead>
              <tbody>
                {reviewSkills.map(([skillId, skill]) => (
                  <tr key={skillId}>
                    <td className="review-cell-key">{skill.name}</td>
                    <td>{skill.ranks}</td>
                    <td>{formatSigned(skill.abilityMod)} ({skill.ability.toUpperCase()})</td>
                    <td>{formatSigned(skill.racialBonus)}</td>
                    <td>{skill.total}</td>
                    <td>{skill.costSpent} ({skill.costPerRank}/rank)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="sheet review-decisions">
            <h3>Rules Decisions</h3>
            <p>Favored class: {sheet.decisions.favoredClass ?? '-'}</p>
            <p>Multiclass XP penalty ignored: {sheet.decisions.ignoresMulticlassXpPenalty ? 'yes' : 'no'}</p>
            <p>Feat slots available: {sheet.decisions.featSelectionLimit}</p>
          </article>

          {showProv && (
            <article className="sheet">
              <h3>Raw Provenance</h3>
              <pre>{JSON.stringify(sheet.provenance, null, 2)}</pre>
            </article>
          )}
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
                      const value = Number.isFinite(parsed) ? Math.min(maxRanks, Math.max(0, parsed)) : 0;
                      const nextRanks = { ...selectedRanks, [skill.id]: value };
                      setState((s) => applyChoice(s, 'skills', nextRanks, context));
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

  if (!rulesReady) {
    return (
      <RulesSetupGate
        language={language}
        onLanguageChange={setLanguage}
        text={t}
        editions={editions}
        selectedEditionId={selectedEditionId}
        onEditionChange={(editionId) => {
          setSelectedEditionId(editionId);
          setSelectedOptionalPackIds([]);
          setStepIndex(0);
        }}
        selectedOptionalPackIds={selectedOptionalPackIds}
        onOptionalPackToggle={(packId) => {
          setSelectedOptionalPackIds((current) => (current.includes(packId) ? current.filter((id) => id !== packId) : [...current, packId]));
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
  const selectedEdition = editions.find((edition) => edition.id === selectedEditionId) ?? editions[0] ?? fallbackEdition;

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
        <label>
          <input
            type="checkbox"
            checked
            disabled
            aria-label={`${selectedEdition.basePackId} (${text.baseSourceLockedLabel})`}
          />
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
