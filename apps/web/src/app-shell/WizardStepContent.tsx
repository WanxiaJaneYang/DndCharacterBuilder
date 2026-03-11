import { ReviewStep } from "../components/ReviewStep";
import { AbilityStepContent } from "./AbilityStepContent";
import { EntityStepContent } from "./EntityStepContent";
import { MetadataStepContent } from "./MetadataStepContent";
import { SkillsStepContent } from "./SkillsStepContent";
import type { AppController } from "./useAppController";

export function WizardStepContent({ controller }: { controller: AppController }) {
  const { appData, abilityState, state, setState, showProv, setShowProv, exportJson } = controller;
  const currentStep = appData.currentStep;
  if (!currentStep) return null;

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
