import type { CharacterState } from "./characterSpec";
import { entityAllowed } from "./legacyRuntimeExpression";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { getStepSelectionLimit } from "./legacyRuntimeProgression";
import { isEntityTypeFlowStep, parseFiniteSkillRank } from "./legacyRuntimeSelectors";
import type { AbilitySelectionPayload, Choice, EngineContext } from "./legacyRuntimeTypes";

export function listChoices(state: CharacterState, context: EngineContext): Choice[] {
  return context.resolvedData.flow.steps
    .filter(isEntityTypeFlowStep)
    .map((step) => {
      const options = Object.values(context.resolvedData.entities[step.source.entityType] ?? {})
        .filter((entity) => entityAllowed(entity, state, context))
        .map((entity) => ({ id: entity.id, label: entity.name }));
      return { stepId: step.id, label: step.label, options, limit: getStepSelectionLimit(step, state, context) };
    });
}

export function applyChoice(
  state: CharacterState,
  choiceId: string,
  selection: unknown,
  _context?: EngineContext
): CharacterState {
  if (choiceId === "name") {
    return { ...state, metadata: { ...state.metadata, name: String(selection) } };
  }
  if (choiceId === "abilities") {
    const payload = selection as AbilitySelectionPayload;
    const isStructuredPayload = payload && typeof payload === "object" && !Array.isArray(payload) && payload.scores && typeof payload.scores === "object";
    if (isStructuredPayload) {
      return {
        ...state,
        abilities: payload.scores as Record<string, number>,
        selections: {
          ...state.selections,
          abilitiesMeta: {
            mode: payload.mode,
            pointCap: payload.pointCap,
            rollSets: payload.rollSets
          }
        }
      };
    }
    return { ...state, abilities: selection as Record<string, number> };
  }
  if (choiceId === "feat") {
    const prev = (state.selections.feats as string[] | undefined) ?? [];
    const next = Array.from(new Set([...(Array.isArray(selection) ? (selection as string[]) : [...prev, String(selection)])]));
    return { ...state, selections: { ...state.selections, feats: next } };
  }
  if (choiceId === "skills") {
    const raw = selection && typeof selection === "object" && !Array.isArray(selection) ? (selection as Record<string, unknown>) : {};
    const normalized: Record<string, number> = {};
    for (const [skillId, rankValue] of Object.entries(raw)) {
      const canonicalSkillId = normalizeSkillId(skillId);
      if (!canonicalSkillId) continue;
      const rank = parseFiniteSkillRank(rankValue);
      if (rank === undefined) continue;
      normalized[canonicalSkillId] = rank;
    }
    return { ...state, selections: { ...state.selections, skills: normalized } };
  }
  return { ...state, selections: { ...state.selections, [choiceId]: selection } };
}
