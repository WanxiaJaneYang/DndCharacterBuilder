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
});
