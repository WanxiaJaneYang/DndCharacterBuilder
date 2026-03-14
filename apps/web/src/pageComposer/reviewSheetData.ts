import type { BuildReviewSheetDataArgs, ReviewSheetData } from "./reviewSheetTypes";
import {
  selectReviewAbilityRows,
  selectReviewAttackRows,
  selectReviewCombatRows,
  selectReviewDecisionRows,
  selectReviewEquipmentRows,
  selectReviewHeaderData,
  selectReviewIdentityRows,
  selectReviewMovementRows,
  selectReviewSaveHpRows,
  selectReviewSkillsRows,
  selectReviewStatCards,
  selectReviewSummaryItems,
} from "./reviewSheetSelectors";

export { selectReviewSkillsRows } from "./reviewSheetSelectors";

export function buildReviewSheetData(args: BuildReviewSheetDataArgs): ReviewSheetData {
  const { featSummary, traitSummary } = selectReviewSummaryItems(args);

  return {
    header: selectReviewHeaderData(args),
    identity: { title: args.t.REVIEW_IDENTITY_PROGRESSION, rows: selectReviewIdentityRows(args) },
    statCards: { cards: selectReviewStatCards(args) },
    saveHp: {
      title: args.t.REVIEW_SAVE_HP_BREAKDOWN,
      columns: [
        { key: "label", label: args.t.REVIEW_STAT_COLUMN },
        { key: "base", label: args.t.REVIEW_BASE_COLUMN },
        { key: "ability", label: args.t.REVIEW_ABILITY_COLUMN },
        { key: "adjustments", label: args.t.REVIEW_ADJUSTMENTS_COLUMN },
        { key: "final", label: args.t.REVIEW_FINAL_COLUMN },
      ],
      rows: selectReviewSaveHpRows(args),
    },
    attacks: {
      title: args.t.REVIEW_ATTACK_LINES,
      columns: [
        { key: "typeLabel", label: args.t.REVIEW_ATTACK_TYPE_COLUMN },
        { key: "name", label: args.t.REVIEW_ATTACK_ITEM_COLUMN },
        { key: "attackBonus", label: args.t.REVIEW_ATTACK_BONUS_COLUMN },
        { key: "damage", label: args.t.REVIEW_DAMAGE_COLUMN },
        { key: "crit", label: args.t.REVIEW_CRIT_COLUMN },
        { key: "range", label: args.t.REVIEW_RANGE_COLUMN },
      ],
      rows: selectReviewAttackRows(args),
    },
    features: {
      featTitle: args.t.REVIEW_FEAT_SUMMARY,
      featSummary,
      traitTitle: args.t.REVIEW_TRAIT_SUMMARY,
      traitSummary,
      emptyLabel: "-",
    },
    abilities: {
      title: args.t.REVIEW_ABILITY_BREAKDOWN,
      caption: args.t.REVIEW_ABILITY_TABLE_CAPTION,
      columns: [
        { key: "label", label: args.t.REVIEW_ABILITY_COLUMN },
        { key: "base", label: args.t.REVIEW_BASE_COLUMN },
        { key: "adjustments", label: args.t.REVIEW_ADJUSTMENTS_COLUMN },
        { key: "final", label: args.t.REVIEW_FINAL_COLUMN },
        { key: "mod", label: args.t.REVIEW_MODIFIER_COLUMN },
      ],
      rows: selectReviewAbilityRows(args),
    },
    combat: {
      title: args.t.REVIEW_COMBAT_BREAKDOWN,
      caption: args.t.REVIEW_COMBAT_TABLE_CAPTION,
      columns: [
        { key: "label", label: args.t.REVIEW_STAT_COLUMN },
        { key: "base", label: args.t.REVIEW_BASE_COLUMN },
        { key: "adjustments", label: args.t.REVIEW_ADJUSTMENTS_COLUMN },
        { key: "final", label: args.t.REVIEW_FINAL_COLUMN },
      ],
      rows: selectReviewCombatRows(args),
    },
    skills: {
      title: args.t.REVIEW_SKILLS_BREAKDOWN,
      caption: args.t.REVIEW_SKILLS_TABLE_CAPTION,
      summaryLabel: `${args.t.REVIEW_POINTS_SPENT_LABEL} ${args.reviewData.skillBudget.spent} / ${args.reviewData.skillBudget.total} (${args.reviewData.skillBudget.remaining} ${args.t.REVIEW_REMAINING_LABEL})`,
      columns: [
        { key: "name", label: args.t.REVIEW_SKILL_COLUMN },
        { key: "ranks", label: args.t.REVIEW_RANKS_COLUMN },
        { key: "ability", label: args.t.REVIEW_ABILITY_COLUMN },
        { key: "racial", label: args.t.REVIEW_RACIAL_COLUMN },
        { key: "misc", label: args.t.REVIEW_MISC_COLUMN },
        { key: "acp", label: args.t.REVIEW_ACP_COLUMN },
        { key: "total", label: args.t.REVIEW_TOTAL_COLUMN },
        { key: "pointCost", label: args.t.REVIEW_POINT_COST_COLUMN },
      ],
      rows: selectReviewSkillsRows(args),
    },
    equipment: { title: args.t.REVIEW_EQUIPMENT_LOAD, rows: selectReviewEquipmentRows(args) },
    movement: { title: args.t.REVIEW_MOVEMENT_DETAIL, rows: selectReviewMovementRows(args) },
    decisions: { title: args.t.REVIEW_RULES_DECISIONS, rows: selectReviewDecisionRows(args) },
    packInfo: {
      title: args.t.REVIEW_PACK_INFO,
      selectedEditionLabel: args.t.REVIEW_SELECTED_EDITION_LABEL,
      enabledPacksLabel: args.t.REVIEW_ENABLED_PACKS_LABEL,
      fingerprintLabel: args.t.REVIEW_FINGERPRINT_LABEL,
      selectedEdition: args.selectedEditionLabel || "-",
      enabledPacks: args.enabledPackIds.map((packId) => ({
        packId,
        version: args.packVersionById.get(packId) ?? args.t.REVIEW_UNKNOWN_VERSION,
      })),
      fingerprint: args.fingerprint,
    },
    provenance: args.showProvenance
      ? { title: args.t.REVIEW_RAW_PROVENANCE, json: args.provenanceJson }
      : undefined,
  };
}
