import type { CharacterState } from "./characterSpec";
import {
  ABILITY_KEYS,
  ABILITY_STEP_ID,
  type EngineContext,
  type ValidationError
} from "./legacyRuntimeTypes";
import {
  getAbilityModeFromState,
  getAbilityScoreBounds,
  getAbilityStepConfig
} from "./legacyRuntimeAbilityConfig";

export function collectAbilityValidationErrors(
  state: CharacterState,
  context: EngineContext,
  options?: { allowFlowDefaultAbilityMode?: boolean }
): ValidationError[] {
  const errors: ValidationError[] = [];
  const abilityConfig = getAbilityStepConfig(context);
  const abilityMode = getAbilityModeFromState(state, abilityConfig, {
    allowFlowDefault: options?.allowFlowDefaultAbilityMode ?? true
  });
  const abilityBounds = getAbilityScoreBounds(state, context, abilityMode);

  for (const ability of ABILITY_KEYS) {
    const score = state.abilities[ability];
    if (score === undefined || !Number.isInteger(score) || score < abilityBounds.min || score > abilityBounds.max) {
      errors.push({
        code: "ABILITY_RANGE",
        message: `${ability.toUpperCase()} must be between ${abilityBounds.min} and ${abilityBounds.max}.`,
        stepId: ABILITY_STEP_ID
      });
    }
  }

  if (!abilityConfig || !abilityMode) return errors;

  if (!abilityConfig.modes?.includes(abilityMode)) {
    errors.push({
      code: "ABILITY_MODE_INVALID",
      message: `Ability mode ${abilityMode} is not enabled for this flow.`,
      stepId: ABILITY_STEP_ID
    });
    return errors;
  }

  if (abilityMode === "pointBuy") {
    const pointBuyCfg = abilityConfig.pointBuy;
    if (!pointBuyCfg) {
      errors.push({
        code: "ABILITY_MODE_CONFIG_MISSING",
        message: "Point-buy mode is enabled but pointBuy config is missing.",
        stepId: ABILITY_STEP_ID
      });
      return errors;
    }

    const costTable = pointBuyCfg.costTable ?? {};
    const meta = state.selections.abilitiesMeta as { pointCap?: unknown } | undefined;
    const baseCapRaw = Number(meta?.pointCap ?? pointBuyCfg.defaultPointCap ?? 0);
    const minCap = Number(pointBuyCfg.minPointCap);
    const maxCap = Number(pointBuyCfg.maxPointCap);
    const step = Number(pointBuyCfg.pointCapStep);
    const hasMinCap = Number.isFinite(minCap);
    const hasMaxCap = Number.isFinite(maxCap);
    const hasStep = Number.isFinite(step) && step > 0;

    let sanitizedCap = Number.isFinite(baseCapRaw) ? Math.round(baseCapRaw) : 0;
    if (hasMinCap) sanitizedCap = Math.max(minCap, sanitizedCap);
    if (hasMaxCap) sanitizedCap = Math.min(maxCap, sanitizedCap);
    if (hasStep) {
      const stepBase = hasMinCap ? minCap : 0;
      const stepsFromBase = Math.round((sanitizedCap - stepBase) / step);
      sanitizedCap = stepBase + stepsFromBase * step;
      if (hasMinCap) sanitizedCap = Math.max(minCap, sanitizedCap);
      if (hasMaxCap) sanitizedCap = Math.min(maxCap, sanitizedCap);
    }

    let totalCost = 0;
    let missingCost = false;
    for (const ability of ABILITY_KEYS) {
      const cost = costTable[String(state.abilities[ability])];
      if (typeof cost !== "number" || !Number.isFinite(cost)) {
        missingCost = true;
        break;
      }
      totalCost += cost;
    }

    if (missingCost) {
      errors.push({
        code: "ABILITY_POINTBUY_SCORE_INVALID",
        message: "Point-buy score is missing from the configured cost table.",
        stepId: ABILITY_STEP_ID
      });
    } else if (totalCost > sanitizedCap) {
      errors.push({
        code: "ABILITY_POINTBUY_EXCEEDED",
        message: `Point-buy cost ${totalCost} exceeds cap ${sanitizedCap}.`,
        stepId: ABILITY_STEP_ID
      });
    }

    return errors;
  }

  if (abilityMode === "phb") {
    const phbCfg = abilityConfig.phb;
    if (!phbCfg) {
      errors.push({
        code: "ABILITY_MODE_CONFIG_MISSING",
        message: "PHB mode is enabled but phb config is missing.",
        stepId: ABILITY_STEP_ID
      });
      return errors;
    }

    if (phbCfg.methodType === "standardArray" && Array.isArray(phbCfg.standardArray)) {
      const expected = [...phbCfg.standardArray].sort((a, b) => a - b);
      const actual = ABILITY_KEYS.map((ability) => Number(state.abilities[ability])).sort((a, b) => a - b);
      const sameLength = expected.length === actual.length;
      const sameValues = sameLength && expected.every((value, index) => value === actual[index]);
      if (!sameValues) {
        errors.push({
          code: "ABILITY_PHB_ARRAY_INVALID",
          message: "Assigned ability scores must use the configured PHB standard array exactly once.",
          stepId: ABILITY_STEP_ID
        });
      }
    }

    return errors;
  }

  const rollCfg = abilityConfig.rollSets;
  if (!rollCfg) {
    errors.push({
      code: "ABILITY_MODE_CONFIG_MISSING",
      message: "Roll-sets mode is enabled but rollSets config is missing.",
      stepId: ABILITY_STEP_ID
    });
    return errors;
  }

  const meta = state.selections.abilitiesMeta as {
    rollSets?: { generatedSets?: unknown; selectedSetIndex?: unknown };
  } | undefined;
  const generatedSets = Array.isArray(meta?.rollSets?.generatedSets) ? meta.rollSets.generatedSets : [];
  const selectedSetIndexRaw = Number(meta?.rollSets?.selectedSetIndex);
  const selectedSetIndex = Number.isInteger(selectedSetIndexRaw) ? selectedSetIndexRaw : -1;
  const requiredSets = Number(rollCfg.setsCount ?? 0);
  const selectionMissing = generatedSets.length < requiredSets || selectedSetIndex < 0 || selectedSetIndex >= generatedSets.length;

  if (selectionMissing) {
    errors.push({
      code: "ABILITY_ROLLSETS_SELECTION_REQUIRED",
      message: "Roll-sets mode requires selecting one generated set before continuing.",
      stepId: ABILITY_STEP_ID
    });
    return errors;
  }

  const selectedSet = generatedSets[selectedSetIndex];
  const validSet = Array.isArray(selectedSet) && selectedSet.every((value) => Number.isFinite(Number(value)));
  if (!validSet) {
    errors.push({
      code: "ABILITY_ROLLSETS_SELECTION_REQUIRED",
      message: "Roll-sets mode requires selecting one generated set before continuing.",
      stepId: ABILITY_STEP_ID
    });
    return errors;
  }

  const expected = [...selectedSet.map((value) => Number(value))].sort((a, b) => a - b);
  const actual = ABILITY_KEYS.map((ability) => Number(state.abilities[ability])).sort((a, b) => a - b);
  const sameLength = expected.length === actual.length;
  const sameValues = sameLength && expected.every((value, index) => value === actual[index]);
  if (!sameValues) {
    errors.push({
      code: "ABILITY_ROLLSETS_SET_MISMATCH",
      message: "Assigned ability scores must come from the selected roll-set.",
      stepId: ABILITY_STEP_ID
    });
  }

  return errors;
}
