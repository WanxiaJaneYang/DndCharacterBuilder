import type { CharacterState } from "./characterSpec";
import type { EngineContext, SkillMiscBreakdownEntry, UnresolvedRule } from "./legacyRuntimeTypes";
import {
  evaluateConditionalModifierPredicate,
  type ConditionalPredicateEvaluationContext
} from "./legacyRuntimeConditionalModifiers";
import { getEntityDataRecord, parseDeferredMechanics } from "./legacyRuntimeEntityData";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { buildLegacyProficiencyState } from "./legacyRuntimeProficiencyState";
import { getClassSkills, getDerivedSkillRanks } from "./legacyRuntimeProgression";
import { getSelectedFeatIds } from "./legacyRuntimeSelectors";
import { getSelectedEntities, getSelectedFeatureIds } from "./legacyRuntimeSelectedEntities";

type ConditionalPredicate = Parameters<typeof evaluateConditionalModifierPredicate>[0];

function describeSuppressionReason(
  predicate: ConditionalPredicate,
  context: ConditionalPredicateEvaluationContext
): string | undefined {
  const describeIfFailed = (entry: ConditionalPredicate): string | undefined =>
    evaluateConditionalModifierPredicate(entry, context)
      ? undefined
      : describeSuppressionReason(entry, context);

  if (predicate.op === "gte") {
    return `requires ${predicate.left.id} ranks >= ${predicate.right}; current ranks ${context.skillRanks[predicate.left.id] ?? 0}.`;
  }

  if (predicate.op === "hasFeat") {
    return `requires feat ${predicate.id}.`;
  }

  if (predicate.op === "hasFeature") {
    return `requires feature ${predicate.id}.`;
  }

  if (predicate.op === "isClassSkill") {
    return `${predicate.target.id} must currently be a class skill.`;
  }

  if (predicate.op === "and") {
    return predicate.args
      .map((entry) => describeIfFailed(entry))
      .find((reason) => Boolean(reason));
  }

  if (predicate.op === "or") {
    const reasons = predicate.args
      .map((entry) => describeIfFailed(entry))
      .filter((reason): reason is string => Boolean(reason));
    return reasons.length > 0 ? `none of the alternative conditions were met: ${reasons.join(" or ")}` : undefined;
  }

  return undefined;
}

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
  const proficiencyState = buildLegacyProficiencyState(state, context);
  const skillRanks = getDerivedSkillRanks(state, context);
  const activeEntityKeys = new Set(
    getSelectedEntities(state, context).map((entity) => `${entity._source.packId}:${entity.entityType}:${entity.id}`)
  );
  const evaluationContext: ConditionalPredicateEvaluationContext = {
    skillRanks,
    selectedFeatIds,
    selectedFeatureIds,
    classSkillIds,
    proficiencyState
  };

  for (const modifier of context.resolvedData.conditionalSkillModifiers ?? []) {
    const sourceKey = `${modifier.source.packId}:${modifier.source.entityType}:${modifier.source.entityId}`;
    if (modifier.source.entityType !== "rules" && !activeEntityKeys.has(sourceKey)) continue;
    const applies = evaluateConditionalModifierPredicate(modifier.when, evaluationContext);
    const skillId = modifier.apply.targetSkillId;
    const suppressionReason = applies ? undefined : describeSuppressionReason(modifier.when, evaluationContext);
    const note = suppressionReason
      ? modifier.apply.note
        ? `${modifier.apply.note} Suppressed: ${suppressionReason}`
        : `Suppressed: ${suppressionReason}`
      : modifier.apply.note;

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
      ...(note ? { note } : {})
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
