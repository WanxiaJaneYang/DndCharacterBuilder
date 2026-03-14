import type { LoadedPack } from "@dcb/datapack";
import {
  applyChoice,
  context,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it,
  listChoices,
  makePack,
  resolveLoadedPacks,
  validateState
} from "./engineTestSupport";

describe("engine determinism", () => {
  it("returns explicit config error when selected ability mode config is missing", () => {
    const steps = context.resolvedData.flow.steps.map((step) => {
      if (step.id !== "abilities") return step;
      const asRecord = step as Record<string, unknown>;
      return {
        ...asRecord,
        abilitiesConfig: {
          ...(asRecord.abilitiesConfig as Record<string, unknown>),
          pointBuy: undefined
        }
      };
    });
    const brokenContext = {
      ...context,
      resolvedData: {
        ...context.resolvedData,
        flow: {
          ...context.resolvedData.flow,
          steps
        }
      }
    };

    let state = applyChoice(initialState, "name", "BrokenAbilityConfig");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 32,
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, brokenContext as typeof context);
    expect(errors.some((error) => error.code === "ABILITY_MODE_CONFIG_MISSING")).toBe(true);
  });

  it("uses overriding pack id in provenance records", () => {
    const base = makePack("base", 1);
    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "base-ac", value: { effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 15 } }] } }];

    const resolvedOverride = resolveLoadedPacks([base, override], ["override"]);
    let state = applyChoice(initialState, "name", "Ref");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, { enabledPackIds: ["override"], resolvedData: resolvedOverride });
    const acSource = sheet.provenance.find((entry) => entry.targetPath === "stats.ac");

    expect(acSource?.setValue).toBe(15);
    expect(acSource?.source.packId).toBe("override");
  });
});
