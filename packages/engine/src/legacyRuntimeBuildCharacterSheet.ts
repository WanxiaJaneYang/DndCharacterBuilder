import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import { buildDecisionSummary, buildSkillBreakdown } from "./legacyRuntimeDecisions";
import { abilityMod } from "./legacyRuntimeExpression";
import { buildPhase1Sheet } from "./legacyRuntimePhase1";
import { buildPhase2Sheet } from "./legacyRuntimePhase2";
import { getCharacterLevel, parseClassProgressionGains } from "./legacyRuntimeProgression";
import { buildConditionalSkillBonusData, collectUnresolvedRules } from "./legacyRuntimeRuleSurface";
import { DEFAULT_STATS, type CharacterSheet } from "./legacyRuntimeSheetTypes";
import { buildRacialSkillBonusMap, buildEffectSkillBonusBreakdown, buildEffectSkillBonusMap, mergeSkillBonusBreakdownMaps } from "./legacyRuntimeSkillBonusMaps";
import { getSelectedClass, getSelectedFeatIds, getSelectedRace } from "./legacyRuntimeSelectors";
import type { EngineContext, ProvenanceRecord } from "./legacyRuntimeTypes";
import { buildSheetViewModel } from "./legacyRuntimeViewModel";
import { applyEffect } from "./legacyRuntimeCombatUtils";

export function buildCharacterSheetFromState(state: CharacterState, context: EngineContext): CharacterSheet {
  const sheet: Record<string, any> = {
    metadata: { name: state.metadata.name ?? "" },
    abilities: Object.fromEntries(Object.entries(state.abilities).map(([key, score]) => [key, { score, mod: abilityMod(score) }])),
    stats: { ...DEFAULT_STATS },
    selections: state.selections
  };
  const provenance: ProvenanceRecord[] = [];
  const entityBuckets = context.resolvedData.entities;
  const raceId = state.selections.race as string | undefined;
  const classId = state.selections.class as string | undefined;
  const selectedRace = getSelectedRace(state, context);
  const selectedClass = getSelectedClass(state, context);

  const applyEntity = (entity: ResolvedEntity | undefined): void => {
    if (!entity?.effects) return;
    const source = { packId: entity._source.packId, entityId: entity._source.entityId };
    entity.effects.forEach((effect) => applyEffect(effect, sheet, provenance, source));
  };

  const applyClassProgressionEffects = (entity: ResolvedEntity | undefined): boolean => {
    if (!entity) return false;
    const gains = parseClassProgressionGains(entity).filter((gain) => gain.level <= getCharacterLevel(state));
    let appliedAny = false;
    for (const gain of gains) {
      if (gain.effects.length === 0) continue;
      const source = { packId: entity._source.packId, entityId: entity._source.entityId, choiceStepId: `class-level-${gain.level}` };
      gain.effects.forEach((effect) => applyEffect(effect, sheet, provenance, source));
      appliedAny = true;
    }
    return appliedAny;
  };

  Object.values(entityBuckets.rules ?? {}).sort((a, b) => a.id.localeCompare(b.id)).forEach(applyEntity);
  applyEntity(raceId ? entityBuckets.races?.[raceId] : undefined);
  if (!applyClassProgressionEffects(selectedClass)) applyEntity(selectedClass);
  getSelectedFeatIds(state).forEach((featId) => applyEntity(entityBuckets.feats?.[featId]));
  (((state.selections.equipment as string[] | undefined) ?? [])).forEach((itemId) => applyEntity(entityBuckets.items?.[itemId]));

  const finalAbilities = sheet.abilities as Record<string, { score: number; mod: number }>;
  Object.values(finalAbilities).forEach((ability) => { ability.mod = abilityMod(ability.score); });
  const decisions = buildDecisionSummary(state, context, finalAbilities);
  sheet.stats.ac = Number(sheet.stats.ac ?? 0) + decisions.sizeModifiers.ac;
  sheet.stats.attackBonus = (sheet.stats.bab as number) + (finalAbilities.str?.mod ?? 0) + decisions.sizeModifiers.attack;
  sheet.stats.damageBonus = finalAbilities.str?.mod ?? 0;

  const selectedEquipmentEntities = (((state.selections.equipment as string[] | undefined) ?? [])
    .map((itemId) => entityBuckets.items?.[itemId])
    .filter((entity): entity is ResolvedEntity => Boolean(entity)));
  const selectedEquipmentIds = new Set((((state.selections.equipment as string[] | undefined) ?? []).map((itemId) => String(itemId).trim().toLowerCase())));
  const selectedEquipmentById = new Map(selectedEquipmentEntities.map((item) => [item.id.trim().toLowerCase(), item] as const));

  const phase1 = buildPhase1Sheet({
    state, sheet, provenance, decisions, selectedRace, selectedClass, raceId, classId,
    finalAbilities, selectedEquipmentEntities, selectedEquipmentIds, selectedEquipmentById
  });
  const effectSkillBonuses = buildEffectSkillBonusMap(sheet);
  const conditionalSkillBonusData = buildConditionalSkillBonusData(state, context);
  const combinedSkillBonuses: Record<string, number> = { ...effectSkillBonuses };
  Object.entries(conditionalSkillBonusData.totals).forEach(([skillId, bonus]) => { combinedSkillBonuses[skillId] = (combinedSkillBonuses[skillId] ?? 0) + bonus; });
  const skills = buildSkillBreakdown(
    state,
    context,
    finalAbilities,
    decisions,
    combinedSkillBonuses,
    mergeSkillBonusBreakdownMaps(buildEffectSkillBonusBreakdown(provenance), conditionalSkillBonusData.breakdown),
    buildRacialSkillBonusMap(state, context)
  );
  const phase2 = buildPhase2Sheet({ state, selectedRace, selectedEquipmentEntities, finalAbilities, decisions, skills, entityBuckets, sheet });
  const unresolvedRules = collectUnresolvedRules(state, context);

  return {
    metadata: { name: sheet.metadata.name },
    abilities: finalAbilities,
    stats: sheet.stats,
    selections: state.selections,
    skills,
    decisions,
    phase1,
    phase2,
    sheetViewModel: buildSheetViewModel({ abilities: finalAbilities, phase1, phase2, skills, decisions }),
    provenance,
    unresolvedRules,
    packSetFingerprint: context.resolvedData.fingerprint
  };
}

export function finalizeCharacter(state: CharacterState, context: EngineContext): CharacterSheet {
  return buildCharacterSheetFromState(state, context);
}
