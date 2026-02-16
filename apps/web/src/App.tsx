import { useMemo, useState } from 'react';
import { resolveLoadedPacks } from '@dcb/datapack';
import { loadMinimalPack } from './loadMinimalPack';
import { applyChoice, finalizeCharacter, initialState, listChoices, type CharacterState } from '@dcb/engine';

const minimalPack = loadMinimalPack();
const resolvedData = resolveLoadedPacks([minimalPack], ['srd-35e-minimal']);
const context = { enabledPackIds: ['srd-35e-minimal'], resolvedData };

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);

  const flowSteps = context.resolvedData.flow.steps;
  const reviewStep = { id: 'review', kind: 'review', label: 'Review', source: { type: 'manual' as const } };
  const wizardSteps = [...flowSteps, reviewStep];
  const currentStep = wizardSteps[stepIndex];

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
    
    if (currentStep.id === 'review') {
      return (
        <section>
          <h2>Review</h2>
          <p><strong>{sheet.metadata.name}</strong></p>
          <div className="grid two">
            {Object.entries(sheet.stats).map(([k, v]) => <div key={k}><strong>{k}</strong>: {String(v)}</div>)}
          </div>
          <button onClick={exportJson}>Export JSON</button>
          <button onClick={() => setShowProv((s) => !s)}>Toggle provenance</button>
          {showProv && <pre>{JSON.stringify(sheet.provenance, null, 2)}</pre>}
          <h3>Printable HTML Character Sheet</h3>
          <article className="sheet">
            <p>Name: {sheet.metadata.name}</p>
            <p>Race: {String(state.selections.race ?? '-')} / Class: {String(state.selections.class ?? '-')}</p>
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
            placeholder="Enter character name"
          />
        </section>
      );
    }

    if (currentStep.kind === 'abilities') {
      return (
        <section>
          <h2>{currentStep.label} (Manual, 3-18)</h2>
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

    return null;
  };

  return (
    <main className="container">
      <h1>D&D 3.5 Beginner Character Builder (MVP)</h1>
      <p className="subtitle">Data-driven SRD-only wizard with deterministic rules + provenance.</p>
      <p>Step {stepIndex + 1} / {wizardSteps.length}</p>
      {renderCurrentStep()}
      <footer className="actions">
        <button disabled={stepIndex === 0} onClick={() => setStepIndex((s) => s - 1)}>Back</button>
        <button disabled={stepIndex === wizardSteps.length - 1} onClick={() => setStepIndex((s) => s + 1)}>Next</button>
      </footer>
    </main>
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
