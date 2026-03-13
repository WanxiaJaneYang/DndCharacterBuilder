import { useCallback, useMemo } from "react";
import { resolveLoadedPacks } from "@dcb/datapack";
import { compute } from "@dcb/engine";
import { listChoices, type CharacterState } from "@dcb/engine/legacy";
import {
  buildSkillBudgetSummary,
  getCharacterLevel,
  getClassSkillIds,
  getRacialSkillBonuses,
  getSkillMaxRanksForLevel,
  type LocalSkillUiDetail,
} from "../appHelpers";
import { characterSpecFromState } from "../characterSpecFromState";
import { EDITIONS, FALLBACK_EDITION } from "../editions";
import { resolveSpecializedSkillLabel } from "../localization";
import { uiText, type AbilityCode, type Language } from "../uiText";
import { getStepSelectionValues, localizeChoices, localizeWizardSteps } from "../wizardStepHelpers";
import { embeddedPacks, STEP_ID_FEAT, STEP_ID_SKILLS } from "./constants";

type UseAppDataInput = {
  state: CharacterState;
  language: Language;
  stepIndex: number;
  selectedEditionId: string;
  selectedOptionalPackIds: string[];
};

export function useAppData(input: UseAppDataInput) {
  const text = uiText[input.language];
  const selectedEdition = useMemo(
    () => EDITIONS.find((edition) => edition.id === input.selectedEditionId) ?? EDITIONS[0] ?? FALLBACK_EDITION,
    [input.selectedEditionId],
  );
  const enabledPackIds = useMemo(
    () => [selectedEdition.basePackId, ...input.selectedOptionalPackIds.filter((packId) => selectedEdition.optionalPackIds.includes(packId))].filter((packId) => packId.trim().length > 0),
    [input.selectedOptionalPackIds, selectedEdition],
  );
  const resolvedData = useMemo(() => resolveLoadedPacks(embeddedPacks, enabledPackIds), [enabledPackIds]);
  const context = useMemo(() => ({ enabledPackIds, resolvedData }), [enabledPackIds, resolvedData]);
  const activeLocale = useMemo(() => context.resolvedData.locales[input.language], [context.resolvedData.locales, input.language]);
  const wizardSteps = useMemo(() => localizeWizardSteps(context.resolvedData.flow.steps, activeLocale?.flowStepLabels), [activeLocale?.flowStepLabels, context.resolvedData.flow.steps]);
  const currentStep = wizardSteps[input.stepIndex];
  const localizeAbilityLabel = useCallback(
    (ability: string) => text.ABILITY_LABELS[ability.toUpperCase() as Uppercase<AbilityCode>] ?? ability.toUpperCase(),
    [text.ABILITY_LABELS],
  );
  const localizeEntityText = useCallback((entityType: string, entityId: string, path: string, fallback: string) => {
    const maybeText = activeLocale?.entityText?.[entityType]?.[entityId]?.[path];
    if (typeof maybeText === "string" && maybeText.length > 0) return maybeText;
    if (path !== "name") return fallback;
    const name = activeLocale?.entityNames?.[entityType]?.[entityId];
    if (typeof name === "string" && name.length > 0) return name;
    if (entityType !== "skills") return fallback;
    return resolveSpecializedSkillLabel({ locale: activeLocale, language: input.language, skillId: entityId }) ?? fallback;
  }, [activeLocale, input.language]);
  const choices = useMemo(() => listChoices(input.state, context), [context, input.state]);
  const localizedChoices = useMemo(
    () => localizeChoices({ choices, wizardSteps, flowStepLabels: activeLocale?.flowStepLabels, localizeEntityText }),
    [activeLocale?.flowStepLabels, choices, localizeEntityText, wizardSteps],
  );
  const choiceMap = useMemo(() => new Map(localizedChoices.map((choice) => [choice.stepId, choice])), [localizedChoices]);
  const spec = useMemo(() => characterSpecFromState({ state: input.state, rulesetId: selectedEdition.id, sourceIds: enabledPackIds }), [enabledPackIds, input.state, selectedEdition.id]);
  const computeResult = useMemo(() => compute(spec, { resolvedData, enabledPackIds }), [enabledPackIds, resolvedData, spec]);
  const reviewData = computeResult.sheetViewModel.data.review;
  const combatData = computeResult.sheetViewModel.data.combat;
  const skillEntities = useMemo(() => Object.values(context.resolvedData.entities.skills ?? {}).map((skill) => ({
    ...skill,
    displayName: localizeEntityText("skills", skill.id, "name", skill.name),
  })).sort((left, right) => left.displayName.localeCompare(right.displayName)), [context.resolvedData.entities.skills, localizeEntityText]);
  const skillViewModelById = useMemo(() => new Map(computeResult.sheetViewModel.data.skills.map((skill) => [skill.id, skill])), [computeResult.sheetViewModel.data.skills]);
  const selectedFeats = (input.state.selections.feats as string[] | undefined) ?? [];
  const selectedRaceEntity = useMemo(() => spec.raceId ? context.resolvedData.entities.races?.[spec.raceId] : undefined, [context.resolvedData.entities.races, spec.raceId]);
  const selectedClassEntity = useMemo(() => spec.class?.classId ? context.resolvedData.entities.classes?.[spec.class.classId] : undefined, [context.resolvedData.entities.classes, spec.class?.classId]);
  const selectedSkillRanks = useMemo(() => {
    const raw = input.state.selections[STEP_ID_SKILLS];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.entries(raw as Record<string, unknown>).reduce<Record<string, number>>((acc, [skillId, value]) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 0) return acc;
      acc[skillId] = numericValue;
      return acc;
    }, {});
  }, [input.state.selections]);
  const classSkillIds = useMemo(() => getClassSkillIds(selectedClassEntity), [selectedClassEntity]);
  const racialSkillBonuses = useMemo(() => getRacialSkillBonuses(selectedRaceEntity), [selectedRaceEntity]);
  const skillBudget = useMemo(() => buildSkillBudgetSummary({
    classEntity: selectedClassEntity,
    classSelection: spec.class,
    raceEntity: selectedRaceEntity,
    intMod: reviewData.abilities.int?.mod ?? 0,
    skillRanks: selectedSkillRanks,
    classSkillIds,
  }), [classSkillIds, reviewData.abilities.int, selectedClassEntity, selectedRaceEntity, selectedSkillRanks, spec.class]);
  const skillUiDetailById = useMemo(() => {
    const level = getCharacterLevel(spec.class);
    return new Map(skillEntities.map((skill) => {
      const classSkill = classSkillIds.has(skill.id);
      const costPerRank = classSkill ? 1 : 2;
      const ranks = selectedSkillRanks[skill.id] ?? 0;
      return [skill.id, {
        classSkill,
        costPerRank,
        costSpent: ranks * costPerRank,
        maxRanks: getSkillMaxRanksForLevel(level, classSkill),
        racialBonus: racialSkillBonuses.get(skill.id) ?? 0,
      } satisfies LocalSkillUiDetail] as const;
    }));
  }, [classSkillIds, racialSkillBonuses, selectedSkillRanks, skillEntities, spec.class]);
  const provenanceByTargetPath = useMemo(() => {
    const map = new Map<string, NonNullable<typeof computeResult.provenance>>();
    for (const record of computeResult.provenance ?? []) {
      const existing = map.get(record.targetPath);
      if (existing) existing.push(record);
      else map.set(record.targetPath, [record]);
    }
    return map;
  }, [computeResult.provenance]);
  const sourceMetaByEntityKey = useMemo(() => {
    const map = new Map<string, { sourceType: string; sourceLabel: string }>();
    for (const [entityType, bucket] of Object.entries(context.resolvedData.entities)) {
      for (const entity of Object.values(bucket)) {
        map.set(`${entity._source.packId}:${entity.id}`, {
          sourceType: entityType,
          sourceLabel: localizeEntityText(entityType, entity.id, "name", entity.name),
        });
      }
    }
    return map;
  }, [context.resolvedData.entities, localizeEntityText]);
  const sourceNameByEntityId = useMemo(() => new Map(Array.from(sourceMetaByEntityKey.entries()).map(([key, meta]) => [key, meta.sourceLabel])), [sourceMetaByEntityKey]);
  const packVersionById = useMemo(() => new Map(context.resolvedData.manifests.map((manifest) => [manifest.id, manifest.version || text.REVIEW_UNKNOWN_VERSION])), [context.resolvedData.manifests, text.REVIEW_UNKNOWN_VERSION]);
  const selectedStepValues = (stepId: string) => getStepSelectionValues({ stepId, selections: input.state.selections, featStepId: STEP_ID_FEAT });
  const localizeLoadCategory = (category: "light" | "medium" | "heavy") => category === "medium" ? text.REVIEW_LOAD_CATEGORY_MEDIUM : category === "heavy" ? text.REVIEW_LOAD_CATEGORY_HEAVY : text.REVIEW_LOAD_CATEGORY_LIGHT;
  const formatSpeedImpact = (adjustedSpeed: number, reducesSpeed: boolean) => reducesSpeed ? text.REVIEW_SPEED_IMPACT_REDUCED.replace("{speed}", String(adjustedSpeed)) : text.REVIEW_SPEED_IMPACT_NONE;
  const formatMovementNotes = (reducedByArmorOrLoad: boolean) => reducedByArmorOrLoad ? [text.REVIEW_MOVEMENT_NOTE_ARMOR_OR_LOAD] : [text.REVIEW_MOVEMENT_NOTE_NONE];

  return {
    text, context, selectedEdition, enabledPackIds, wizardSteps, currentStep, choiceMap, spec,
    computeResult, reviewData, combatData, skillEntities, skillViewModelById, selectedFeats,
    selectedRaceEntity, selectedClassEntity, selectedSkillRanks, skillBudget, skillUiDetailById,
    provenanceByTargetPath, sourceMetaByEntityKey, sourceNameByEntityId, packVersionById,
    localizeAbilityLabel, localizeEntityText, localizeLoadCategory, formatSpeedImpact,
    formatMovementNotes, selectedStepValues,
  };
}

export type AppData = ReturnType<typeof useAppData>;
