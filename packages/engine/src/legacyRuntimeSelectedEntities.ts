import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import type { EngineContext } from "./legacyRuntimeTypes";
import { normalizeSkillId } from "./legacyRuntimeIds";
import { getApplicableClassGains } from "./legacyRuntimeProgression";
import { getRacialTraits, getSelectedClass, getSelectedFeatIds, getSelectedRace } from "./legacyRuntimeSelectors";

export function getSelectedEntities(state: CharacterState, context: EngineContext): ResolvedEntity[] {
  const entityBuckets = context.resolvedData.entities;
  const selected: ResolvedEntity[] = [];
  const seen = new Set<string>();

  function add(entity: ResolvedEntity | undefined): void {
    if (!entity) return;
    const key = `${entity._source.packId}:${entity.entityType}:${entity.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    selected.push(entity);
  }

  add(getSelectedRace(state, context));
  add(getSelectedClass(state, context));

  for (const featId of getSelectedFeatIds(state)) add(entityBuckets.feats?.[featId]);
  for (const itemId of ((state.selections.equipment as string[] | undefined) ?? [])) add(entityBuckets.items?.[String(itemId)]);

  return selected;
}

export function getSelectedFeatureIds(state: CharacterState, context: EngineContext): Set<string> {
  const selected = new Set<string>();
  for (const traitId of getRacialTraits(state, context)) {
    const normalized = normalizeSkillId(traitId);
    if (normalized) selected.add(normalized);
  }
  for (const gain of getApplicableClassGains(state, context)) {
    for (const grant of gain.grants) {
      if (grant.kind !== "grantFeature") continue;
      const normalized = normalizeSkillId(String(grant.featureId ?? ""));
      if (normalized) selected.add(normalized);
    }
  }
  return selected;
}
