import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "@dcb/datapack";
import { resolveLoadedPacks } from "@dcb/datapack";
import { resolvePackSet } from "@dcb/datapack/node";
import { finalizeCharacter, initialState, applyChoice, listChoices, validateState } from "./index";

const resolved = resolvePackSet(path.resolve(process.cwd(), "../../packs"), ["srd-35e-minimal"]);
const context = { enabledPackIds: ["srd-35e-minimal"], resolvedData: resolved };

function makePack(id: string, priority: number, dependencies: string[] = []): LoadedPack {
  return {
    manifest: { id, name: id, version: "1.0.0", priority, dependencies },
    entities: {
      races: [{ id: "human", name: "Human", entityType: "races", summary: "Human", description: "Human race", portraitUrl: "assets/races/human-portrait.png", iconUrl: "assets/icons/races/human.png", effects: [], data: { size: "medium", baseSpeed: 30, abilityModifiers: {}, vision: { lowLight: false, darkvisionFeet: 0 }, automaticLanguages: ["Common"], bonusLanguages: ["Any"], favoredClass: "any", racialTraits: [] } }],
      classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: "assets/classes/fighter-portrait.png", iconUrl: "assets/icons/classes/fighter.png", effects: [] }],
      feats: [],
      items: [],
      skills: [],
      rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC rule", portraitUrl: "assets/rules/base-ac-portrait.png", iconUrl: "assets/icons/rules/base-ac.png", effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
    packPath: id
  };
}

describe("engine determinism", () => {
  it("returns identical sheets for same inputs", () => {
    let state = applyChoice(initialState, "name", "Aric");
    state = applyChoice(state, "abilities", { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["power-attack"]);
    state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"]);

    const one = finalizeCharacter(state, context);
    const two = finalizeCharacter(state, context);

    expect(one).toEqual(two);
    expect(one.stats.ac).toBe(18);
    expect(one.stats.attackBonus).toBe(4);
    expect(one.stats.initiative).toBe(1);
    expect(one.phase1.combat.initiative.total).toBe(1);
    expect(one.phase1.combat.initiative.dex).toBe(1);
    expect(one.phase1.combat.initiative.misc).toBe(0);
    expect(one.phase1.identity.level).toBe(1);
    expect(one.phase1.combat.ac.touch).toBe(11);
    expect(one.phase1.combat.ac.flatFooted).toBe(17);
    expect(one.phase1.combat.attacks.melee.length).toBeGreaterThan(0);
    expect(one.phase2.feats.length).toBe(1);
    expect(one.phase2.feats[0]?.id).toBe("power-attack");
    expect(one.phase2.equipment.totalWeight).toBe(54);
    expect(one.phase2.movement.adjusted).toBe(20);
  });

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

  it("omits +0 in unarmed fallback damage", () => {
    let state = applyChoice(initialState, "name", "Unarmed");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("unarmed-strike");
    expect(sheet.phase1.combat.attacks.melee[0]?.damage).toBe("1d3");
  });

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
  });

  it("scales inferred HP hit-die breakdown by parsed class level suffix", () => {
    const levelPack: LoadedPack = {
      manifest: { id: "level-pack", name: "LevelPack", version: "1.0.0", priority: 5, dependencies: [] },
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
          id: "fighter-3",
          name: "Fighter 3",
          entityType: "classes",
          summary: "Level 3 fighter",
          description: "Level 3 fighter",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.hp", value: { const: 25 } }],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: []
          }
        }],
        feats: [],
        items: [],
        skills: [],
        rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
      packPath: "level-pack"
    };
    const resolvedLevel = resolveLoadedPacks([makePack("base", 1), levelPack], ["level-pack"]);
    const localContext = { enabledPackIds: ["level-pack"], resolvedData: resolvedLevel };

    let state = applyChoice(initialState, "name", "Level");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-3");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.identity.level).toBe(3);
    expect(sheet.phase1.combat.hp.total).toBe(25);
    expect(sheet.phase1.combat.hp.breakdown.con).toBe(6);
    expect(sheet.phase1.combat.hp.breakdown.hitDie).toBe(19);
    expect(sheet.phase1.combat.hp.breakdown.misc).toBe(0);
  });

  it("lists choices", () => {
    const choices = listChoices(initialState, context);
    expect(choices.find((c) => c.stepId === "race")?.options[0]?.id).toBe("human");
  });

  it("applies race-driven feat limit for humans", () => {
    const humanState = applyChoice(initialState, "race", "human");
    const humanFeatLimit = listChoices(humanState, context).find((c) => c.stepId === "feat")?.limit;

    const dwarfState = applyChoice(initialState, "race", "dwarf");
    const dwarfFeatLimit = listChoices(dwarfState, context).find((c) => c.stepId === "feat")?.limit;

    const dwarfFighterState = applyChoice(dwarfState, "class", "fighter");
    const dwarfFighterFeatLimit = listChoices(dwarfFighterState, context).find((c) => c.stepId === "feat")?.limit;

    expect(humanFeatLimit).toBe(2);
    expect(dwarfFeatLimit).toBe(1);
    expect(dwarfFighterFeatLimit).toBe(2);
  });

  it("computes skill budget and racial skill bonuses from race/class data", () => {
    let state = applyChoice(initialState, "name", "Lia");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "half-elf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 4, diplomacy: 2 });

    const sheet = finalizeCharacter(state, context);

    expect(sheet.decisions.skillPoints.total).toBe(8);
    expect(sheet.decisions.skillPoints.spent).toBe(8);
    expect(sheet.decisions.skillPoints.remaining).toBe(0);
    expect(sheet.skills.diplomacy?.racialBonus).toBe(2);
    expect(sheet.skills.diplomacy?.total).toBe(4);
    expect(sheet.decisions.favoredClass).toBe("any");
    expect(sheet.decisions.ignoresMulticlassXpPenalty).toBe(true);
  });

  it("applies minimum level-1 skill budget floor before multiplier", () => {
    let state = applyChoice(initialState, "name", "LowInt");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 3, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.decisions.skillPoints.total).toBe(4);
  });

  it("rejects fractional ranks for class skills", () => {
    let state = applyChoice(initialState, "name", "Ranks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: 0.5 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_CLASS_INTEGER")).toBe(true);
  });

  it("recalculates ability modifiers after race effects", () => {
    let state = applyChoice(initialState, "name", "Orc");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "half-orc");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.abilities.str!.score).toBe(12);
    expect(sheet.abilities.str!.mod).toBe(1);
    expect(sheet.stats.attackBonus).toBe(2);
  });

  it("applies small-size combat modifiers to AC and attack bonus", () => {
    let state = applyChoice(initialState, "name", "Small");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "halfling");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.stats.ac).toBe(11);
    expect(sheet.stats.attackBonus).toBe(1);
  });

  it("applies large-size fallback modifiers when race only provides size", () => {
    const largePack: LoadedPack = {
      manifest: { id: "large-race-pack", name: "LargeRace", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "ogrekin",
          name: "Ogrekin",
          entityType: "races",
          summary: "Large race",
          description: "Large race",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.speed", value: { const: 40 } }],
          data: {
            size: "large",
            baseSpeed: 40,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: []
          }
        }],
        classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: null, iconUrl: null, effects: [] }],
        feats: [],
        items: [],
        skills: [],
        rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
      packPath: "large-race-pack"
    };
    const resolvedLarge = resolveLoadedPacks([makePack("base", 1), largePack], ["large-race-pack"]);
    const localContext = { enabledPackIds: ["large-race-pack"], resolvedData: resolvedLarge };

    let state = applyChoice(initialState, "name", "Large");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "ogrekin");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.stats.ac).toBe(9);
    expect(sheet.stats.attackBonus).toBe(-1);
    expect(sheet.decisions.sizeModifiers.carryingCapacityMultiplier).toBe(2);
  });

  it("uses explicit race sizeModifiers override when provided", () => {
    const overridePack: LoadedPack = {
      manifest: { id: "override-race-pack", name: "OverrideRace", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "tinyling",
          name: "Tinyling",
          entityType: "races",
          summary: "Override race",
          description: "Override race",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.speed", value: { const: 20 } }],
          data: {
            size: "small",
            baseSpeed: 20,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [],
            sizeModifiers: { ac: 2, attack: 2, hide: 8, carryingCapacityMultiplier: 0.5 }
          }
        }],
        classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: null, iconUrl: null, effects: [] }],
        feats: [],
        items: [],
        skills: [],
        rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
      packPath: "override-race-pack"
    };
    const resolvedOverride = resolveLoadedPacks([makePack("base", 1), overridePack], ["override-race-pack"]);
    const localContext = { enabledPackIds: ["override-race-pack"], resolvedData: resolvedOverride };

    let state = applyChoice(initialState, "name", "Override");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "tinyling");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.stats.ac).toBe(12);
    expect(sheet.stats.attackBonus).toBe(2);
    expect(sheet.decisions.sizeModifiers.hide).toBe(8);
    expect(sheet.decisions.sizeModifiers.carryingCapacityMultiplier).toBe(0.5);
  });

  it("exposes structured race bonus datasets in decision summary", () => {
    let state = applyChoice(initialState, "name", "Gnomish");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "gnome");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);

    expect(sheet.decisions.racialSaveBonuses.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialAttackBonuses.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialInnateSpellLikeAbilities.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialSaveBonuses.some((bonus) => bonus.target === "illusions")).toBe(true);
  });

  it("normalizes class-skill ranks as integers when context is provided", () => {
    let state = applyChoice(initialState, "name", "Norm");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 1.5, listen: 1.5 }, context);

    const ranks = state.selections.skills as Record<string, number>;
    expect(ranks.climb).toBe(2);
    expect(ranks.listen).toBe(1.5);
  });

  it("returns UNKNOWN_SKILL when selected skill does not exist", () => {
    let state = applyChoice(initialState, "name", "UnknownSkill");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { "not-a-real-skill": 1 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "UNKNOWN_SKILL")).toBe(true);
  });

  it("returns SKILL_RANK_INVALID for negative and non-finite skill ranks", () => {
    let state = applyChoice(initialState, "name", "InvalidSkillRanks");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: -1, jump: Number.POSITIVE_INFINITY } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_INVALID")).toBe(true);
  });

  it("returns SKILL_RANK_MAX when ranks exceed class/cross-class limits", () => {
    let state = applyChoice(initialState, "name", "RankMax");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: 5, listen: 2.5 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_MAX")).toBe(true);
  });

  it("returns SKILL_POINTS_EXCEEDED when allocated skill cost exceeds budget", () => {
    let state = applyChoice(initialState, "name", "SkillBudget");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 4, diplomacy: 4 }, context);

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_POINTS_EXCEEDED")).toBe(true);
  });

  it("returns STEP_LIMIT_EXCEEDED when selections exceed dynamic feat limit", () => {
    let state = applyChoice(initialState, "name", "FeatLimit");
    state = applyChoice(state, "abilities", { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["power-attack", "weapon-focus-longsword", "unknown-feat"]);

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "STEP_LIMIT_EXCEEDED")).toBe(true);
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
