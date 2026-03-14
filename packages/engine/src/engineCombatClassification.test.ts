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
  it("derives equipment load, ACP, and attack classification from entity data", () => {
    const dataDrivenPack: LoadedPack = {
      manifest: { id: "data-driven-pack", name: "DataDrivenPack", version: "1.0.0", priority: 5, dependencies: [] },
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
          effects: [],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: ["climb", "spot"],
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
        items: [
          {
            id: "training-axe",
            name: "Training Axe",
            entityType: "items",
            summary: "Training weapon",
            description: "Training weapon",
            portraitUrl: null,
            iconUrl: null,
            effects: [],
            data: { category: "weapon", weaponType: "melee", damage: "1d6", crit: "x3", weight: 7 }
          },
          {
            id: "test-armor",
            name: "Test Armor",
            entityType: "items",
            summary: "Test armor",
            description: "Test armor",
            portraitUrl: null,
            iconUrl: null,
            effects: [
              { kind: "add", targetPath: "stats.ac", value: { const: 4 } },
              { kind: "set", targetPath: "stats.speed", value: { const: 20 } }
            ],
            data: { category: "armor", weight: 25, armorCheckPenalty: -3 }
          }
        ],
        skills: [
          {
            id: "climb",
            name: "Climb",
            entityType: "skills",
            summary: "Climb",
            description: "Climb",
            portraitUrl: null,
            iconUrl: null,
            data: { ability: "str", armorCheckPenaltyApplies: true }
          },
          {
            id: "spot",
            name: "Spot",
            entityType: "skills",
            summary: "Spot",
            description: "Spot",
            portraitUrl: null,
            iconUrl: null,
            data: { ability: "wis", armorCheckPenaltyApplies: false }
          }
        ],
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
      packPath: "data-driven-pack"
    };
    const resolvedDataDriven = resolveLoadedPacks([makePack("base", 1), dataDrivenPack], ["data-driven-pack"]);
    const localContext = { enabledPackIds: ["data-driven-pack"], resolvedData: resolvedDataDriven };

    let state = applyChoice(initialState, "name", "Data");
    state = applyChoice(state, "abilities", { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["training-axe", "test-armor"], skills: { climb: 1, spot: 1 } } };

    const sheet = finalizeCharacter(state, localContext);
    const climb = sheet.phase2.skills.find((skill) => skill.id === "climb");
    const spot = sheet.phase2.skills.find((skill) => skill.id === "spot");

    expect(sheet.phase2.equipment.totalWeight).toBe(32);
    expect(sheet.phase2.equipment.loadCategory).toBe("light");
    expect(climb?.acp).toBe(-3);
    expect(spot?.acp).toBe(0);
    expect(sheet.phase1.combat.attacks.melee.some((attack) => attack.itemId === "training-axe")).toBe(true);
    expect(sheet.phase1.combat.attacks.melee.some((attack) => attack.itemId === "test-armor")).toBe(false);
  });
});
