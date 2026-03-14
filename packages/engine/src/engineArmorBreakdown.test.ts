import type { LoadedPack } from "@dcb/datapack";
import {
  applyChoice,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it,
  makePack,
  resolveLoadedPacks
} from "./engineTestSupport";

describe("engine determinism", () => {
  it("classifies shield AC from item category and omits +0 in melee fallback damage", () => {
    const acPack: LoadedPack = {
      manifest: { id: "ac-pack", name: "AcPack", version: "1.0.0", priority: 5, dependencies: [] },
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
        items: [
          {
            id: "club",
            name: "Club",
            entityType: "items",
            summary: "Simple weapon",
            description: "Simple weapon",
            portraitUrl: null,
            iconUrl: null,
            effects: [],
            data: { category: "weapon", weaponType: "melee" }
          },
          {
            id: "buckler",
            name: "Buckler",
            entityType: "items",
            summary: "Shield",
            description: "Shield",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 1 } }],
            data: { category: "shield", weight: 5 }
          },
          {
            id: "chain-shirt",
            name: "Chain Shirt",
            entityType: "items",
            summary: "Armor",
            description: "Armor",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 4 } }],
            data: { category: "armor", weight: 25, armorCheckPenalty: -2 }
          }
        ],
        skills: [],
        rules: [
          {
            id: "base-ac",
            name: "Base AC",
            entityType: "rules",
            summary: "Base AC",
            description: "Base AC",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
          },
          {
            id: "shield-of-faith",
            name: "Shield of Faith",
            entityType: "rules",
            summary: "Magic AC bonus",
            description: "Magic AC bonus",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 2 } }]
          }
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
      packPath: "ac-pack"
    };
    const resolvedAc = resolveLoadedPacks([makePack("base", 1), acPack], ["ac-pack"]);
    const localContext = { enabledPackIds: ["ac-pack"], resolvedData: resolvedAc };

    let state = applyChoice(initialState, "name", "AC");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["club", "buckler", "chain-shirt"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.combat.ac.breakdown.armor).toBe(4);
    expect(sheet.phase1.combat.ac.breakdown.shield).toBe(1);
    expect(sheet.phase1.combat.ac.breakdown.misc).toBe(2);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("club");
    expect(sheet.phase1.combat.attacks.melee[0]?.damage).toBe("1d8");
  });
});
