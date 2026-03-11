import type { RefObject } from "react";
import { AbilityMethodSelector } from "../components/AbilityMethodSelector";
import { PointBuyPanel } from "../components/PointBuyPanel";
import type { UIText } from "../uiText";
import { AbilityModifiersTable } from "./AbilityModifiersTable";
import { RollSetChooser } from "./RollSetChooser";
import { ABILITY_ORDER } from "./constants";
import type { AbilityStepState } from "./useAbilityStepState";

type AbilityStepContentProps = {
  label: string;
  text: UIText;
  abilityState: AbilityStepState;
  state: { abilities: Record<string, number> };
  localizeAbilityLabel: (ability: string) => string;
  provenanceByTargetPath: Map<
    string,
    Array<{ delta?: number; source: { packId: string; entityId: string } }>
  >;
  sourceMetaByEntityKey: Map<string, { sourceType: string; sourceLabel: string }>;
  reviewData: { abilities: Record<string, { score: number; mod: number }> };
};

export function AbilityStepContent({
  label,
  text,
  abilityState,
  state,
  localizeAbilityLabel,
  provenanceByTargetPath,
  sourceMetaByEntityKey,
  reviewData,
}: AbilityStepContentProps) {
  const {
    abilityPresentation,
    abilityModes,
    selectedAbilityMode,
    selectedAbilityModeValue,
    activeModeHint,
    hasActiveModeHint,
    isHintVisible,
    isAbilityMode,
    handleAbilityModeChange,
    pointCapMin,
    pointCapMax,
    pointCapStep,
    selectedPointCap,
    pointBuyRemaining,
    isPointBuyTableOpen,
    pointBuyCostTable,
    setIsPointBuyTableOpen,
    applyAbilitySelection,
    rollSetsConfig,
    generatedRollSets,
    selectedRollSetIndex,
    applySelectedRollSet,
    regenerateRollSetOptions,
    rollSetNeedsSelection,
    abilityMinScore,
    abilityMaxScore,
    stepAbility,
    setAbility,
    clampAbilityOnBlur,
    abilityMethodHintRef,
    abilityMethodHintPinned,
    setAbilityMethodHintOpen,
    setAbilityMethodHintPinned,
    getModeLabel,
    sourceTypeLabels,
    hideZeroGroups,
    hasPointBuyConfig,
  } = abilityState;
  const helpRef = abilityMethodHintRef as unknown as RefObject<HTMLDivElement>;

  return (
    <section>
      <h2>{label}</h2>
      <AbilityMethodSelector
        label={text.ABILITY_GENERATION_LABEL}
        helpLabel={text.ABILITY_METHOD_HELP_LABEL}
        helpText={activeModeHint}
        isHintVisible={isHintVisible}
        isHintAvailable={hasActiveModeHint}
        value={selectedAbilityModeValue}
        options={abilityModes.map((mode) => ({ value: mode, label: getModeLabel(mode) }))}
        onMouseEnter={() => hasActiveModeHint && setAbilityMethodHintOpen(true)}
        onMouseLeave={() => !abilityMethodHintPinned && setAbilityMethodHintOpen(false)}
        onFocus={() => hasActiveModeHint && setAbilityMethodHintOpen(true)}
        onBlur={() => !abilityMethodHintPinned && setAbilityMethodHintOpen(false)}
        onClick={() => {
          if (!hasActiveModeHint) return;
          setAbilityMethodHintPinned(!abilityMethodHintPinned);
          setAbilityMethodHintOpen(!abilityMethodHintPinned);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setAbilityMethodHintPinned(false);
          setAbilityMethodHintOpen(false);
        }}
        onChange={(value) => isAbilityMode(value) && handleAbilityModeChange(value)}
        helpRef={helpRef}
      />
      {selectedAbilityMode === "pointBuy" && hasPointBuyConfig && (
        <PointBuyPanel
          pointCapLabel={text.POINT_CAP_LABEL}
          pointCap={selectedPointCap}
          pointCapMin={pointCapMin}
          pointCapMax={pointCapMax}
          pointCapStep={pointCapStep}
          pointBuyRemainingLabel={text.POINT_BUY_REMAINING_LABEL}
          pointBuyRemaining={pointBuyRemaining}
          showTableLabel={text.POINT_BUY_SHOW_TABLE_LABEL}
          hideTableLabel={text.POINT_BUY_HIDE_TABLE_LABEL}
          tableCaption={text.POINT_BUY_TABLE_CAPTION}
          scoreColumnLabel={text.POINT_BUY_SCORE_COLUMN}
          costColumnLabel={text.POINT_BUY_COST_COLUMN}
          isTableOpen={isPointBuyTableOpen}
          costTable={pointBuyCostTable}
          onPointCapChange={(value) =>
            applyAbilitySelection({ ...state.abilities }, {
              pointCap: Math.min(pointCapMax, Math.max(pointCapMin, value)),
            })
          }
          onToggleTable={() => setIsPointBuyTableOpen((current) => !current)}
        />
      )}
      {selectedAbilityMode === "rollSets" && rollSetsConfig && (
        <RollSetChooser
          text={text}
          generatedRollSets={generatedRollSets}
          selectedRollSetIndex={selectedRollSetIndex}
          applySelectedRollSet={applySelectedRollSet}
          regenerateRollSetOptions={regenerateRollSetOptions}
        />
      )}
      <div className="grid">
        {ABILITY_ORDER.map((key) => {
          const value = Number(state.abilities[key] ?? 0);
          const labelText = localizeAbilityLabel(key);
          const canEditAbility = !rollSetNeedsSelection;
          return (
            <div key={key} className="ability-input-row">
              <label htmlFor={`ability-input-${key}`}>{labelText}</label>
              <div className="ability-stepper">
                <button
                  type="button"
                  className="ability-step-btn"
                  aria-label={`${text.DECREASE_LABEL} ${labelText}`}
                  disabled={!canEditAbility || value <= abilityMinScore}
                  onClick={() => stepAbility(key, -1)}
                >
                  -
                </button>
                <input
                  id={`ability-input-${key}`}
                  type="number"
                  disabled={!canEditAbility}
                  min={abilityMinScore}
                  max={abilityMaxScore}
                  step={1}
                  value={value}
                  onChange={(event) => setAbility(key, Number(event.target.value))}
                  onBlur={() => clampAbilityOnBlur(key)}
                />
                <button
                  type="button"
                  className="ability-step-btn"
                  aria-label={`${text.INCREASE_LABEL} ${labelText}`}
                  disabled={!canEditAbility || value >= abilityMaxScore}
                  onClick={() => stepAbility(key, 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {(abilityPresentation?.showExistingModifiers ?? true) && (
        <AbilityModifiersTable
          text={text}
          abilityOrder={ABILITY_ORDER}
          localizeAbilityLabel={localizeAbilityLabel}
          state={state}
          provenanceByTargetPath={provenanceByTargetPath}
          sourceMetaByEntityKey={sourceMetaByEntityKey}
          reviewData={reviewData}
          sourceTypeLabels={sourceTypeLabels}
          hideZeroGroups={hideZeroGroups}
        />
      )}
    </section>
  );
}
