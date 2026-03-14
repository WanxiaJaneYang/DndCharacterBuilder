import type { AbilityKey } from "./legacyRuntimeTypes";

export interface AttackLine {
  itemId: string;
  name: string;
  attackBonus: number;
  damage: string;
  crit: string;
  range?: string;
}

export interface AttackBonusBreakdown {
  total: number;
  bab: number;
  ability: number;
  size: number;
  misc: number;
}

export interface SheetViewModel {
  combat: {
    ac: {
      total: number;
      components: Array<{
        id: string;
        label: string;
        value: number;
      }>;
      touch: number;
      flatFooted: number;
    };
    attacks: Array<
      AttackLine & {
        category: "melee" | "ranged";
        attackBonusBreakdown: AttackBonusBreakdown;
        damageLine: string;
      }
    >;
  };
  review: {
    identity: {
      level: number;
      xp: number;
      size: string;
      speed: {
        base: number;
        adjusted: number;
      };
    };
    hp: {
      total: number;
      breakdown: {
        hitDie: number;
        con: number;
        misc: number;
      };
    };
    initiative: { total: number; dex: number; misc: number };
    bab: number;
    grapple: { total: number; bab: number; str: number; size: number; misc: number };
    speed: {
      base: number;
      adjusted: number;
    };
    equipmentLoad: {
      selectedItems: string[];
      totalWeight: number;
      loadCategory: "light" | "medium" | "heavy";
      reducesSpeed: boolean;
    };
    movement: {
      base: number;
      adjusted: number;
      reducedByArmorOrLoad: boolean;
    };
    rulesDecisions: {
      featSelectionLimit: number;
      favoredClass: string | null;
      ignoresMulticlassXpPenalty: boolean;
    };
    skillBudget: {
      total: number;
      spent: number;
      remaining: number;
    };
    saves: {
      fort: { total: number; base: number; ability: number; misc: number };
      ref: { total: number; base: number; ability: number; misc: number };
      will: { total: number; base: number; ability: number; misc: number };
    };
    abilities: Record<AbilityKey, { score: number; mod: number }>;
  };
  skills: Array<{
    id: string;
    name: string;
    ranks: number;
    classSkill: boolean;
    abilityKey: AbilityKey;
    abilityMod: number;
    costPerRank: number;
    costSpent: number;
    maxRanks: number;
    racialBonus: number;
    misc: number;
    acp: number;
    acpApplied: boolean;
    total: number;
  }>;
}
