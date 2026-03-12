import { applyChoice } from "@dcb/engine";
import type { RefObject } from "react";
import { createAbilityModeSelectorHandlers } from "../createAbilityModeSelectorHandlers";
import { resolvePageSchemaForStep } from "../pageSchemaResolver";
import { buildAbilitiesAllocatorPageData } from "../pageComposer/buildAbilitiesAllocatorPageData";
import { buildReviewSheetPageData } from "../pageComposer/buildReviewSheetPageData";
import { buildSkillsAllocatorPageData } from "../pageComposer/buildSkillsAllocatorPageData";
import {
  buildEntityTypeSingleSelectData,
  buildMetadataNameFieldData,
} from "../pageComposer/pageDataBuilders";
import { PageComposer } from "../pageComposer/PageComposer";
import { ReviewStep } from "../components/ReviewStep";
import { AbilityStepContent } from "./AbilityStepContent";
import { EntityStepContent } from "./EntityStepContent";
import { MetadataStepContent } from "./MetadataStepContent";
import { STEP_ID_FEAT, STEP_ID_SKILLS } from "./constants";
import { SkillsStepContent } from "./SkillsStepContent";
import type { AppController } from "./useAppController";

export function WizardStepContent({ controller }: { controller: AppController }) {
  const { appData, abilityState, state, setState, showProv, setShowProv, exportJson } = controller;
  const currentStep = appData.currentStep;
  if (!currentStep) return null;

  const pageSchema = resolvePageSchemaForStep(
    currentStep,
    appData.context.resolvedData.pageSchemas,
  );

  if (pageSchema) {
    if (currentStep.kind === "review") {
      const reviewSheetData = buildReviewSheetPageData({
        t: appData.text,
        characterName: appData.spec.meta.name,
        selectedRaceId: String(state.selections.race ?? ""),
        selectedClassId: appData.spec.class?.classId ?? String(state.selections.class ?? ""),
        selectedRaceEntity: appData.selectedRaceEntity,
        selectedClassEntity: appData.selectedClassEntity,
        reviewData: appData.reviewData,
        reviewCombat: appData.combatData,
        selectedFeats: appData.selectedFeats,
        featsById: appData.context.resolvedData.entities.feats ?? {},
        skills: appData.computeResult.sheetViewModel.data.skills,
        baseAbilityScores: state.abilities,
        provenanceByTargetPath: appData.provenanceByTargetPath,
        sourceNameByEntityId: appData.sourceNameByEntityId,
        localizeAbilityLabel: appData.localizeAbilityLabel,
        localizeEntityText: appData.localizeEntityText,
        enabledPackIds: appData.enabledPackIds,
        packVersionById: appData.packVersionById,
        selectedEditionLabel: appData.selectedEdition.label || appData.selectedEdition.id || "-",
        fingerprint: appData.context.resolvedData.fingerprint,
        localizeLoadCategory: appData.localizeLoadCategory,
        formatSpeedImpact: appData.formatSpeedImpact,
        formatMovementNotes: appData.formatMovementNotes,
        showProvenance: showProv,
        provenanceJson: JSON.stringify(appData.computeResult.provenance ?? [], null, 2),
        onExportJson: exportJson,
        onToggleProvenance: () => setShowProv((current) => !current),
      });

      return (
        <PageComposer
          schema={pageSchema}
          dataRoot={{ page: { reviewSheet: reviewSheetData } }}
        />
      );
    }

    if (currentStep.kind === "abilities") {
      const modeSelectorHandlers = createAbilityModeSelectorHandlers({
        hasActiveModeHint: abilityState.activeModeHint.length > 0,
        abilityMethodHintPinned: abilityState.abilityMethodHintPinned,
        abilityMethodHintRef: abilityState.abilityMethodHintRef as RefObject<HTMLDivElement>,
        setAbilityMethodHintOpen: abilityState.setAbilityMethodHintOpen,
        setAbilityMethodHintPinned: abilityState.setAbilityMethodHintPinned,
        isAbilityMode: abilityState.isAbilityMode,
        onAbilityModeChange: abilityState.handleAbilityModeChange,
      });
      const abilitiesAllocatorData = buildAbilitiesAllocatorPageData({
        t: appData.text,
        title: currentStep.label,
        abilityModes: abilityState.abilityModes,
        selectedAbilityMode: abilityState.selectedAbilityMode,
        selectedAbilityModeValue: abilityState.selectedAbilityModeValue,
        modeUi: abilityState.abilityPresentation?.modeUi ?? {},
        abilityMethodHintOpen: abilityState.isHintVisible,
        modeSelectorHandlers,
        pointBuyPanel:
          abilityState.selectedAbilityMode === "pointBuy" && abilityState.hasPointBuyConfig
            ? {
                pointCap: abilityState.selectedPointCap,
                pointCapMin: abilityState.pointCapMin,
                pointCapMax: abilityState.pointCapMax,
                pointCapStep: abilityState.pointCapStep,
                pointBuyRemaining: abilityState.pointBuyRemaining,
                isTableOpen: abilityState.isPointBuyTableOpen,
                costTable: abilityState.pointBuyCostTable,
                onPointCapChange: (value: number) => {
                  const clamped = Math.min(
                    abilityState.pointCapMax,
                    Math.max(abilityState.pointCapMin, value),
                  );
                  abilityState.applyAbilitySelection(
                    { ...state.abilities },
                    { pointCap: clamped },
                  );
                },
                onToggleTable: () =>
                  abilityState.setIsPointBuyTableOpen((current) => !current),
              }
            : undefined,
        rollSetsPanel:
          abilityState.selectedAbilityMode === "rollSets" && abilityState.rollSetsConfig
            ? {
                title: appData.text.ROLL_SET_SELECTION_TITLE,
                description: appData.text.ROLL_SET_SELECTION_DESCRIPTION,
                rerollLabel: appData.text.ROLL_SET_REROLL_BUTTON,
                ariaLabel: appData.text.ROLL_SET_OPTIONS_ARIA_LABEL,
                options: abilityState.generatedRollSets.map((set, index) => ({
                  id: `roll-set-${index}`,
                  label: [
                    appData.text.ROLL_SET_OPTION_PREFIX,
                    String(index + 1),
                    appData.text.ROLL_SET_OPTION_SUFFIX,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  scores: set.join(", "),
                  checked: abilityState.selectedRollSetIndex === index,
                  onSelect: () => abilityState.applySelectedRollSet(set, index),
                })),
                onReroll: abilityState.regenerateRollSetOptions,
              }
            : undefined,
        abilityOrder: ["str", "dex", "con", "int", "wis", "cha"],
        abilityScores: state.abilities,
        abilityMinScore: abilityState.abilityMinScore,
        abilityMaxScore: abilityState.abilityMaxScore,
        rollSetNeedsSelection: abilityState.rollSetNeedsSelection,
        onAbilityChange: abilityState.setAbility,
        onAbilityBlur: abilityState.clampAbilityOnBlur,
        onAbilityStep: abilityState.stepAbility,
        reviewAbilities: appData.reviewData.abilities,
        provenanceByTargetPath: appData.provenanceByTargetPath,
        sourceMetaByEntityKey: appData.sourceMetaByEntityKey,
        localizeAbilityLabel: appData.localizeAbilityLabel,
        showModifierTable: abilityState.abilityPresentation?.showExistingModifiers ?? true,
        hideZeroGroups: abilityState.hideZeroGroups,
        sourceTypeLabels: abilityState.sourceTypeLabels,
      });

      return (
        <PageComposer
          schema={pageSchema}
          dataRoot={{ page: { abilitiesAllocator: abilitiesAllocatorData } }}
        />
      );
    }

    if (currentStep.kind === "skills") {
      const skillsAllocatorData = buildSkillsAllocatorPageData({
        t: appData.text,
        title: currentStep.label,
        budget: {
          total: appData.reviewData.skillBudget.total,
          spent: appData.reviewData.skillBudget.spent,
          remaining: appData.reviewData.skillBudget.remaining,
        },
        skills: appData.skillEntities,
        skillViewModelById: appData.skillViewModelById,
        selectedSkillRanks: appData.selectedSkillRanks,
        onCommitRanks: (skillId, nextValue, maxRanks) => {
          const nextRanks = {
            ...appData.selectedSkillRanks,
            [skillId]: Math.min(maxRanks, Math.max(0, nextValue)),
          };
          setState((current) => applyChoice(current, STEP_ID_SKILLS, nextRanks, appData.context));
        },
      });

      return (
        <PageComposer
          schema={pageSchema}
          dataRoot={{ page: { skillsAllocator: skillsAllocatorData } }}
        />
      );
    }

    if (currentStep.kind === "metadata") {
      const metadataName = buildMetadataNameFieldData({
        title: currentStep.label,
        label: appData.text.NAME_LABEL,
        inputId: "character-name-input",
        value: state.metadata.name ?? "",
        placeholder: appData.text.METADATA_PLACEHOLDER,
        onChange: (value: string) => {
          setState((current) => applyChoice(current, currentStep.id, value, appData.context));
        },
      });

      return (
        <PageComposer
          schema={pageSchema}
          dataRoot={{ page: { metadataName } }}
        />
      );
    }

    if (currentStep.source.type === "entityType") {
      const stepChoice = appData.choiceMap.get(currentStep.id);
      const options = stepChoice?.options ?? [];
      const limit = stepChoice?.limit ?? currentStep.source.limit ?? 1;

      if (limit <= 1 && currentStep.id !== STEP_ID_FEAT) {
        const entityChoice = buildEntityTypeSingleSelectData({
          title: currentStep.label,
          inputName: currentStep.id,
          options,
          value: String(state.selections[currentStep.id] ?? ""),
          onSelect: (id: string) => {
            setState((current) => applyChoice(current, currentStep.id, id, appData.context));
          },
        });

        return (
          <PageComposer
            schema={pageSchema}
            dataRoot={{ page: { entityChoice } }}
          />
        );
      }
    }
  }

  if (currentStep.kind === "review") {
    return (
      <ReviewStep
        text={appData.text}
        state={state}
        spec={appData.spec}
        computeResult={appData.computeResult}
        reviewData={appData.reviewData}
        combatData={appData.combatData}
        entities={appData.context.resolvedData.entities}
        selectedEdition={appData.selectedEdition}
        fingerprint={appData.context.resolvedData.fingerprint}
        selectedFeats={appData.selectedFeats}
        selectedRaceEntity={appData.selectedRaceEntity}
        selectedClassEntity={appData.selectedClassEntity}
        provenanceByTargetPath={appData.provenanceByTargetPath}
        sourceNameByEntityId={appData.sourceNameByEntityId}
        packVersionById={appData.packVersionById}
        enabledPackIds={appData.enabledPackIds}
        showProv={showProv}
        onToggleProvenance={() => setShowProv((current) => !current)}
        onExportJson={exportJson}
        localizeLoadCategory={appData.localizeLoadCategory}
        formatSpeedImpact={appData.formatSpeedImpact}
        formatMovementNotes={appData.formatMovementNotes}
        localizeAbilityLabel={appData.localizeAbilityLabel}
        localizeEntityText={appData.localizeEntityText}
      />
    );
  }

  if (currentStep.kind === "metadata") {
    return (
      <MetadataStepContent
        label={currentStep.label}
        text={appData.text}
        state={state}
        setState={setState}
        context={appData.context}
        stepId={currentStep.id}
      />
    );
  }

  if (currentStep.kind === "abilities") {
    return (
      <AbilityStepContent
        label={currentStep.label}
        text={appData.text}
        abilityState={abilityState}
        state={state}
        localizeAbilityLabel={appData.localizeAbilityLabel}
        provenanceByTargetPath={appData.provenanceByTargetPath}
        sourceMetaByEntityKey={appData.sourceMetaByEntityKey}
        reviewData={appData.reviewData}
      />
    );
  }

  if (currentStep.kind === "skills") {
    return (
      <SkillsStepContent
        label={currentStep.label}
        text={appData.text}
        state={state}
        setState={setState}
        context={appData.context}
        reviewData={appData.reviewData}
        skillEntities={appData.skillEntities}
        skillViewModelById={appData.skillViewModelById}
        selectedSkillRanks={appData.selectedSkillRanks}
      />
    );
  }

  return (
    <EntityStepContent
      currentStep={currentStep}
      choiceMap={appData.choiceMap}
      selectedStepValues={appData.selectedStepValues}
      state={state}
      setState={setState}
      context={appData.context}
    />
  );
}
