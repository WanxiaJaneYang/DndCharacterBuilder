import { DEFAULT_STATS } from "@dcb/engine";
import type {
  BuildReviewSheetDataArgs,
  ReviewAbilityRow,
  ReviewAttackRow,
  ReviewCombatRow,
  ReviewHeaderData,
  ReviewLabelValueRow,
  ReviewSaveHpRow,
  ReviewSheetAdjustmentData,
  ReviewSkillRow,
  ReviewSummaryItem,
} from "./reviewSheetTypes";

const REVIEW_ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
const REVIEW_STAT_ORDER = ["hp", "ac", "initiative", "bab", "fort", "ref", "will"] as const;
type ReviewCombatStatKey = (typeof REVIEW_STAT_ORDER)[number];
type ProvenanceRecord = { delta?: number; setValue?: number; source: { packId: string; entityId: string } };
type ReviewSkillVisibilityRecord = {
  ranks: number;
  total: number;
  abilityMod: number;
  racialBonus: number;
  misc: number;
  acp: number;
};

const REVIEW_STAT_DEFAULTS: Record<ReviewCombatStatKey, number> = { hp: DEFAULT_STATS.hp, ac: DEFAULT_STATS.ac, initiative: DEFAULT_STATS.initiative, bab: DEFAULT_STATS.bab, fort: DEFAULT_STATS.fort, ref: DEFAULT_STATS.ref, will: DEFAULT_STATS.will };
const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
const formatSkillValue = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}`;

export function isVisibleReviewSkill(skill: ReviewSkillVisibilityRecord): boolean {
  return skill.ranks > 0 || skill.total !== 0 || skill.abilityMod !== 0 || skill.racialBonus !== 0 || skill.misc !== 0 || skill.acp !== 0;
}

export function selectReviewHeaderData(args: BuildReviewSheetDataArgs): ReviewHeaderData {
  return { title: args.t.REVIEW, characterName: args.characterName || args.t.UNNAMED_CHARACTER, raceLabel: args.t.RACE_LABEL, selectedRaceName: args.selectedRaceName, classLabel: args.t.CLASS_LABEL, selectedClassName: args.selectedClassName, exportLabel: args.t.EXPORT_JSON, provenanceLabel: args.t.TOGGLE_PROVENANCE, onExportJson: args.onExportJson, onToggleProvenance: args.onToggleProvenance };
}

export function selectReviewIdentityRows(args: BuildReviewSheetDataArgs): ReviewLabelValueRow[] {
  return [{ label: args.t.REVIEW_LEVEL_LABEL, value: args.reviewData.identity.level }, { label: args.t.REVIEW_XP_LABEL, value: args.reviewData.identity.xp }, { label: args.t.REVIEW_SIZE_LABEL, value: args.reviewData.identity.size }, { label: args.t.REVIEW_SPEED_BASE_LABEL, value: args.reviewData.identity.speed.base }, { label: args.t.REVIEW_SPEED_ADJUSTED_LABEL, value: args.reviewData.identity.speed.adjusted }];
}

export function selectReviewStatCards(args: BuildReviewSheetDataArgs): ReviewLabelValueRow[] {
  return [{ label: args.t.REVIEW_AC_LABEL, value: args.reviewCombat.ac.total }, { label: args.t.REVIEW_AC_TOUCH_LABEL, value: args.reviewCombat.ac.touch }, { label: args.t.REVIEW_AC_FLAT_FOOTED_LABEL, value: args.reviewCombat.ac.flatFooted }, { label: args.t.REVIEW_HP_LABEL, value: args.reviewData.hp.total }, { label: args.t.REVIEW_INITIATIVE_LABEL, value: args.reviewData.initiative.total }, { label: args.t.REVIEW_GRAPPLE_LABEL, value: args.reviewData.grapple.total }];
}

export function selectReviewSaveHpRows(args: BuildReviewSheetDataArgs): ReviewSaveHpRow[] {
  return [{ id: "fort", label: args.t.REVIEW_FORT_LABEL, base: args.reviewData.saves.fort.base, ability: args.reviewData.saves.fort.ability, adjustments: args.reviewData.saves.fort.misc, final: args.reviewData.saves.fort.total }, { id: "ref", label: args.t.REVIEW_REF_LABEL, base: args.reviewData.saves.ref.base, ability: args.reviewData.saves.ref.ability, adjustments: args.reviewData.saves.ref.misc, final: args.reviewData.saves.ref.total }, { id: "will", label: args.t.REVIEW_WILL_LABEL, base: args.reviewData.saves.will.base, ability: args.reviewData.saves.will.ability, adjustments: args.reviewData.saves.will.misc, final: args.reviewData.saves.will.total }, { id: "hp", label: args.t.REVIEW_HP_LABEL, base: args.reviewData.hp.breakdown.hitDie, ability: args.reviewData.hp.breakdown.con, adjustments: args.reviewData.hp.breakdown.misc, final: args.reviewData.hp.total }];
}

export function selectReviewAttackRows(args: BuildReviewSheetDataArgs): ReviewAttackRow[] {
  return args.reviewCombat.attacks.map((attack) => ({ id: `${attack.category}-${attack.itemId}`, typeLabel: attack.category === "melee" ? args.t.REVIEW_ATTACK_MELEE_LABEL : args.t.REVIEW_ATTACK_RANGED_LABEL, name: attack.name, attackBonus: formatSigned(attack.attackBonus), damage: attack.damageLine, crit: attack.crit, range: attack.category === "ranged" ? attack.range ?? "-" : "-" }));
}

export function selectReviewSummaryItems(args: BuildReviewSheetDataArgs) {
  const featSummary: ReviewSummaryItem[] = args.selectedFeats.map((featId) => ({ id: featId, name: args.featsById[featId]?.name ?? featId, description: args.featsById[featId]?.summary ?? args.featsById[featId]?.description ?? featId }));
  const traitSummary: ReviewSummaryItem[] = args.racialTraits.map((trait, index) => ({ id: `${String(trait.name ?? "")}-${index}`, name: String(trait.name ?? ""), description: String(trait.description ?? "").trim() }));
  return { featSummary, traitSummary };
}

export function selectReviewAbilityRows(args: BuildReviewSheetDataArgs): ReviewAbilityRow[] {
  return REVIEW_ABILITY_ORDER.map((ability) => ({ id: ability, label: args.localizeAbilityLabel(ability), base: Number(args.baseAbilityScores[ability] ?? 10), adjustments: selectAdjustmentRows(args.provenanceByTargetPath.get(`abilities.${ability}.score`) ?? [], args), final: args.reviewData.abilities[ability]?.score ?? Number(args.baseAbilityScores[ability] ?? 10), mod: formatSigned(args.reviewData.abilities[ability]?.mod ?? 0) }));
}

export function selectReviewCombatRows(args: BuildReviewSheetDataArgs): ReviewCombatRow[] {
  const labels: Record<ReviewCombatStatKey, string> = { hp: args.t.REVIEW_HP_LABEL, ac: args.t.REVIEW_AC_LABEL, initiative: args.t.REVIEW_INITIATIVE_LABEL, bab: args.t.REVIEW_BAB_LABEL, fort: args.t.REVIEW_FORT_LABEL, ref: args.t.REVIEW_REF_LABEL, will: args.t.REVIEW_WILL_LABEL };
  const values = { hp: args.reviewData.hp.total, ac: args.reviewCombat.ac.total, initiative: args.reviewData.initiative.total, bab: args.reviewData.bab, fort: args.reviewData.saves.fort.total, ref: args.reviewData.saves.ref.total, will: args.reviewData.saves.will.total } as const;
  return REVIEW_STAT_ORDER.map((statKey) => buildCombatRow(args, statKey, labels[statKey], values[statKey]));
}

export function selectReviewSkillsRows(args: Pick<BuildReviewSheetDataArgs, "localizeAbilityLabel" | "localizeEntityText" | "skills" | "t">): ReviewSkillRow[] {
  return [...args.skills].filter(isVisibleReviewSkill).sort((left, right) => right.total - left.total || args.localizeEntityText("skills", left.id, "name", left.name).localeCompare(args.localizeEntityText("skills", right.id, "name", right.name))).map((skill) => ({ id: skill.id, name: args.localizeEntityText("skills", skill.id, "name", skill.name), ranks: formatSkillValue(skill.ranks), ability: `${formatSigned(skill.abilityMod)} (${args.localizeAbilityLabel(skill.abilityKey)})`, racial: formatSigned(skill.racialBonus), misc: formatSigned(skill.misc), acp: formatSigned(skill.acp), total: formatSkillValue(skill.total), pointCost: `${formatSkillValue(skill.costSpent)} (${skill.costPerRank}${args.t.REVIEW_PER_RANK_UNIT})` }));
}

export function selectReviewEquipmentRows(args: BuildReviewSheetDataArgs): ReviewLabelValueRow[] {
  return [{ label: args.t.REVIEW_SELECTED_ITEMS_LABEL, value: args.reviewData.equipmentLoad.selectedItems.length > 0 ? args.reviewData.equipmentLoad.selectedItems.map((itemId) => args.localizeEntityText("items", itemId, "name", itemId)).join(", ") : "-" }, { label: args.t.REVIEW_TOTAL_WEIGHT_LABEL, value: args.reviewData.equipmentLoad.totalWeight }, { label: args.t.REVIEW_LOAD_CATEGORY_LABEL, value: args.localizeLoadCategory(args.reviewData.equipmentLoad.loadCategory) }, { label: args.t.REVIEW_SPEED_IMPACT_LABEL, value: args.formatSpeedImpact(args.reviewData.speed.adjusted, args.reviewData.equipmentLoad.reducesSpeed) }];
}

export function selectReviewMovementRows(args: BuildReviewSheetDataArgs): ReviewLabelValueRow[] {
  return [{ label: args.t.REVIEW_SPEED_BASE_LABEL, value: args.reviewData.speed.base }, { label: args.t.REVIEW_SPEED_ADJUSTED_LABEL, value: args.reviewData.speed.adjusted }, { label: args.t.REVIEW_MOVEMENT_NOTES_LABEL, value: args.formatMovementNotes(args.reviewData.movement.reducedByArmorOrLoad).join("; ") }];
}

export function selectReviewDecisionRows(args: BuildReviewSheetDataArgs): ReviewLabelValueRow[] {
  return [{ label: args.t.REVIEW_FAVORED_CLASS_LABEL, value: args.reviewData.rulesDecisions.favoredClass ? (args.reviewData.rulesDecisions.favoredClass === "any" ? args.t.REVIEW_FAVORED_CLASS_ANY : args.localizeEntityText("classes", args.reviewData.rulesDecisions.favoredClass, "name", args.reviewData.rulesDecisions.favoredClass)) : args.t.REVIEW_UNRESOLVED_LABEL }, { label: args.t.REVIEW_MULTICLASS_XP_IGNORED_LABEL, value: args.reviewData.rulesDecisions.ignoresMulticlassXpPenalty ? args.t.REVIEW_YES : args.t.REVIEW_NO }, { label: args.t.REVIEW_FEAT_SLOTS_LABEL, value: args.reviewData.rulesDecisions.featSelectionLimit }];
}

function selectAdjustmentRows(records: ProvenanceRecord[], args: Pick<BuildReviewSheetDataArgs, "formatSourceLabel">): ReviewSheetAdjustmentData[] {
  return records.map((record) => ({ value: record.delta !== undefined ? formatSigned(record.delta) : `= ${record.setValue ?? 0}`, source: args.formatSourceLabel(record.source.packId, record.source.entityId) }));
}

function buildCombatRow(args: BuildReviewSheetDataArgs, statKey: ReviewCombatStatKey, label: string, finalValue: string | number): ReviewCombatRow {
  const records = args.provenanceByTargetPath.get(`stats.${statKey}`) ?? [];
  const firstSetIndex = records.findIndex((record) => record.setValue !== undefined);
  return { id: statKey, label, base: firstSetIndex >= 0 ? Number(records[firstSetIndex]?.setValue ?? REVIEW_STAT_DEFAULTS[statKey]) : REVIEW_STAT_DEFAULTS[statKey], adjustments: selectAdjustmentRows(records.filter((_, index) => index !== firstSetIndex), args), final: String(finalValue) };
}
