import { describe, expect, it } from "vitest";
import {
  getSingleSelectedValue,
  getStepSelectionValues,
  localizeChoices,
  localizeWizardSteps,
} from "./wizardStepHelpers";

describe("wizardStepHelpers", () => {
  it("localizes wizard steps and entity choices with flow label overrides", () => {
    const wizardSteps = localizeWizardSteps(
      [
        {
          id: "race",
          label: "Race",
          kind: "choice",
          source: { type: "entityType", entityType: "races", limit: 1 },
        },
        {
          id: "review",
          label: "Review",
          kind: "review",
          source: { type: "static" },
        },
      ],
      { race: "Ancestry", review: "Summary" },
    );

    const localized = localizeChoices({
      choices: [
        {
          stepId: "race",
          label: "Race",
          options: [{ id: "human", label: "Human" }],
        },
        {
          stepId: "review",
          label: "Review",
          options: [],
        },
      ],
      wizardSteps,
      flowStepLabels: { race: "Ancestry", review: "Summary" },
      localizeEntityText: (entityType, entityId, path, fallback) =>
        entityType === "races" && entityId === "human" && path === "name"
          ? "Localized Human"
          : fallback,
    });

    expect(wizardSteps.map((step) => step.label)).toEqual([
      "Ancestry",
      "Summary",
    ]);
    expect(localized[0]).toMatchObject({
      stepId: "race",
      label: "Ancestry",
      options: [{ id: "human", label: "Localized Human" }],
    });
    expect(localized[1]).toMatchObject({
      stepId: "review",
      label: "Summary",
    });
  });

  it("normalizes feat selections separately from scalar selections", () => {
    const selections = {
      race: "human",
      feats: ["powerAttack"],
      equipment: ["chainmail", "shield"],
    };

    expect(getStepSelectionValues({ stepId: "race", selections })).toEqual([
      "human",
    ]);
    expect(
      getStepSelectionValues({
        stepId: "feat",
        selections,
        featStepId: "feat",
      }),
    ).toEqual(["powerAttack"]);
    expect(
      getStepSelectionValues({
        stepId: "equipment",
        selections,
      }),
    ).toEqual(["chainmail", "shield"]);
    expect(
      getSingleSelectedValue({
        stepId: "feat",
        selections,
        featStepId: "feat",
      }),
    ).toBe("powerAttack");
  });
});
