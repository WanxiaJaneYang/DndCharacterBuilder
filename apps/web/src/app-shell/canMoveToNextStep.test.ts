import { describe, expect, it } from "vitest";
import { initialState } from "@dcb/engine/legacy";
import { canMoveToNextStep } from "./canMoveToNextStep";

describe("canMoveToNextStep", () => {
  it("blocks single-select entity steps when nothing is selected", () => {
    expect(
      canMoveToNextStep({
        stepIndex: 0,
        wizardStepCount: 3,
        currentStep: {
          id: "race",
          source: { type: "entityType", limit: 1 },
        },
        state: initialState,
      }),
    ).toBe(false);
  });

  it("allows single-select entity steps once a selection exists", () => {
    expect(
      canMoveToNextStep({
        stepIndex: 0,
        wizardStepCount: 3,
        currentStep: {
          id: "race",
          source: { type: "entityType", limit: 1 },
        },
        state: {
          ...initialState,
          selections: { ...initialState.selections, race: "human" },
        },
      }),
    ).toBe(true);
  });

  it("does not block non-entity steps", () => {
    expect(
      canMoveToNextStep({
        stepIndex: 1,
        wizardStepCount: 4,
        currentStep: { id: "abilities", source: { type: "manual" } },
        state: initialState,
      }),
    ).toBe(true);
  });
});
