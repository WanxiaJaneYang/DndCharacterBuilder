import type { AbilityCode, UIText } from "../uiText";

export interface ReviewSheetAdjustmentData {
  value: string;
  source: string;
}

export interface ReviewSheetData {
  t: UIText;
  characterName: string;
  selectedRaceName: string;
  selectedClassName: string;
  identityRows: Array<{ label: string; value: string | number }>;
  statCards: Array<{ label: string; value: string | number }>;
  saveHpRows: Array<{ label: string; base: number; ability: number; adjustments: number; final: number }>;
  attackRows: Array<{ id: string; typeLabel: string; name: string; attackBonus: string; damage: string; crit: string; range: string }>;
  featSummary: Array<{ id: string; name: string; description: string }>;
  traitSummary: Array<{ id: string; name: string; description: string }>;
  abilityRows: Array<{ id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: number; mod: string }>;
  combatRows: Array<{ id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: string | number }>;
  skillsSummary: { spent: number; total: number; remaining: number };
  skillsRows: Array<{ id: string; name: string; ranks: string; ability: string; racial: string; misc: string; acp: string; total: string; pointCost: string }>;
  equipmentLoad: { selectedItems: string; totalWeight: number; loadCategory: string; speedImpact: string };
  movementDetail: { base: number; adjusted: number; notes: string };
  rulesDecisions: { favoredClass: string; ignoresMulticlassXpPenalty: string; featSelectionLimit: number };
  packInfo: { selectedEdition: string; enabledPacks: Array<{ packId: string; version: string }>; fingerprint: string };
  showProvenance: boolean;
  provenanceJson: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
}

export type BuildReviewSheetDataArgs = {
  t: UIText;
  characterName?: string;
  selectedRaceName: string;
  selectedClassName: string;
  reviewData: {
    identity: { level: number; xp: number; size: string; speed: { base: number; adjusted: number } };
    hp: { total: number; breakdown: { hitDie: number; con: number; misc: number } };
    initiative: { total: number };
    bab: number;
    saves: { fort: { base: number; ability: number; misc: number; total: number }; ref: { base: number; ability: number; misc: number; total: number }; will: { base: number; ability: number; misc: number; total: number } };
    grapple: { total: number };
    abilities: Partial<Record<AbilityCode, { score?: number; mod?: number }>>;
    skillBudget: { spent: number; total: number; remaining: number };
    equipmentLoad: { selectedItems: string[]; totalWeight: number; loadCategory: "light" | "medium" | "heavy"; reducesSpeed: boolean };
    speed: { base: number; adjusted: number };
    movement: { reducedByArmorOrLoad: boolean };
    rulesDecisions: { favoredClass?: string | null; ignoresMulticlassXpPenalty: boolean; featSelectionLimit: number };
  };
  reviewCombat: { ac: { total: number; touch: number; flatFooted: number }; attacks: Array<{ category: "melee" | "ranged"; itemId: string; name: string; attackBonus: number; damageLine: string; crit: string; range?: string }> };
  selectedFeats: string[];
  featsById: Record<string, { name?: string; summary?: string; description?: string } | undefined>;
  racialTraits: Array<Record<string, unknown>>;
  skills: Array<{ id: string; name: string; ranks: number; racialBonus: number; total: number; abilityMod: number; abilityKey: AbilityCode; misc: number; acp: number; costSpent: number; costPerRank: number }>;
  baseAbilityScores: Record<string, number>;
  provenanceByTargetPath: Map<string, Array<{ delta?: number; setValue?: number; source: { packId: string; entityId: string } }>>;
  formatSourceLabel: (packId: string, entityId: string) => string;
  localizeAbilityLabel: (ability: AbilityCode) => string;
  localizeEntityText: (entityType: string, entityId: string, path: string, fallback: string) => string;
  enabledPackIds: string[];
  packVersionById: Map<string, string>;
  selectedEditionLabel: string;
  fingerprint: string;
  localizeLoadCategory: (category: "light" | "medium" | "heavy") => string;
  formatSpeedImpact: (adjustedSpeed: number, reducesSpeed: boolean) => string;
  formatMovementNotes: (reducedByArmorOrLoad: boolean) => string[];
  showProvenance: boolean;
  provenanceJson: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
};
