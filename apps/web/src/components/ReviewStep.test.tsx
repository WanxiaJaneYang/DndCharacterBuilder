import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CharacterState, ComputeResult } from "@dcb/engine";
import type { ResolvedPackSet } from "@dcb/datapack";
import { ReviewStep } from "./ReviewStep";
import { uiText } from "../uiText";
import type { EditionOption } from "../editions";

const text = uiText.en;

function createComputeResult(): ComputeResult {
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
            fort: {
              total: 4,
              base: 2,
              ability: 2,
              misc: 0,
            },
            ref: {
              total: 1,
              base: 0,
              ability: 1,
              misc: 0,
            },
            will: {
              total: 0,
              base: 0,
              ability: 0,
              misc: 0,
            },
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

function createState(): CharacterState {
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

describe("ReviewStep", () => {
  it("renders engine-backed review summaries instead of conflicting UI props", () => {
    const computeResult = createComputeResult();
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
        state={createState()}
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
        skillUiDetailById={new Map()}
        provenanceByTargetPath={new Map()}
        sourceNameByEntityId={new Map()}
        packVersionById={new Map([["srd-35e-minimal", "1.0.0"]])}
        enabledPackIds={["srd-35e-minimal"]}
        showProv={false}
        onToggleProvenance={vi.fn()}
        onExportJson={vi.fn()}
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

    expect(
      screen.getByText(new RegExp(`${text.REVIEW_TOTAL_WEIGHT_LABEL}:\\s*40`, "i")),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(`${text.REVIEW_LOAD_CATEGORY_LABEL}:\\s*loc:medium`, "i"),
      ),
    ).toBeTruthy();
    expect(
      screen.getAllByText(
        new RegExp(`${text.REVIEW_SPEED_BASE_LABEL}:\\s*30`, "i"),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        new RegExp(`${text.REVIEW_SPEED_ADJUSTED_LABEL}:\\s*20`, "i"),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        new RegExp(`${text.REVIEW_SPEED_IMPACT_LABEL}:\\s*reduced:20`, "i"),
      ),
    ).toBeTruthy();
    expect(screen.getByText(/engine-reduced/i)).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_POINTS_SPENT_LABEL}\\s+0\\s*/\\s*8\\s*\\(\\s*8\\s*${text.REVIEW_REMAINING_LABEL}\\s*\\)`,
          "i",
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_FAVORED_CLASS_LABEL}:\\s*${text.REVIEW_FAVORED_CLASS_ANY}`,
          "i",
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_MULTICLASS_XP_IGNORED_LABEL}:\\s*${text.REVIEW_YES}`,
          "i",
        ),
      ),
    ).toBeTruthy();
  });
});
