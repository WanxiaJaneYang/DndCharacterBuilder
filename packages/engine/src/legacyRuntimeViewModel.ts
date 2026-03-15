import {
  ABILITY_KEYS,
  type AbilityKey
} from "./legacyRuntimeTypes";
import type { CharacterSheet } from "./legacyRuntimeSheetTypes";
import type { SheetViewModel } from "./legacyRuntimeViewModelTypes";
import { formatDamageWithModifier } from "./legacyRuntimeFormatting";

function appendAttackLineMetadata<T extends { itemId: string }>(
  category: "melee" | "ranged",
  attacks: T[]
): Array<T & { id: string; sequence: number }> {
  const counts = new Map<string, number>();

  return attacks.map((attack) => {
    const key = `${category}:${attack.itemId}`;
    const sequence = (counts.get(key) ?? 0) + 1;
    counts.set(key, sequence);

    const attackLine = { ...attack } as T & { id: string; sequence: number };
    Object.defineProperties(attackLine, {
      id: {
        value: `${key}:${sequence}`,
        enumerable: false
      },
      sequence: {
        value: sequence,
        enumerable: false
      }
    });

    return attackLine;
  });
}

export function buildSheetViewModel(
  characterSheet: Pick<CharacterSheet, "abilities" | "phase1" | "phase2" | "skills" | "decisions">
): SheetViewModel {
  const ac = characterSheet.phase1.combat.ac;
  const acBase =
    ac.total
    - ac.breakdown.armor
    - ac.breakdown.shield
    - ac.breakdown.dex
    - ac.breakdown.size
    - ac.breakdown.natural
    - ac.breakdown.deflection
    - ac.breakdown.misc;
  const bab = characterSheet.phase1.combat.grapple.bab;
  const meleeAbility = characterSheet.phase1.combat.grapple.str;
  const rangedAbility = characterSheet.phase1.combat.initiative.dex;
  const attackSizeModifier = characterSheet.decisions.sizeModifiers.attack;

  return {
    combat: {
      ac: {
        total: ac.total,
        components: [
          { id: "base", label: "Base", value: acBase },
          { id: "armor", label: "Armor", value: ac.breakdown.armor },
          { id: "shield", label: "Shield", value: ac.breakdown.shield },
          { id: "dex", label: "Dex", value: ac.breakdown.dex },
          { id: "size", label: "Size", value: ac.breakdown.size },
          { id: "natural", label: "Natural", value: ac.breakdown.natural },
          { id: "deflection", label: "Deflection", value: ac.breakdown.deflection },
          { id: "misc", label: "Misc", value: ac.breakdown.misc }
        ],
        touch: ac.touch,
        flatFooted: ac.flatFooted
      },
      attacks: [
        ...appendAttackLineMetadata("melee", characterSheet.phase1.combat.attacks.melee.map((attack) => {
          const misc = attack.attackBonus - bab - meleeAbility - attackSizeModifier;
          return {
            ...attack,
            category: "melee" as const,
            attackBonusBreakdown: {
              total: attack.attackBonus,
              bab,
              ability: meleeAbility,
              size: attackSizeModifier,
              misc
            },
            damageLine: /[+-]\d+$/.test(attack.damage)
              ? attack.damage
              : formatDamageWithModifier(attack.damage, meleeAbility)
          };
        })),
        ...appendAttackLineMetadata("ranged", characterSheet.phase1.combat.attacks.ranged.map((attack) => {
          const misc = attack.attackBonus - bab - rangedAbility - attackSizeModifier;
          return {
            ...attack,
            category: "ranged" as const,
            attackBonusBreakdown: {
              total: attack.attackBonus,
              bab,
              ability: rangedAbility,
              size: attackSizeModifier,
              misc
            },
            damageLine: attack.damage
          };
        }))
      ]
    },
    review: {
      identity: {
        level: characterSheet.phase1.identity.level,
        xp: characterSheet.phase1.identity.xp,
        size: characterSheet.phase1.identity.size,
        speed: characterSheet.phase1.identity.speed
      },
      hp: characterSheet.phase1.combat.hp,
      initiative: characterSheet.phase1.combat.initiative,
      bab: characterSheet.phase1.combat.grapple.bab,
      grapple: characterSheet.phase1.combat.grapple,
      speed: characterSheet.phase1.identity.speed,
      equipmentLoad: characterSheet.phase2.equipment,
      movement: characterSheet.phase2.movement,
      rulesDecisions: {
        featSelectionLimit: characterSheet.decisions.featSelectionLimit,
        favoredClass: characterSheet.decisions.favoredClass,
        ignoresMulticlassXpPenalty: characterSheet.decisions.ignoresMulticlassXpPenalty
      },
      skillBudget: {
        total: characterSheet.decisions.skillPoints.total,
        spent: characterSheet.decisions.skillPoints.spent,
        remaining: characterSheet.decisions.skillPoints.remaining
      },
      saves: characterSheet.phase1.combat.saves,
      abilities: ABILITY_KEYS.reduce((result, ability) => {
        result[ability] = {
          score: Number(characterSheet.abilities[ability]?.score ?? 10),
          mod: Number(characterSheet.abilities[ability]?.mod ?? 0)
        };
        return result;
      }, {} as Record<AbilityKey, { score: number; mod: number }>)
    },
    skills: characterSheet.phase2.skills.map((skill) => {
      const detail = characterSheet.skills[skill.id];
      return {
        id: skill.id,
        name: skill.name,
        ranks: skill.ranks,
        classSkill: detail?.classSkill ?? detail?.isClassSkill ?? false,
        abilityKey: detail?.ability ?? "str",
        abilityMod: skill.ability,
        costPerRank: detail?.costPerRank ?? 1,
        costSpent: detail?.costSpent ?? skill.ranks,
        maxRanks: detail?.maxRanks ?? skill.ranks,
        racialBonus: detail?.racialBonus ?? skill.racial,
        misc: skill.misc,
        miscBreakdown: detail?.miscBreakdown ?? [],
        acp: skill.acp,
        acpApplied: skill.acpApplied,
        total: skill.total
      };
    })
  };
}
