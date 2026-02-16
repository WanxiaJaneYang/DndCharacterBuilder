import { useMemo, useState } from 'react';
import { resolveLoadedPacks } from '@dcb/datapack';
import { minimalPack } from './packData';
import { applyChoice, finalizeCharacter, initialState, listChoices, type CharacterState } from '@dcb/engine';

const resolvedData = resolveLoadedPacks([minimalPack], ['srd-35e-minimal']);
const context = { enabledPackIds: ['srd-35e-minimal'], resolvedData };

const steps = ['name', 'abilities', 'race', 'class', 'feat', 'equipment', 'review'] as const;

type Step = (typeof steps)[number];

export function App() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);

  const currentStep: Step = steps[stepIndex];
  const choices = useMemo(() => listChoices(state, context), [state]);
  const sheet = useMemo(() => finalizeCharacter(state, context), [state]);

  const choiceMap = new Map(choices.map((c) => [c.stepId, c]));
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

  return (
    <main className="container">
      <h1>D&D 3.5 Beginner Character Builder (MVP)</h1>
      <p className="subtitle">Data-driven SRD-only wizard with deterministic rules + provenance.</p>
      <p>Step {stepIndex + 1} / {steps.length}</p>

      {currentStep === 'name' && (
        <section>
          <h2>Name</h2>
          <input
            value={state.metadata.name ?? ''}
            onChange={(e) => setState((s) => applyChoice(s, 'name', e.target.value))}
            placeholder="Enter character name"
          />
        </section>
      )}

      {currentStep === 'abilities' && (
        <section>
          <h2>Ability Scores (Manual, 3-18)</h2>
          <div className="grid">
            {Object.entries(state.abilities).map(([key, value]) => (
              <label key={key}>{key.toUpperCase()}
                <input type="number" min={3} max={18} value={value} onChange={(e) => setAbility(key, Number(e.target.value))} />
              </label>
            ))}
          </div>
        </section>
      )}

      {currentStep === 'race' && (
        <Picker title="Choose Race" options={choiceMap.get('race')?.options ?? []} value={String(state.selections.race ?? '')} onSelect={(id) => setState((s) => applyChoice(s, 'race', id))} />
      )}

      {currentStep === 'class' && (
        <Picker title="Choose Class" options={choiceMap.get('class')?.options ?? []} value={String(state.selections.class ?? '')} onSelect={(id) => setState((s) => applyChoice(s, 'class', id))} />
      )}

      {currentStep === 'feat' && (
        <Picker title="Choose Feat" options={choiceMap.get('feat')?.options ?? []} value={String(((state.selections.feats as string[] | undefined) ?? [])[0] ?? '')} onSelect={(id) => setState((s) => applyChoice(s, 'feat', [id]))} />
      )}

      {currentStep === 'equipment' && (
        <fieldset>
          <legend>Choose Equipment</legend>
          {(choiceMap.get('equipment')?.options ?? []).map((o) => {
            const selected = ((state.selections.equipment as string[] | undefined) ?? []).includes(o.id);
            return (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const prev = ((state.selections.equipment as string[] | undefined) ?? []);
                    const next = e.target.checked ? [...prev, o.id] : prev.filter((p) => p !== o.id);
                    setState((s) => applyChoice(s, 'equipment', next));
                  }}
                />
                {o.label}
              </label>
            );
          })}
        </fieldset>
      )}

      {currentStep === 'review' && (
        <section>
          <h2>Review</h2>
          <p><strong>{sheet.metadata.name}</strong></p>
          <div className="grid two">
            {Object.entries(sheet.stats).map(([k, v]) => <div key={k}><strong>{k}</strong>: {String(v)}</div>)}
          </div>
          <button onClick={exportJson}>Export JSON</button>
          <button onClick={() => setShowProv((s) => !s)}>Toggle provenance</button>
          {showProv && (
            <pre>{JSON.stringify(sheet.provenance, null, 2)}</pre>
          )}
          <h3>Printable HTML Character Sheet</h3>
          <article className="sheet">
            <p>Name: {sheet.metadata.name}</p>
            <p>Race: {String(state.selections.race ?? '-')} / Class: {String(state.selections.class ?? '-')}</p>
            <p>AC: {String(sheet.stats.ac)} | HP: {String(sheet.stats.hp)} | BAB: {String(sheet.stats.bab)}</p>
          </article>
        </section>
      )}

      <footer className="actions">
        <button disabled={stepIndex === 0} onClick={() => setStepIndex((s) => s - 1)}>Back</button>
        <button disabled={stepIndex === steps.length - 1} onClick={() => setStepIndex((s) => s + 1)}>Next</button>
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
