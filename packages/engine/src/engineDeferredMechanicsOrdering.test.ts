import type { LoadedPack } from "@dcb/datapack";
import {
  applyChoice,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it,
  resolveLoadedPacks
} from "./engineTestSupport";

describe("engine determinism", () => {
  it("uses ordinal id ordering and preserves legacy impact path fallbacks", () => {
    const customPack: LoadedPack = {
      manifest: { id: "issue-pack", name: "IssuePack", version: "1.0.0", priority: 10, dependencies: [] },
      entities: {
        races: [{
          id: "human",
          name: "Human",
          entityType: "races",
          summary: "Human",
          description: "Human race",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "medium",
            baseSpeed: 30,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: ["Any"],
            favoredClass: "any",
            racialTraits: [],
            deferredMechanics: [
              {
                id: "alpha",
                category: "legacy",
                description: "Legacy fallback unresolved rule.",
                dependsOn: ["cap:legacy-support"],
                impactPaths: ["legacy:path"]
              },
              {
                id: "Beta",
                category: "modern",
                description: "Explicit impacts take precedence.",
                dependsOn: ["cap:modern-support"],
                impactPaths: ["legacy:ignored"],
                impacts: ["modern:kept"]
              }
            ]
          }
        }],
        classes: [{
          id: "fighter",
          name: "Fighter",
          entityType: "classes",
          summary: "Fighter",
          description: "Fighter class",
          portraitUrl: null,
          iconUrl: null,
          effects: []
        }],
        feats: [],
        items: [],
        skills: [],
        rules: [{
          id: "base-ac",
          name: "Base AC",
          entityType: "rules",
          summary: "Base AC",
          description: "Base AC rule",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
        }]
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
      packPath: "issue-pack"
    };

    const customContext = {
      enabledPackIds: ["issue-pack"],
      resolvedData: resolveLoadedPacks([customPack], ["issue-pack"])
    };

    let state = applyChoice(initialState, "name", "Casey");
    state = applyChoice(state, "abilities", { str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, customContext);

    expect(sheet.unresolvedRules).toEqual([
      {
        id: "issue-pack:races:human:Beta",
        category: "modern",
        description: "Explicit impacts take precedence.",
        dependsOn: ["cap:modern-support"],
        impacts: ["modern:kept"],
        source: {
          entityType: "races",
          entityId: "human",
          packId: "issue-pack"
        }
      },
      {
        id: "issue-pack:races:human:alpha",
        category: "legacy",
        description: "Legacy fallback unresolved rule.",
        dependsOn: ["cap:legacy-support"],
        impacts: ["legacy:path"],
        source: {
          entityType: "races",
          entityId: "human",
          packId: "issue-pack"
        }
      }
    ]);
  });
});
