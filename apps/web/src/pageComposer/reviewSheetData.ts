import { DEFAULT_STATS } from "@dcb/engine";
import type { BuildReviewSheetDataArgs, ReviewSheetData } from "./reviewSheetTypes";

const REVIEW_ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
const REVIEW_STAT_ORDER = ["hp", "ac", "initiative", "bab", "fort", "ref", "will"] as const;
type ReviewCombatStatKey = (typeof REVIEW_STAT_ORDER)[number];
const REVIEW_STAT_DEFAULTS: Record<ReviewCombatStatKey, number> = {
  hp: DEFAULT_STATS.hp,
  ac: DEFAULT_STATS.ac,
  initiative: DEFAULT_STATS.initiative,
  bab: DEFAULT_STATS.bab,
  fort: DEFAULT_STATS.fort,
  ref: DEFAULT_STATS.ref,
  will: DEFAULT_STATS.will,
};

const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
const formatSkillValue = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}`;

export function buildReviewSheetData(args: BuildReviewSheetDataArgs): ReviewSheetData {
  const finalStatValues = { hp: args.reviewData.hp.total, ac: args.reviewCombat.ac.total, initiative: args.reviewData.initiative.total, bab: args.reviewData.bab, fort: args.reviewData.saves.fort.total, ref: args.reviewData.saves.ref.total, will: args.reviewData.saves.will.total } as const;
  const statLabels: Record<ReviewCombatStatKey, string> = { hp: args.t.REVIEW_HP_LABEL, ac: args.t.REVIEW_AC_LABEL, initiative: args.t.REVIEW_INITIATIVE_LABEL, bab: args.t.REVIEW_BAB_LABEL, fort: args.t.REVIEW_FORT_LABEL, ref: args.t.REVIEW_REF_LABEL, will: args.t.REVIEW_WILL_LABEL };
  const visibleSkills = [...args.skills].filter((skill) => skill.ranks > 0 || skill.racialBonus !== 0).sort((left, right) => right.total - left.total || args.localizeEntityText("skills", left.id, "name", left.name).localeCompare(args.localizeEntityText("skills", right.id, "name", right.name)));
  return {
    t: args.t,
    characterName: args.characterName || args.t.UNNAMED_CHARACTER,
    selectedRaceName: args.selectedRaceName,
    selectedClassName: args.selectedClassName,
    identityRows: [{ label: args.t.REVIEW_LEVEL_LABEL, value: args.reviewData.identity.level }, { label: args.t.REVIEW_XP_LABEL, value: args.reviewData.identity.xp }, { label: args.t.REVIEW_SIZE_LABEL, value: args.reviewData.identity.size }, { label: args.t.REVIEW_SPEED_BASE_LABEL, value: args.reviewData.identity.speed.base }, { label: args.t.REVIEW_SPEED_ADJUSTED_LABEL, value: args.reviewData.identity.speed.adjusted }],
    statCards: [{ label: args.t.REVIEW_AC_LABEL, value: args.reviewCombat.ac.total }, { label: args.t.REVIEW_AC_TOUCH_LABEL, value: args.reviewCombat.ac.touch }, { label: args.t.REVIEW_AC_FLAT_FOOTED_LABEL, value: args.reviewCombat.ac.flatFooted }, { label: args.t.REVIEW_HP_LABEL, value: args.reviewData.hp.total }, { label: args.t.REVIEW_INITIATIVE_LABEL, value: args.reviewData.initiative.total }, { label: args.t.REVIEW_GRAPPLE_LABEL, value: args.reviewData.grapple.total }],
    saveHpRows: [{ label: args.t.REVIEW_FORT_LABEL, base: args.reviewData.saves.fort.base, ability: args.reviewData.saves.fort.ability, adjustments: args.reviewData.saves.fort.misc, final: args.reviewData.saves.fort.total }, { label: args.t.REVIEW_REF_LABEL, base: args.reviewData.saves.ref.base, ability: args.reviewData.saves.ref.ability, adjustments: args.reviewData.saves.ref.misc, final: args.reviewData.saves.ref.total }, { label: args.t.REVIEW_WILL_LABEL, base: args.reviewData.saves.will.base, ability: args.reviewData.saves.will.ability, adjustments: args.reviewData.saves.will.misc, final: args.reviewData.saves.will.total }, { label: args.t.REVIEW_HP_LABEL, base: args.reviewData.hp.breakdown.hitDie, ability: args.reviewData.hp.breakdown.con, adjustments: args.reviewData.hp.breakdown.misc, final: args.reviewData.hp.total }],
    attackRows: args.reviewCombat.attacks.map((attack) => ({ id: `${attack.category}-${attack.itemId}`, typeLabel: attack.category === "melee" ? args.t.REVIEW_ATTACK_MELEE_LABEL : args.t.REVIEW_ATTACK_RANGED_LABEL, name: attack.name, attackBonus: formatSigned(attack.attackBonus), damage: attack.damageLine, crit: attack.crit, range: attack.category === "ranged" ? attack.range ?? "-" : "-" })),
    featSummary: args.selectedFeats.map((featId) => ({ id: featId, name: args.featsById[featId]?.name ?? featId, description: args.featsById[featId]?.summary ?? args.featsById[featId]?.description ?? featId })),
    traitSummary: args.racialTraits.map((trait, index) => ({ id: `${String(trait.name ?? "")}-${index}`, name: String(trait.name ?? ""), description: String(trait.description ?? "").trim() })),
    abilityRows: REVIEW_ABILITY_ORDER.map((ability) => ({ id: ability, label: args.localizeAbilityLabel(ability), base: Number(args.baseAbilityScores[ability] ?? 10), adjustments: (args.provenanceByTargetPath.get(`abilities.${ability}.score`) ?? []).map((record) => ({ value: record.delta !== undefined ? formatSigned(record.delta) : `= ${record.setValue ?? 0}`, source: args.formatSourceLabel(record.source.packId, record.source.entityId) })), final: args.reviewData.abilities[ability]?.score ?? Number(args.baseAbilityScores[ability] ?? 10), mod: formatSigned(args.reviewData.abilities[ability]?.mod ?? 0) })),
    combatRows: REVIEW_STAT_ORDER.map((statKey) => buildCombatRow(args, statKey, statLabels, finalStatValues[statKey])),
    skillsSummary: { spent: args.reviewData.skillBudget.spent, total: args.reviewData.skillBudget.total, remaining: args.reviewData.skillBudget.remaining },
    skillsRows: visibleSkills.map((skill) => ({ id: skill.id, name: args.localizeEntityText("skills", skill.id, "name", skill.name), ranks: formatSkillValue(skill.ranks), ability: `${formatSigned(skill.abilityMod)} (${args.localizeAbilityLabel(skill.abilityKey)})`, racial: formatSigned(skill.racialBonus), misc: formatSigned(skill.misc), acp: formatSigned(skill.acp), total: formatSkillValue(skill.total), pointCost: `${formatSkillValue(skill.costSpent)} (${skill.costPerRank}${args.t.REVIEW_PER_RANK_UNIT})` })),
    equipmentLoad: { selectedItems: args.reviewData.equipmentLoad.selectedItems.length > 0 ? args.reviewData.equipmentLoad.selectedItems.map((itemId) => args.localizeEntityText("items", itemId, "name", itemId)).join(", ") : "-", totalWeight: args.reviewData.equipmentLoad.totalWeight, loadCategory: args.localizeLoadCategory(args.reviewData.equipmentLoad.loadCategory), speedImpact: args.formatSpeedImpact(args.reviewData.speed.adjusted, args.reviewData.equipmentLoad.reducesSpeed) },
    movementDetail: { base: args.reviewData.speed.base, adjusted: args.reviewData.speed.adjusted, notes: args.formatMovementNotes(args.reviewData.movement.reducedByArmorOrLoad).join("; ") },
    rulesDecisions: { favoredClass: args.reviewData.rulesDecisions.favoredClass ? (args.reviewData.rulesDecisions.favoredClass === "any" ? args.t.REVIEW_FAVORED_CLASS_ANY : args.localizeEntityText("classes", args.reviewData.rulesDecisions.favoredClass, "name", args.reviewData.rulesDecisions.favoredClass)) : args.t.REVIEW_UNRESOLVED_LABEL, ignoresMulticlassXpPenalty: args.reviewData.rulesDecisions.ignoresMulticlassXpPenalty ? args.t.REVIEW_YES : args.t.REVIEW_NO, featSelectionLimit: args.reviewData.rulesDecisions.featSelectionLimit },
    packInfo: { selectedEdition: args.selectedEditionLabel || "-", enabledPacks: args.enabledPackIds.map((packId) => ({ packId, version: args.packVersionById.get(packId) ?? args.t.REVIEW_UNKNOWN_VERSION })), fingerprint: args.fingerprint },
    showProvenance: args.showProvenance,
    provenanceJson: args.provenanceJson,
    onExportJson: args.onExportJson,
    onToggleProvenance: args.onToggleProvenance,
  };
}

function buildCombatRow(args: BuildReviewSheetDataArgs, statKey: ReviewCombatStatKey, statLabels: Record<ReviewCombatStatKey, string>, finalValue: string | number) {
  const records = args.provenanceByTargetPath.get(`stats.${statKey}`) ?? [];
  const firstSetIndex = records.findIndex((record) => record.setValue !== undefined);
  const base = firstSetIndex >= 0 ? Number(records[firstSetIndex]?.setValue ?? REVIEW_STAT_DEFAULTS[statKey]) : REVIEW_STAT_DEFAULTS[statKey];
  return { id: statKey, label: statLabels[statKey], base, adjustments: records.filter((_, index) => index !== firstSetIndex).map((record) => ({ value: record.delta !== undefined ? formatSigned(record.delta) : `= ${record.setValue ?? 0}`, source: args.formatSourceLabel(record.source.packId, record.source.entityId) })), final: String(finalValue) };
}
