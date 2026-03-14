import { useEffect, useRef, useState } from "react";
import { initialState, type CharacterState } from "@dcb/engine/legacy";
import { defaultEditionId, EDITIONS } from "../editions";
import { detectDefaultLanguage, type Language } from "../uiText";
import { canMoveToNextStep } from "./canMoveToNextStep";
import { DEFAULT_EXPORT_NAME, type Role } from "./constants";
import { useAbilityStepState } from "./useAbilityStepState";
import { useAppData } from "./useAppData";

export function useAppController() {
  const [state, setState] = useState<CharacterState>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [showProv, setShowProv] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [language, setLanguage] = useState<Language>(detectDefaultLanguage);
  const [selectedEditionId, setSelectedEditionId] = useState(() => defaultEditionId(EDITIONS));
  const [selectedOptionalPackIds, setSelectedOptionalPackIds] = useState<string[]>([]);
  const [rulesReady, setRulesReady] = useState(false);
  const [abilityMethodHintOpen, setAbilityMethodHintOpen] = useState(false);
  const [abilityMethodHintPinned, setAbilityMethodHintPinned] = useState(false);
  const [isPointBuyTableOpen, setIsPointBuyTableOpen] = useState(false);
  const abilityMethodHintRef = useRef<HTMLDivElement | null>(null);
  const appData = useAppData({
    state,
    language,
    stepIndex,
    selectedEditionId,
    selectedOptionalPackIds,
  });

  useEffect(() => {
    if (stepIndex >= appData.wizardSteps.length) setStepIndex(0);
  }, [appData.wizardSteps.length, stepIndex]);

  useEffect(() => {
    if (appData.currentStep?.kind !== "abilities") {
      setAbilityMethodHintOpen(false);
      setAbilityMethodHintPinned(false);
    }
  }, [appData.currentStep?.kind]);

  useEffect(() => {
    if (!abilityMethodHintPinned) return;
    const closeHint = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || abilityMethodHintRef.current?.contains(target)) return;
      setAbilityMethodHintPinned(false);
      setAbilityMethodHintOpen(false);
    };
    window.addEventListener("mousedown", closeHint);
    window.addEventListener("touchstart", closeHint);
    return () => {
      window.removeEventListener("mousedown", closeHint);
      window.removeEventListener("touchstart", closeHint);
    };
  }, [abilityMethodHintPinned]);

  const abilityState = useAbilityStepState({
    text: appData.text,
    state,
    setState,
    context: appData.context,
    currentStep: appData.currentStep,
    wizardSteps: appData.wizardSteps,
    abilityMethodHintRef,
    abilityMethodHintOpen,
    setAbilityMethodHintOpen,
    abilityMethodHintPinned,
    setAbilityMethodHintPinned,
    isPointBuyTableOpen,
    setIsPointBuyTableOpen,
  });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(appData.computeResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${appData.spec.meta.name || DEFAULT_EXPORT_NAME}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const canGoNext = canMoveToNextStep({
    stepIndex,
    wizardStepCount: appData.wizardSteps.length,
    currentStep: appData.currentStep,
    choiceLimit: appData.choiceMap.get(appData.currentStep?.id ?? "")?.limit,
    state,
  });

  return {
    state,
    setState,
    stepIndex,
    setStepIndex,
    showProv,
    setShowProv,
    role,
    setRole,
    language,
    setLanguage,
    selectedEditionId,
    setSelectedEditionId,
    selectedOptionalPackIds,
    setSelectedOptionalPackIds,
    rulesReady,
    setRulesReady,
    appData,
    abilityState,
    canGoNext,
    exportJson,
  };
}

export type AppController = ReturnType<typeof useAppController>;
