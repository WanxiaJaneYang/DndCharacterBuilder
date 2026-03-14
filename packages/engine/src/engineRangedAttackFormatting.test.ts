import type { LoadedPack } from "@dcb/datapack";
import {
  applyChoice,
  context,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it,
  makePack,
  resolveLoadedPacks
} from "./engineTestSupport";

describe("engine determinism", () => {
  it("omits +0 in unarmed fallback damage", () => {
    let state = applyChoice(initialState, "name", "Unarmed");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("unarmed-strike");
    expect(sheet.phase1.combat.attacks.melee[0]?.damage).toBe("1d3");
    expect(sheet.phase1.combat.attacks.melee[0]?.crit).toBe("20/x2");
  });

  it("normalizes short crit format and omits placeholder range for ranged weapons", () => {
    const rangedPack: LoadedPack = {
      manifest: { id: "ranged-pack", name: "RangedPack", version: "1.0.0", priority: 5, dependencies: [] },
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
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: []
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
          effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 1 } }],
          data: { hitDie: 10, skillPointsPerLevel: 2, classSkills: [] }
        }],
        feats: [],
        items: [{
          id: "shortbow",
          name: "Shortbow",
          entityType: "items",
          summary: "Simple ranged weapon",
          description: "Simple ranged weapon",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { category: "weapon", weaponType: "ranged", damage: "1d6", crit: "x3" }
        }],
        skills: [],
        rules: [{
          id: "base-ac",
          name: "Base AC",
          entityType: "rules",
          summary: "Base AC",
          description: "Base AC",
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
      packPath: "ranged-pack"
    };
    const resolvedRanged = resolveLoadedPacks([makePack("base", 1), rangedPack], ["ranged-pack"]);
    const localContext = { enabledPackIds: ["ranged-pack"], resolvedData: resolvedRanged };

    let state = applyChoice(initialState, "name", "Ranged");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["shortbow"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.combat.attacks.ranged).toHaveLength(1);
    expect(sheet.phase1.combat.attacks.ranged[0]?.crit).toBe("20/x3");
    expect(sheet.phase1.combat.attacks.ranged[0]?.range).toBeUndefined();
  });
});
