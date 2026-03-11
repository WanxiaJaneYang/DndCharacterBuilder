import { useEffect, useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";
import { applyChoice, initialState, type CharacterState } from "@dcb/engine";
import {
  clampAbilityScore,
  derivePointBuyBaseScore,
  generateRollSets,
  type AbilityMode,
  type AbilityPresentationConfig,
  type AbilityStepConfig,
} from "../appHelpers";
import type { UIText } from "../uiText";
import { ABILITY_ORDER, DEFAULT_ABILITY_MAX, DEFAULT_ABILITY_MIN, STEP_ID_ABILITIES } from "./constants";
import type { WizardEngineContext } from "./types";

type UseAbilityStepStateInput = {
  text: UIText;
  state: CharacterState;
  setState: Dispatch<SetStateAction<CharacterState>>;
  context: WizardEngineContext;
  currentStep?: { kind?: string };
  wizardSteps: Array<{ id: string; abilitiesConfig?: AbilityStepConfig; abilityPresentation?: AbilityPresentationConfig }>;
  abilityMethodHintRef: RefObject<HTMLDivElement | null>;
  abilityMethodHintOpen: boolean;
  setAbilityMethodHintOpen: Dispatch<SetStateAction<boolean>>;
  abilityMethodHintPinned: boolean;
  setAbilityMethodHintPinned: Dispatch<SetStateAction<boolean>>;
  isPointBuyTableOpen: boolean;
  setIsPointBuyTableOpen: Dispatch<SetStateAction<boolean>>;
};

export function useAbilityStepState(input: UseAbilityStepStateInput) {
  const abilityStepConfig = useMemo(() => input.wizardSteps.find((step) => step.id === STEP_ID_ABILITIES)?.abilitiesConfig, [input.wizardSteps]);
  const abilityPresentation = useMemo(() => input.wizardSteps.find((step) => step.id === STEP_ID_ABILITIES)?.abilityPresentation, [input.wizardSteps]);
  const abilityModes = abilityStepConfig?.modes?.length ? abilityStepConfig.modes : [];
  const abilityMeta = (input.state.selections.abilitiesMeta as { mode?: AbilityMode; pointCap?: number; rollSets?: { generatedSets?: number[][]; selectedSetIndex?: number } } | undefined) ?? {};
  const selectedAbilityMode = abilityMeta.mode ?? abilityStepConfig?.defaultMode ?? abilityModes[0];
  const isAbilityMode = (value: string): value is AbilityMode => abilityModes.some((mode) => mode === value);
  const selectedAbilityModeValue = selectedAbilityMode && isAbilityMode(selectedAbilityMode) ? selectedAbilityMode : (abilityModes[0] ?? "");
  const rollSetsConfig = abilityStepConfig?.rollSets;
  const generatedRollSets = Array.isArray(abilityMeta.rollSets?.generatedSets) ? abilityMeta.rollSets.generatedSets : [];
  const selectedRollSetIndexRaw = Number(abilityMeta.rollSets?.selectedSetIndex);
  const selectedRollSetIndex = Number.isInteger(selectedRollSetIndexRaw) ? selectedRollSetIndexRaw : -1;
  const selectedRollSet = selectedRollSetIndex >= 0 && selectedRollSetIndex < generatedRollSets.length ? generatedRollSets[selectedRollSetIndex] : undefined;
  const rollSetNeedsSelection = selectedAbilityMode === "rollSets" && generatedRollSets.length > 0 && !selectedRollSet;
  const rollScoresPool = selectedRollSet?.length ? selectedRollSet : [];
  const currentScores = ABILITY_ORDER.map((ability) => Number(input.state.abilities[ability] ?? DEFAULT_ABILITY_MIN));
  const phbStandardArray = abilityStepConfig?.phb?.methodType === "standardArray" ? (abilityStepConfig.phb.standardArray ?? []) : [];
  const abilityMinScore = selectedAbilityMode === "pointBuy" ? Number(abilityStepConfig?.pointBuy?.minScore ?? DEFAULT_ABILITY_MIN) : selectedAbilityMode === "phb" && abilityStepConfig?.phb?.methodType === "manualRange" ? Number(abilityStepConfig.phb.manualRange?.minScore ?? DEFAULT_ABILITY_MIN) : selectedAbilityMode === "phb" && phbStandardArray.length ? Math.min(...phbStandardArray) : selectedAbilityMode === "rollSets" && rollScoresPool.length ? Math.min(...rollScoresPool) : Math.min(...currentScores, DEFAULT_ABILITY_MIN);
  const abilityMaxScore = selectedAbilityMode === "pointBuy" ? Number(abilityStepConfig?.pointBuy?.maxScore ?? DEFAULT_ABILITY_MAX) : selectedAbilityMode === "phb" && abilityStepConfig?.phb?.methodType === "manualRange" ? Number(abilityStepConfig.phb.manualRange?.maxScore ?? DEFAULT_ABILITY_MAX) : selectedAbilityMode === "phb" && phbStandardArray.length ? Math.max(...phbStandardArray) : selectedAbilityMode === "rollSets" && rollScoresPool.length ? Math.max(...rollScoresPool) : Math.max(...currentScores, DEFAULT_ABILITY_MAX);
  const pointBuyCostTable = abilityStepConfig?.pointBuy?.costTable ?? {};
  const pointBuyBaseScore = derivePointBuyBaseScore(pointBuyCostTable, Number(abilityStepConfig?.pointBuy?.minScore ?? DEFAULT_ABILITY_MIN));
  const defaultPointBuyScores = useMemo(() => Object.fromEntries(ABILITY_ORDER.map((ability) => [ability, pointBuyBaseScore])), [pointBuyBaseScore]);
  const pointCapMin = abilityStepConfig?.pointBuy?.minPointCap ?? 0;
  const pointCapMax = abilityStepConfig?.pointBuy?.maxPointCap ?? 0;
  const pointCapStep = abilityStepConfig?.pointBuy?.pointCapStep ?? 1;
  const pointCapDefault = abilityStepConfig?.pointBuy?.defaultPointCap ?? 0;
  const selectedPointCap = Number.isFinite(Number(abilityMeta.pointCap)) ? Number(abilityMeta.pointCap) : pointCapDefault;
  const pointBuySpent = ABILITY_ORDER.reduce((sum, ability) => sum + Number(pointBuyCostTable[String(input.state.abilities[ability])] ?? 0), 0);
  const pointBuyRemaining = selectedPointCap - pointBuySpent;
  const hasInitialAbilityScores = ABILITY_ORDER.every((ability) => Number(input.state.abilities[ability] ?? DEFAULT_ABILITY_MIN) === Number(initialState.abilities[ability]));
  const textMap = input.text as unknown as Record<string, unknown>;
  const normalizeUITextKey = (key?: string) => key?.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
  const defaultModeLabel = (mode: AbilityMode) => mode === "pointBuy" ? input.text.ABILITY_MODE_POINT_BUY : mode === "phb" ? input.text.ABILITY_MODE_PHB : input.text.ABILITY_MODE_ROLL_SETS;
  const getModeLabel = (mode: AbilityMode) => {
    const key = abilityPresentation?.modeUi?.[mode]?.labelKey;
    const value = key ? (textMap[key] ?? (normalizeUITextKey(key) ? textMap[normalizeUITextKey(key)!] : undefined)) : undefined;
    return typeof value === "string" && value.length > 0 ? value : defaultModeLabel(mode);
  };
  const getModeHint = (mode: AbilityMode) => {
    const key = abilityPresentation?.modeUi?.[mode]?.hintKey;
    const value = key ? (textMap[key] ?? (normalizeUITextKey(key) ? textMap[normalizeUITextKey(key)!] : undefined)) : undefined;
    return typeof value === "string" ? value : "";
  };
  const activeModeHint = selectedAbilityMode ? getModeHint(selectedAbilityMode) : "";
  const hasActiveModeHint = activeModeHint.length > 0;
  const isHintVisible = input.abilityMethodHintOpen && hasActiveModeHint;
  const applyAbilitySelection = (nextScores: Record<string, number>, metaPatch?: Partial<{ mode: AbilityMode; pointCap: number; rollSets: { generatedSets?: number[][]; selectedSetIndex?: number } }>) => {
    input.setState((previous) => {
      const prevMeta = (previous.selections.abilitiesMeta as Record<string, unknown> | undefined) ?? {};
      const nextMode = metaPatch?.mode ?? selectedAbilityMode ?? abilityModes[0];
      if (!nextMode) return applyChoice(previous, STEP_ID_ABILITIES, nextScores, input.context);
      const nextMeta = { ...prevMeta, ...metaPatch, mode: nextMode };
      return applyChoice(previous, STEP_ID_ABILITIES, { mode: nextMeta.mode, pointCap: nextMeta.pointCap, rollSets: nextMeta.rollSets, scores: nextScores }, input.context);
    });
  };
  const setAbility = (key: string, value: number) => Number.isFinite(value) && applyAbilitySelection({ ...input.state.abilities, [key]: value });
  const stepAbility = (key: string, delta: number) => {
    const current = Number(input.state.abilities[key] ?? 0);
    const next = clampAbilityScore(current + delta, abilityMinScore, abilityMaxScore);
    if (next !== current) applyAbilitySelection({ ...input.state.abilities, [key]: next });
  };
  const clampAbilityOnBlur = (key: string) => {
    const current = Number(input.state.abilities[key]);
    const clamped = clampAbilityScore(current, abilityMinScore, abilityMaxScore);
    if (current !== clamped) applyAbilitySelection({ ...input.state.abilities, [key]: clamped });
  };
  const applySelectedRollSet = (set: number[], index: number) => applyAbilitySelection(Object.fromEntries(ABILITY_ORDER.map((ability, abilityIndex) => [ability, Number(set[abilityIndex] ?? input.state.abilities[ability] ?? DEFAULT_ABILITY_MIN)])), { rollSets: { generatedSets: generatedRollSets, selectedSetIndex: index } });
  const regenerateRollSetOptions = () => rollSetsConfig && applyAbilitySelection({ ...input.state.abilities }, { rollSets: { generatedSets: generateRollSets(rollSetsConfig), selectedSetIndex: -1 } });
  const handleAbilityModeChange = (mode: AbilityMode) => {
    if (mode !== "rollSets") {
      applyAbilitySelection({ ...input.state.abilities }, { mode });
      return;
    }
    const currentSets = Array.isArray(abilityMeta.rollSets?.generatedSets) ? abilityMeta.rollSets.generatedSets : [];
    applyAbilitySelection({ ...input.state.abilities }, { mode, rollSets: { generatedSets: currentSets.length ? currentSets : generateRollSets(rollSetsConfig), selectedSetIndex: selectedRollSetIndex } });
  };

  useEffect(() => {
    if (input.currentStep?.kind !== "abilities" || selectedAbilityMode !== "pointBuy") {
      input.setIsPointBuyTableOpen(false);
      return;
    }
    if (!abilityMeta.mode && hasInitialAbilityScores) {
      applyAbilitySelection(defaultPointBuyScores, { mode: "pointBuy", pointCap: selectedPointCap });
    }
  }, [
    abilityMeta.mode,
    applyAbilitySelection,
    defaultPointBuyScores,
    hasInitialAbilityScores,
    input.currentStep?.kind,
    input.setIsPointBuyTableOpen,
    selectedAbilityMode,
    selectedPointCap,
  ]);

  return {
    abilityPresentation,
    abilityModes,
    selectedAbilityMode,
    selectedAbilityModeValue,
    isAbilityMode,
    rollSetsConfig,
    generatedRollSets,
    selectedRollSetIndex,
    rollSetNeedsSelection,
    abilityMinScore,
    abilityMaxScore,
    pointBuyCostTable,
    pointCapMin,
    pointCapMax,
    pointCapStep,
    selectedPointCap,
    pointBuyRemaining,
    isPointBuyTableOpen: input.isPointBuyTableOpen,
    setIsPointBuyTableOpen: input.setIsPointBuyTableOpen,
    applyAbilitySelection,
    setAbility,
    stepAbility,
    clampAbilityOnBlur,
    applySelectedRollSet,
    regenerateRollSetOptions,
    abilityMethodHintRef: input.abilityMethodHintRef,
    abilityMethodHintPinned: input.abilityMethodHintPinned,
    setAbilityMethodHintOpen: input.setAbilityMethodHintOpen,
    setAbilityMethodHintPinned: input.setAbilityMethodHintPinned,
    activeModeHint,
    hasActiveModeHint,
    isHintVisible,
    handleAbilityModeChange,
    getModeLabel,
    hideZeroGroups: abilityPresentation?.hideZeroEffectGroups ?? true,
    sourceTypeLabels: abilityPresentation?.sourceTypeLabels ?? {},
    hasPointBuyConfig: Boolean(abilityStepConfig?.pointBuy),
  };
}

export type AbilityStepState = ReturnType<typeof useAbilityStepState>;
