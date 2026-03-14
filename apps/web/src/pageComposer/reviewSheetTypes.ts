import type { AbilityCode, UIText } from "../uiText";

export type ReviewSheetAdjustmentData = { value: string; source: string };
export type ReviewLabelValueRow = { label: string; value: string | number };
export type ReviewSummaryItem = { id: string; name: string; description: string };
export type ReviewStatCard = { label: string; value: string | number };
export type ReviewTableColumn = { key: string; label: string };

export type ReviewHeaderData = {
  title: string;
  characterName: string;
  raceLabel: string;
  selectedRaceName: string;
  classLabel: string;
  selectedClassName: string;
  exportLabel: string;
  provenanceLabel: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
};

export type ReviewIdentitySectionData = { title: string; rows: ReviewLabelValueRow[] };
export type ReviewStatCardsSectionData = { cards: ReviewStatCard[] };
export type ReviewSaveHpRow = { id: string; label: string; base: number; ability: number; adjustments: number; final: number };
export type ReviewAttackRow = { id: string; typeLabel: string; name: string; attackBonus: string; damage: string; crit: string; range: string };
export type ReviewAbilityRow = { id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: number; mod: string };
export type ReviewCombatRow = { id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: string | number };
export type ReviewSkillRow = { id: string; name: string; ranks: string; ability: string; racial: string; misc: string; acp: string; total: string; pointCost: string };

export type ReviewTableSectionData<Row> = {
  title: string;
  caption?: string;
  columns: ReviewTableColumn[];
  rows: Row[];
};

export type ReviewFeaturesSectionData = {
  featTitle: string;
  featSummary: ReviewSummaryItem[];
  traitTitle: string;
  traitSummary: ReviewSummaryItem[];
  emptyLabel: string;
};

export type ReviewSkillsSectionData = ReviewTableSectionData<ReviewSkillRow> & {
  summaryLabel: string;
};

export type ReviewTextSectionData = { title: string; rows: ReviewLabelValueRow[] };
export type ReviewPackInfoSectionData = {
  title: string;
  selectedEditionLabel: string;
  enabledPacksLabel: string;
  fingerprintLabel: string;
  selectedEdition: string;
  enabledPacks: Array<{ packId: string; version: string }>;
  fingerprint: string;
};

export type ReviewProvenanceSectionData = { title: string; json: string };

export interface ReviewSheetData {
  header: ReviewHeaderData;
  identity: ReviewIdentitySectionData;
  statCards: ReviewStatCardsSectionData;
  saveHp: ReviewTableSectionData<ReviewSaveHpRow>;
  attacks: ReviewTableSectionData<ReviewAttackRow>;
  features: ReviewFeaturesSectionData;
  abilities: ReviewTableSectionData<ReviewAbilityRow>;
  combat: ReviewTableSectionData<ReviewCombatRow>;
  skills: ReviewSkillsSectionData;
  equipment: ReviewTextSectionData;
  movement: ReviewTextSectionData;
  decisions: ReviewTextSectionData;
  packInfo: ReviewPackInfoSectionData;
  provenance?: ReviewProvenanceSectionData;
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
