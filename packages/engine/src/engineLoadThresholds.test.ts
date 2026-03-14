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
  it("applies carrying capacity size multiplier to load category thresholds", () => {
    const smallCarryPack: LoadedPack = {
      manifest: { id: "small-carry-pack", name: "SmallCarryPack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "smallfolk",
          name: "Smallfolk",
          entityType: "races",
          summary: "Small race",
          description: "Small race",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "small",
            baseSpeed: 30,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [],
            sizeModifiers: { ac: 1, attack: 1, hide: 4, carryingCapacityMultiplier: 0.75 }
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
          effects: [],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: [],
            progression: {
              levelGains: [{
                level: 1,
                bab: 1,
                fort: 2,
                ref: 0,
                will: 0,
                effects: [
                  { kind: "set", targetPath: "stats.bab", value: { const: 1 } },
                  { kind: "set", targetPath: "stats.fort", value: { const: 2 } },
                  { kind: "set", targetPath: "stats.ref", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.will", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.hp", value: { const: 10 } }
                ],
                featureChoices: []
              }]
            },
            baseAttackProgression: "full",
            baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
            levelTable: [{
              level: 1,
              bab: 1,
              fort: 2,
              ref: 0,
              will: 0,
              specials: [],
              spellsPerDay: null,
              spellsKnown: null
            }]
          }
        }],
        feats: [],
        items: [{
          id: "cargo-pack",
          name: "Cargo Pack",
          entityType: "items",
          summary: "Heavy cargo",
          description: "Heavy cargo",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { category: "gear", weight: 90 }
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
      packPath: "small-carry-pack"
    };
    const resolvedSmallCarry = resolveLoadedPacks([makePack("base", 1), smallCarryPack], ["small-carry-pack"]);
    const localContext = { enabledPackIds: ["small-carry-pack"], resolvedData: resolvedSmallCarry };

    let state = applyChoice(initialState, "name", "Carry");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "smallfolk");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["cargo-pack"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase2.equipment.totalWeight).toBe(90);
    expect(sheet.phase2.equipment.loadCategory).toBe("heavy");
    expect(sheet.phase1.combat.attacks.ranged).toEqual([]);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("unarmed-strike");
  });
});
