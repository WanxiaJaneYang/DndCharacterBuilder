import { render } from "@testing-library/react";
import type { CharacterState, ComputeResult } from "@dcb/engine";
import type { ResolvedPackSet } from "@dcb/datapack";
import { ReviewStep } from "../ReviewStep";
import { uiText } from "../../uiText";
import type { EditionOption } from "../../editions";

const text = uiText.en;

export function createReviewComputeResult(): ComputeResult {
  return {
    schemaVersion: "0.1",
    sheetViewModel: {
      schemaVersion: "0.1",
      data: {
        combat: {
          ac: {
            total: 16,
            touch: 11,
            flatFooted: 15,
            components: [],
          },
          attacks: [],
        },
        review: {
          identity: {
            level: 1,
            xp: 0,
            size: "medium",
            speed: {
              base: 30,
              adjusted: 20,
            },
          },
          hp: {
            total: 12,
            breakdown: {
              hitDie: 10,
              con: 2,
              misc: 0,
            },
          },
          initiative: {
            total: 1,
            dex: 1,
            misc: 0,
          },
          bab: 1,
          grapple: {
            total: 4,
            bab: 1,
            str: 3,
            size: 0,
            misc: 0,
          },
          speed: {
            base: 30,
            adjusted: 20,
          },
          equipmentLoad: {
            selectedItems: ["chainmail"],
            totalWeight: 40,
            loadCategory: "medium",
            reducesSpeed: true,
          },
          movement: {
            base: 30,
            adjusted: 20,
            reducedByArmorOrLoad: true,
          },
          rulesDecisions: {
            featSelectionLimit: 3,
            favoredClass: "any",
            ignoresMulticlassXpPenalty: true,
          },
          skillBudget: {
            total: 8,
            spent: 0,
            remaining: 8,
          },
          saves: {
            fort: { total: 4, base: 2, ability: 2, misc: 0 },
            ref: { total: 1, base: 0, ability: 1, misc: 0 },
            will: { total: 0, base: 0, ability: 0, misc: 0 },
          },
          abilities: {
            str: { score: 16, mod: 3 },
            dex: { score: 12, mod: 1 },
            con: { score: 14, mod: 2 },
            int: { score: 10, mod: 0 },
            wis: { score: 10, mod: 0 },
            cha: { score: 8, mod: -1 },
          },
        },
        skills: [],
      },
    },
    validationIssues: [],
    unresolved: [],
    assumptions: [],
    provenance: [],
  };
}

function createReviewState(): CharacterState {
  return {
    metadata: {
      name: "Aric",
    },
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 8,
    },
    selections: {
      race: "human",
      class: "fighter",
      equipment: ["chainmail"],
    },
  } as CharacterState;
}

type RenderReviewStepOptions = {
  computeResult?: ComputeResult;
  provenanceByTargetPath?: Map<string, NonNullable<ComputeResult["provenance"]>>;
};

export function renderReviewStep(options: RenderReviewStepOptions = {}) {
  const computeResult = options.computeResult ?? createReviewComputeResult();
  const reviewData = computeResult.sheetViewModel.data.review;
  const selectedEdition: EditionOption = {
    id: "dnd-3.5-srd",
    label: "D&D 3.5 SRD",
    basePackId: "srd-35e-minimal",
    optionalPackIds: [],
  };

  render(
    <ReviewStep
      text={text}
      state={createReviewState()}
      spec={{
        meta: { name: "Aric" },
        class: { classId: "fighter", level: 1 },
      }}
      computeResult={computeResult}
      reviewData={reviewData}
      combatData={computeResult.sheetViewModel.data.combat}
      entities={
        {
          feats: {},
          races: {},
          classes: {},
          items: {
            chainmail: {
              id: "chainmail",
              name: "Chainmail",
            },
          },
          skills: {},
        } as unknown as ResolvedPackSet["entities"]
      }
      selectedEdition={selectedEdition}
      fingerprint="abc123"
      selectedFeats={[]}
      selectedRaceEntity={{
        name: "Human",
        data: {
          favoredClass: "wizard",
        },
      }}
      selectedClassEntity={{
        name: "Fighter",
      }}
      provenanceByTargetPath={options.provenanceByTargetPath ?? new Map()}
      sourceNameByEntityId={new Map()}
      packVersionById={new Map([["srd-35e-minimal", "1.0.0"]])}
      enabledPackIds={["srd-35e-minimal"]}
      showProv={false}
      onToggleProvenance={() => {}}
      onExportJson={() => {}}
      localizeLoadCategory={(category) => `loc:${category}`}
      formatSpeedImpact={(speed, reducesSpeed) =>
        reducesSpeed ? `reduced:${speed}` : "none"
      }
      formatMovementNotes={(reducedByArmorOrLoad) =>
        reducedByArmorOrLoad ? ["engine-reduced"] : ["engine-normal"]
      }
      localizeAbilityLabel={(ability) => ability.toUpperCase()}
      localizeEntityText={(_entityType, entityId, _path, fallback) =>
        entityId === "chainmail" ? "Chainmail" : fallback
      }
    />,
  );

  return { text };
}
