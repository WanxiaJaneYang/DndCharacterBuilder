import type {
  DecisionSummary,
  ProvenanceRecord,
  SkillBreakdown,
  UnresolvedRule
} from "./legacyRuntimeTypes";
import type { AttackLine, SheetViewModel } from "./legacyRuntimeViewModelTypes";

export interface Phase1Sheet {
  identity: {
    raceId: string | null;
    classId: string | null;
    level: number;
    xp: number;
    size: string;
    speed: {
      base: number;
      adjusted: number;
    };
  };
  combat: {
    ac: {
      total: number;
      touch: number;
      flatFooted: number;
      breakdown: {
        armor: number;
        shield: number;
        dex: number;
        size: number;
        natural: number;
        deflection: number;
        misc: number;
      };
    };
    initiative: { total: number; dex: number; misc: number };
    grapple: { total: number; bab: number; str: number; size: number; misc: number };
    attacks: {
      melee: AttackLine[];
      ranged: AttackLine[];
    };
    saves: {
      fort: { total: number; base: number; ability: number; misc: number };
      ref: { total: number; base: number; ability: number; misc: number };
      will: { total: number; base: number; ability: number; misc: number };
    };
    hp: {
      total: number;
      breakdown: {
        hitDie: number;
        con: number;
        misc: number;
      };
    };
  };
}

export interface Phase2Sheet {
  feats: Array<{
    id: string;
    name: string;
    summary: string;
  }>;
  traits: Array<{
    source: "race";
    name: string;
    summary: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    ranks: number;
    ability: number;
    racial: number;
    misc: number;
    acp: number;
    acpApplied: boolean;
    total: number;
  }>;
  equipment: {
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
}

export interface CharacterSheet {
  metadata: { name: string };
  abilities: Record<string, { score: number; mod: number }>;
  stats: Record<string, number | string>;
  selections: Record<string, unknown>;
  skills: Record<string, SkillBreakdown>;
  decisions: DecisionSummary;
  phase1: Phase1Sheet;
  phase2: Phase2Sheet;
  sheetViewModel: SheetViewModel;
  provenance: ProvenanceRecord[];
  unresolvedRules: UnresolvedRule[];
  packSetFingerprint: string;
}

export const DEFAULT_STATS = {
  hp: 0,
  ac: 10,
  initiative: 0,
  speed: 30,
  bab: 0,
  fort: 0,
  ref: 0,
  will: 0,
  attackBonus: 0,
  damageBonus: 0
} as const satisfies Record<
  "hp" | "ac" | "initiative" | "speed" | "bab" | "fort" | "ref" | "will" | "attackBonus" | "damageBonus",
  number
>;
