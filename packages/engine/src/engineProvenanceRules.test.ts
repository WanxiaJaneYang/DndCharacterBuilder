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

  it("applies min and max effects with the correct clamp semantics", () => {
    const clampPack: LoadedPack = {
      manifest: { id: "clamp-pack", name: "ClampPack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{ id: "human", name: "Human", entityType: "races", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [], data: { size: "medium", baseSpeed: 30, abilityModifiers: {}, vision: { lowLight: false, darkvisionFeet: 0 }, automaticLanguages: ["Common"], bonusLanguages: [], favoredClass: "any", racialTraits: [] } }],
        classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [], data: { hitDie: 10, skillPointsPerLevel: 2, classSkills: [] } }],
        feats: [],
        items: [],
        skills: [],
        rules: [
          { id: "base-ac", name: "Base AC", entityType: "rules", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] },
          { id: "ref-clamp", name: "Ref Clamp", entityType: "rules", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ref", value: { const: 10 } }, { kind: "min", targetPath: "stats.ref", value: { const: 8 } }] },
          { id: "will-floor", name: "Will Floor", entityType: "rules", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.will", value: { const: 10 } }, { kind: "max", targetPath: "stats.will", value: { const: 12 } }] }
        ]
      },
      flow: {
        steps: [
          { id: "name", kind: "metadata", label: "Name", source: { type: "manual" } },
          { id: "abilities", kind: "abilities", label: "Ability Scores", source: { type: "manual" } },
          { id: "race", kind: "race", label: "Race", source: { type: "entityType", entityType: "races", limit: 1 } },
          { id: "class", kind: "class", label: "Class", source: { type: "entityType", entityType: "classes", limit: 1 } }
        ]
      },
      patches: [],
      packPath: "clamp-pack"
    };

    let state = applyChoice(initialState, "name", "Clamp");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, {
      enabledPackIds: ["clamp-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), clampPack], ["clamp-pack"])
    });

    expect(sheet.phase1.combat.saves.ref.base).toBe(8);
    expect(sheet.phase1.combat.saves.will.base).toBe(12);
    expect(sheet.provenance).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetPath: "stats.ref", setValue: 8 }),
      expect.objectContaining({ targetPath: "stats.will", setValue: 12 })
    ]));
  });
});
