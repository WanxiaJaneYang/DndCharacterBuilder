import { deriveValueFromProvenance, getEntityDataRecord } from "../appHelpers";
import { ReviewAbilityTable } from "./review/ReviewAbilityTable";
import { ReviewAttackSection } from "./review/ReviewAttackSection";
import { ReviewCombatTable } from "./review/ReviewCombatTable";
import { ReviewDecisionSections } from "./review/ReviewDecisionSections";
import { ReviewFeatTraitSection } from "./review/ReviewFeatTraitSection";
import { ReviewHeader } from "./review/ReviewHeader";
import { ReviewIdentitySection } from "./review/ReviewIdentitySection";
import { ReviewProvenanceSection } from "./review/ReviewProvenanceSection";
import { ReviewSaveHpSection } from "./review/ReviewSaveHpSection";
import { ReviewSkillsSection } from "./review/ReviewSkillsSection";
import { ReviewStatCards } from "./review/ReviewStatCards";
import { type ReviewStepProps } from "./review/reviewTypes";

export function ReviewStep({
  text,
  state,
  spec,
  computeResult,
  reviewData,
  combatData,
  entities,
  selectedEdition,
  fingerprint,
  selectedFeats,
  selectedRaceEntity,
  selectedClassEntity,
  provenanceByTargetPath,
  sourceNameByEntityId,
  packVersionById,
  enabledPackIds,
  showProv,
  onToggleProvenance,
  onExportJson,
  localizeLoadCategory,
  formatSpeedImpact,
  formatMovementNotes,
  localizeAbilityLabel,
  localizeEntityText,
}: ReviewStepProps) {
  const selectedRaceId = String(state.selections.race ?? "");
  const selectedClassId = spec.class?.classId ?? String(state.selections.class ?? "");
  const selectedRaceName = selectedRaceId
    ? localizeEntityText(
        "races",
        selectedRaceId,
        "name",
        selectedRaceEntity?.name ?? text.REVIEW_UNRESOLVED_LABEL,
      )
    : text.REVIEW_UNRESOLVED_LABEL;
  const selectedClassName = selectedClassId
    ? localizeEntityText(
        "classes",
        selectedClassId,
        "name",
        selectedClassEntity?.name ?? text.REVIEW_UNRESOLVED_LABEL,
      )
    : text.REVIEW_UNRESOLVED_LABEL;
  const racialTraits = Array.isArray(getEntityDataRecord(selectedRaceEntity).racialTraits)
    ? (getEntityDataRecord(selectedRaceEntity).racialTraits as Array<Record<string, unknown>>)
    : [];
  const reviewSkills = computeResult.sheetViewModel.data.skills
    .filter((skill) => skill.ranks > 0 || skill.racialBonus !== 0)
    .sort((a, b) => {
      const left = localizeEntityText("skills", a.id, "name", a.name);
      const right = localizeEntityText("skills", b.id, "name", b.name);
      return b.total - a.total || left.localeCompare(right);
    });
  const finalStatValues = {
    hp: reviewData.hp.total,
    ac: combatData.ac.total,
    initiative: reviewData.initiative.total,
    speed: reviewData.speed.adjusted,
    bab: reviewData.bab,
    fort: reviewData.saves.fort.total,
    ref: reviewData.saves.ref.total,
    will: reviewData.saves.will.total,
  } as const;
  const enabledPackDetails = enabledPackIds.map((packId) => ({
    packId,
    version: packVersionById.get(packId) ?? text.REVIEW_UNKNOWN_VERSION,
  }));

  return (
    <section className="review-page">
      <h2>{text.REVIEW}</h2>
      <ReviewHeader
        text={text}
        characterName={spec.meta.name}
        selectedRaceName={selectedRaceName}
        selectedClassName={selectedClassName}
        onExportJson={onExportJson}
        onToggleProvenance={onToggleProvenance}
      />
      <ReviewIdentitySection text={text} reviewData={reviewData} />
      <ReviewStatCards text={text} reviewData={reviewData} combatData={combatData} />
      <ReviewSaveHpSection text={text} reviewData={reviewData} />
      <ReviewAttackSection text={text} combatData={combatData} />
      <ReviewFeatTraitSection
        text={text}
        entities={entities}
        selectedFeats={selectedFeats}
        racialTraits={racialTraits}
      />
      <ReviewAbilityTable
        text={text}
        state={state}
        reviewData={reviewData}
        provenanceByTargetPath={provenanceByTargetPath}
        sourceNameByEntityId={sourceNameByEntityId}
        localizeAbilityLabel={localizeAbilityLabel}
      />
      <ReviewCombatTable
        text={text}
        finalStatValues={finalStatValues}
        provenanceByTargetPath={provenanceByTargetPath}
        sourceNameByEntityId={sourceNameByEntityId}
      />
      <ReviewSkillsSection
        text={text}
        reviewData={reviewData}
        reviewSkills={reviewSkills}
        localizeEntityText={localizeEntityText}
        localizeAbilityLabel={localizeAbilityLabel}
      />
      <ReviewDecisionSections
        text={text}
        reviewData={reviewData}
        selectedEdition={selectedEdition}
        fingerprint={fingerprint}
        enabledPackDetails={enabledPackDetails}
        localizeEntityText={localizeEntityText}
        localizeLoadCategory={localizeLoadCategory}
        formatSpeedImpact={formatSpeedImpact}
        formatMovementNotes={formatMovementNotes}
      />
      {showProv ? (
        <ReviewProvenanceSection
          text={text}
          provenance={computeResult.provenance}
        />
      ) : null}
    </section>
  );
}
