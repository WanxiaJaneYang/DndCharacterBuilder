import type { CharacterState } from "./characterSpec";
import {
  ABILITY_STEP_ID,
  type AbilityGenerationMode,
  type AbilityStepConfig,
  type EngineContext
} from "./legacyRuntimeTypes";

export function getAbilityStepConfig(context: EngineContext): AbilityStepConfig | undefined {
  const abilityStep = context.resolvedData.flow.steps.find((step) => step.id === ABILITY_STEP_ID) as
    | { abilitiesConfig?: unknown }
    | undefined;
  if (!abilityStep?.abilitiesConfig || typeof abilityStep.abilitiesConfig !== "object") return undefined;
  return abilityStep.abilitiesConfig as AbilityStepConfig;
}

export function getAbilityModeFromState(
  state: CharacterState,
  config?: { defaultMode?: AbilityGenerationMode },
  options?: { allowFlowDefault?: boolean }
): AbilityGenerationMode | undefined {
  const meta = state.selections.abilitiesMeta as { mode?: unknown } | undefined;
  const mode = typeof meta?.mode === "string" ? (meta.mode as AbilityGenerationMode) : undefined;
  if (mode) return mode;
  if (options?.allowFlowDefault === false) return undefined;
  return config?.defaultMode;
}

export function getAbilityScoreBounds(
  state: CharacterState,
  context: EngineContext,
  mode: AbilityGenerationMode | undefined
): { min: number; max: number } {
  const fallback = { min: 3, max: 18 };
  const cfg = getAbilityStepConfig(context);
  if (!cfg || !mode) return fallback;

  if (mode === "pointBuy" && cfg.pointBuy?.minScore !== undefined && cfg.pointBuy?.maxScore !== undefined) {
    return { min: cfg.pointBuy.minScore, max: cfg.pointBuy.maxScore };
  }

  if (mode === "phb" && cfg.phb?.methodType === "manualRange") {
    const min = Number(cfg.phb.manualRange?.minScore);
    const max = Number(cfg.phb.manualRange?.maxScore);
    if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
  }

  return fallback;
}
