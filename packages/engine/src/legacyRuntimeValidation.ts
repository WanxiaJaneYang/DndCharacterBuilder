import type { CharacterState } from "./characterSpec";
import { collectAbilityValidationErrors } from "./legacyRuntimeAbilityValidation";
import { buildDecisionSummary } from "./legacyRuntimeDecisions";
import { abilityMod, entityAllowed } from "./legacyRuntimeExpression";
import { normalizeSkillId } from "./legacyRuntimeIds";
import {
  getCharacterLevel,
  getSelectionCountForStep,
  getSkillMaxRanksForLevel,
  getStepSelectionLimit
} from "./legacyRuntimeProgression";
import { getSelectedSkillRanks, isEntityTypeFlowStep } from "./legacyRuntimeSelectors";
import type { EngineContext, ValidationError } from "./legacyRuntimeTypes";

export function collectValidationErrorsFromState(
  state: CharacterState,
  context: EngineContext,
  options?: { allowFlowDefaultAbilityMode?: boolean }
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!state.metadata.name) errors.push({ code: "NAME_REQUIRED", message: "Character name is required.", stepId: "name" });
  errors.push(...collectAbilityValidationErrors(state, context, options));

  for (const step of context.resolvedData.flow.steps.filter(isEntityTypeFlowStep)) {
    const limit = getStepSelectionLimit(step, state, context);
    if (limit === undefined) continue;
    const selectedCount = getSelectionCountForStep(step, state);
    if (selectedCount > limit) {
      errors.push({
        code: "STEP_LIMIT_EXCEEDED",
        message: `${step.label} allows at most ${limit} selection(s).`,
        stepId: step.id
      });
    }
  }

  for (const [entityType, entities] of Object.entries(context.resolvedData.entities)) {
    for (const entity of Object.values(entities)) {
      if (!entityAllowed(entity, state, context)) {
        const selected = Object.values(state.selections).flatMap((value) => (Array.isArray(value) ? value : [value]));
        if (selected.includes(entity.id)) {
          errors.push({ code: "PREREQ_FAILED", message: `${entity.name} prerequisites not met.`, stepId: entityType });
        }
      }
    }
  }

  const abilities = Object.fromEntries(
    Object.entries(state.abilities).map(([key, score]) => [key, { score, mod: abilityMod(score) }])
  ) as Record<string, { score: number; mod: number }>;
  const decisions = buildDecisionSummary(state, context, abilities);
  const selectedRanks = getSelectedSkillRanks(state);
  const rawSelectedSkills = state.selections.skills && typeof state.selections.skills === "object" && !Array.isArray(state.selections.skills)
    ? (state.selections.skills as Record<string, unknown>)
    : {};
  const knownSkills = new Set(Object.keys(context.resolvedData.entities.skills ?? {}).map((skillId) => normalizeSkillId(skillId)));

  for (const [rawSkillId, rawRank] of Object.entries(rawSelectedSkills)) {
    const skillId = normalizeSkillId(rawSkillId);
    if (!skillId) continue;
    const parsedRank = Number(rawRank);
    if (!Number.isFinite(parsedRank) || parsedRank < 0) {
      errors.push({ code: "SKILL_RANK_INVALID", message: `Invalid rank for ${skillId}.`, stepId: "skills" });
      continue;
    }
    const isClassSkill = decisions.classSkills.includes(skillId);
    if (isClassSkill) {
      if (!Number.isInteger(parsedRank)) {
        errors.push({ code: "SKILL_RANK_CLASS_INTEGER", message: `${skillId} class-skill ranks must be whole numbers.`, stepId: "skills" });
      }
    } else if (Math.round(parsedRank * 2) !== parsedRank * 2) {
      errors.push({ code: "SKILL_RANK_STEP", message: `${skillId} ranks must use 0.5 increments.`, stepId: "skills" });
    }
  }

  const characterLevel = getCharacterLevel(state);
  for (const [skillId, rank] of Object.entries(selectedRanks)) {
    if (!knownSkills.has(skillId)) {
      errors.push({ code: "UNKNOWN_SKILL", message: `Unknown skill selected: ${skillId}.`, stepId: "skills" });
      continue;
    }
    const isClassSkill = decisions.classSkills.includes(skillId);
    const maxRanks = getSkillMaxRanksForLevel(characterLevel, isClassSkill);
    if (rank > maxRanks) {
      errors.push({ code: "SKILL_RANK_MAX", message: `${skillId} exceeds max rank ${maxRanks}.`, stepId: "skills" });
    }
  }

  if (decisions.skillPoints.remaining < 0) {
    errors.push({ code: "SKILL_POINTS_EXCEEDED", message: "Allocated skill points exceed available budget.", stepId: "skills" });
  }

  return errors;
}

export function validateState(
  state: CharacterState,
  context: EngineContext,
  options?: { allowFlowDefaultAbilityMode?: boolean }
): ValidationError[] {
  return collectValidationErrorsFromState(state, context, options);
}
