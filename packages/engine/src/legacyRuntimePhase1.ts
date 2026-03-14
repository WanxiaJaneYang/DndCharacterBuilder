import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import { inferAcBreakdown, getGrappleSizeModifier } from "./legacyRuntimeCombatUtils";
import { getEntityDataString, isAttackItem, isRangedWeaponItem } from "./legacyRuntimeEntityData";
import { formatDamageWithModifier, normalizeCritProfile } from "./legacyRuntimeFormatting";
import { classIdBase, classIdLevel } from "./legacyRuntimeProgression";
import type { Phase1Sheet } from "./legacyRuntimeSheetTypes";
import type { AttackLine } from "./legacyRuntimeViewModelTypes";
import type { DecisionSummary, ProvenanceRecord } from "./legacyRuntimeTypes";

export function buildPhase1Sheet(args: {
  state: CharacterState;
  sheet: Record<string, any>;
  provenance: ProvenanceRecord[];
  decisions: DecisionSummary;
  selectedRace: ResolvedEntity | undefined;
  selectedClass: ResolvedEntity | undefined;
  raceId: string | undefined;
  classId: string | undefined;
  finalAbilities: Record<string, { score: number; mod: number }>;
  selectedEquipmentEntities: ResolvedEntity[];
  selectedEquipmentIds: Set<string>;
  selectedEquipmentById: Map<string, ResolvedEntity>;
}): Phase1Sheet {
  const {
    sheet,
    provenance,
    decisions,
    selectedRace,
    selectedClass,
    raceId,
    classId,
    finalAbilities,
    selectedEquipmentEntities,
    selectedEquipmentIds,
    selectedEquipmentById
  } = args;
  const initiativeTotal = Number(sheet.stats.initiative ?? 0);
  const initiativeDex = finalAbilities.dex?.mod ?? 0;
  const initiativeMisc = initiativeTotal - initiativeDex;
  const raceSize = String(selectedRace?.data?.size ?? "medium").trim().toLowerCase();
  const selectedClassLevel = classIdLevel(String(classId ?? ""));
  const selectedClassHitDie = Number(selectedClass?.data?.hitDie ?? 0);
  const hpTotal = Number(sheet.stats.hp ?? 0);
  const hpCon = (finalAbilities.con?.mod ?? 0) * (Number.isFinite(selectedClassLevel) && selectedClassLevel > 0 ? selectedClassLevel : 1);
  const inferredHitDieHp = Number.isFinite(selectedClassHitDie) && selectedClassHitDie > 0
    ? Math.floor(selectedClassHitDie * (Number.isFinite(selectedClassLevel) && selectedClassLevel > 0 ? selectedClassLevel : 1))
    : 0;
  const hpHitDie = inferredHitDieHp > 0 ? Math.min(inferredHitDieHp, Math.max(hpTotal - hpCon, 0)) : Math.max(hpTotal - hpCon, 0);
  const hpMisc = hpTotal - hpHitDie - hpCon;
  const acTotal = Number(sheet.stats.ac ?? 0);
  const acBreakdown = inferAcBreakdown(
    provenance,
    selectedEquipmentIds,
    selectedEquipmentById,
    finalAbilities.dex?.mod ?? 0,
    decisions.sizeModifiers.ac,
    acTotal
  );
  const bab = Number(sheet.stats.bab ?? 0);
  const grapple = {
    total: bab + (finalAbilities.str?.mod ?? 0) + getGrappleSizeModifier(raceSize),
    bab,
    str: finalAbilities.str?.mod ?? 0,
    size: getGrappleSizeModifier(raceSize),
    misc: 0
  };
  sheet.stats.grapple = grapple.total;

  const meleeAttacks: AttackLine[] = [];
  const rangedAttacks: AttackLine[] = [];
  for (const item of selectedEquipmentEntities.filter((entity) => isAttackItem(entity))) {
    const baseLine = { itemId: item.id, name: item.name };
    if (isRangedWeaponItem(item)) {
      const itemRange = getEntityDataString(item, "range");
      rangedAttacks.push({
        ...baseLine,
        attackBonus: bab + (finalAbilities.dex?.mod ?? 0) + decisions.sizeModifiers.attack,
        damage: getEntityDataString(item, "damage") || "1d8",
        crit: normalizeCritProfile(getEntityDataString(item, "crit")),
        ...(itemRange ? { range: itemRange } : {})
      });
      continue;
    }
    meleeAttacks.push({
      ...baseLine,
      attackBonus: bab + (finalAbilities.str?.mod ?? 0) + decisions.sizeModifiers.attack,
      damage: getEntityDataString(item, "damage") || formatDamageWithModifier("1d8", finalAbilities.str?.mod ?? 0),
      crit: normalizeCritProfile(getEntityDataString(item, "crit"))
    });
  }
  if (meleeAttacks.length === 0 && rangedAttacks.length === 0) {
    meleeAttacks.push({
      itemId: "unarmed-strike",
      name: "Unarmed Strike",
      attackBonus: bab + (finalAbilities.str?.mod ?? 0) + decisions.sizeModifiers.attack,
      damage: formatDamageWithModifier("1d3", finalAbilities.str?.mod ?? 0),
      crit: "20/x2"
    });
  }

  return {
    identity: {
      raceId: raceId ?? null,
      classId: classIdBase(classId) ?? null,
      level: selectedClassLevel,
      xp: 0,
      size: raceSize,
      speed: {
        base: Number(selectedRace?.data?.baseSpeed ?? 30),
        adjusted: Number(sheet.stats.speed ?? 30)
      }
    },
    combat: {
      ac: acBreakdown,
      initiative: { total: initiativeTotal, dex: initiativeDex, misc: initiativeMisc },
      grapple,
      attacks: { melee: meleeAttacks, ranged: rangedAttacks },
      saves: {
        fort: { total: Number(sheet.stats.fort ?? 0) + (finalAbilities.con?.mod ?? 0), base: Number(sheet.stats.fort ?? 0), ability: finalAbilities.con?.mod ?? 0, misc: 0 },
        ref: { total: Number(sheet.stats.ref ?? 0) + (finalAbilities.dex?.mod ?? 0), base: Number(sheet.stats.ref ?? 0), ability: finalAbilities.dex?.mod ?? 0, misc: 0 },
        will: { total: Number(sheet.stats.will ?? 0) + (finalAbilities.wis?.mod ?? 0), base: Number(sheet.stats.will ?? 0), ability: finalAbilities.wis?.mod ?? 0, misc: 0 }
      },
      hp: {
        total: hpTotal,
        breakdown: {
          hitDie: hpHitDie,
          con: hpCon,
          misc: hpMisc
        }
      }
    }
  };
}
