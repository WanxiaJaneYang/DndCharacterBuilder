import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import { getItemArmorCheckPenalty, getItemWeight, skillIsAffectedByArmorCheckPenalty } from "./legacyRuntimeEntityData";
import { getSrdMediumLoadLimits } from "./legacyRuntimeCombatUtils";
import type { Phase2Sheet } from "./legacyRuntimeSheetTypes";
import type { DecisionSummary, SkillBreakdown } from "./legacyRuntimeTypes";

export function buildPhase2Sheet(args: {
  state: CharacterState;
  selectedRace: ResolvedEntity | undefined;
  selectedEquipmentEntities: ResolvedEntity[];
  finalAbilities: Record<string, { score: number; mod: number }>;
  decisions: DecisionSummary;
  skills: Record<string, SkillBreakdown>;
  entityBuckets: Record<string, Record<string, ResolvedEntity>>;
  sheet: Record<string, any>;
}): Phase2Sheet {
  const { state, selectedRace, selectedEquipmentEntities, finalAbilities, decisions, skills, entityBuckets, sheet } = args;
  const selectedFeatIds = ((state.selections.feats as string[] | undefined) ?? []).map((featId) => String(featId));
  const selectedEquipment = ((state.selections.equipment as string[] | undefined) ?? []).map((itemId) => String(itemId));
  const totalWeight = selectedEquipmentEntities.reduce((sum, item) => sum + getItemWeight(item), 0);
  const strScore = Number(finalAbilities.str?.score ?? 10);
  const carryingMultiplier = Number(decisions.sizeModifiers.carryingCapacityMultiplier ?? 1);
  const srdLimits = getSrdMediumLoadLimits(strScore);
  const lightLoadLimit = srdLimits.light * carryingMultiplier;
  const mediumLoadLimit = srdLimits.medium * carryingMultiplier;
  const acpPenalty = selectedEquipmentEntities.reduce((sum, item) => sum + getItemArmorCheckPenalty(item), 0);
  const adjustedSpeed = Number(sheet.stats.speed ?? 30);
  const baseSpeed = Number(selectedRace?.data?.baseSpeed ?? 30);

  return {
    feats: selectedFeatIds.map((featId) => {
      const feat = entityBuckets.feats?.[featId];
      return { id: featId, name: feat?.name ?? featId, summary: feat?.summary ?? feat?.description ?? featId };
    }),
    traits: (((selectedRace?.data?.racialTraits as Array<{ name?: unknown; description?: unknown }> | undefined) ?? [])
      .map((trait) => ({
        source: "race" as const,
        name: String(trait.name ?? "").trim(),
        summary: String(trait.description ?? "").trim()
      }))
      .filter((trait) => trait.name.length > 0 || trait.summary.length > 0)),
    skills: Object.entries(skills)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([skillId, skill]) => {
        const skillEntity = entityBuckets.skills?.[skillId];
        const acpApplied = skillIsAffectedByArmorCheckPenalty(skillEntity);
        const acp = acpApplied ? acpPenalty : 0;
        return {
          id: skillId,
          name: skill.name,
          ranks: skill.ranks,
          ability: skill.abilityMod,
          racial: skill.racialBonus,
          misc: skill.miscBonus,
          acp,
          acpApplied,
          total: skill.total + acp
        };
      }),
    equipment: {
      selectedItems: selectedEquipment,
      totalWeight,
      loadCategory: totalWeight <= lightLoadLimit ? "light" : totalWeight <= mediumLoadLimit ? "medium" : "heavy",
      reducesSpeed: adjustedSpeed < baseSpeed
    },
    movement: {
      base: baseSpeed,
      adjusted: adjustedSpeed,
      reducedByArmorOrLoad: adjustedSpeed < baseSpeed
    }
  };
}
