import type { CharacterState } from "./characterSpec";
import type { EngineContext, SkillMiscBreakdownEntry, UnresolvedRule } from "./legacyRuntimeTypes";
import {
  evaluateConditionalModifierPredicate,
  type ConditionalPredicateEvaluationContext
} from "./legacyRuntimeConditionalModifiers";
import { getEntityDataRecord, parseDeferredMechanics } from "./legacyRuntimeEntityData";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { getClassSkills, getDerivedSkillRanks } from "./legacyRuntimeProgression";
import { getSelectedFeatIds } from "./legacyRuntimeSelectors";
import { getSelectedEntities, getSelectedFeatureIds } from "./legacyRuntimeSelectedEntities";

export function buildConditionalSkillBonusData(
  state: CharacterState,
  context: EngineContext
): {
  totals: Record<string, number>;
  breakdown: Record<string, SkillMiscBreakdownEntry[]>;
} {
  const totals: Record<string, number> = {};
  const breakdown: Record<string, SkillMiscBreakdownEntry[]> = {};
  const selectedFeatIds = new Set(getSelectedFeatIds(state).map((id) => normalizeSkillId(id)).filter(Boolean));
  const selectedFeatureIds = getSelectedFeatureIds(state, context);
  const classSkillIds = getClassSkills(state, context);
  const skillRanks = getDerivedSkillRanks(state, context);
  const activeEntityKeys = new Set(
    getSelectedEntities(state, context).map((entity) => `${entity._source.packId}:${entity.entityType}:${entity.id}`)
  );
  const evaluationContext: ConditionalPredicateEvaluationContext = {
    skillRanks,
    selectedFeatIds,
    selectedFeatureIds,
    classSkillIds
  };

  for (const modifier of context.resolvedData.conditionalSkillModifiers ?? []) {
    const sourceKey = `${modifier.source.packId}:${modifier.source.entityType}:${modifier.source.entityId}`;
    if (modifier.source.entityType !== "rules" && !activeEntityKeys.has(sourceKey)) continue;
    const applies = evaluateConditionalModifierPredicate(modifier.when, evaluationContext);
    const skillId = modifier.apply.targetSkillId;
    if (applies) totals[skillId] = (totals[skillId] ?? 0) + modifier.apply.bonus;
    (breakdown[skillId] ??= []).push({
      id: modifier.id,
      sourceType: modifier.sourceType,
      bonus: modifier.apply.bonus,
      applies,
      source: {
        packId: modifier.source.packId,
        entityId: modifier.source.entityId,
        entityType: modifier.source.entityType
      },
      ...(modifier.apply.bonusType ? { bonusType: modifier.apply.bonusType } : {}),
      ...(modifier.apply.note ? { note: modifier.apply.note } : {})
    });
  }

  return { totals, breakdown };
}

export function collectUnresolvedRules(state: CharacterState, context: EngineContext): UnresolvedRule[] {
  return getSelectedEntities(state, context)
    .flatMap((entity) =>
      parseDeferredMechanics(getEntityDataRecord(entity).deferredMechanics).map((mechanic) => ({
        id: `${entity._source.packId}:${entity.entityType}:${entity.id}:${mechanic.id}`,
        category: mechanic.category,
        description: mechanic.description,
        dependsOn: mechanic.dependsOn,
        impacts: mechanic.impacts ?? mechanic.impactPaths,
        source: mechanic.sourceRefs
          ? {
              entityType: entity.entityType,
              entityId: entity.id,
              packId: entity._source.packId,
              sourceRefs: mechanic.sourceRefs
            }
          : {
              entityType: entity.entityType,
              entityId: entity.id,
              packId: entity._source.packId
            }
      }))
    )
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}
