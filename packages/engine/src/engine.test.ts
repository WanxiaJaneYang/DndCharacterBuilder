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
  });

  it("lists choices", () => {
    const choices = listChoices(initialState, context);
    expect(choices.find((c) => c.stepId === "race")?.options[0]?.id).toBe("human");
  });

  it("stores abilities selection payload with generation mode metadata", () => {
    const state = applyChoice(initialState, "abilities", {
      mode: "pointBuy",
      pointCap: 32,
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
    });

    expect(state.abilities).toEqual({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
    expect((state.selections.abilitiesMeta as { mode?: string; pointCap?: number } | undefined)?.mode).toBe("pointBuy");
    expect((state.selections.abilitiesMeta as { mode?: string; pointCap?: number } | undefined)?.pointCap).toBe(32);
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

  it("rejects point-buy allocations above configured cap", () => {
    let state = applyChoice(initialState, "name", "PointBuy");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 20,
      scores: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(true);
  });

  it("sanitizes point-buy cap to configured bounds before validating", () => {
    let state = applyChoice(initialState, "name", "PointBuyCapClamp");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 999,
      scores: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(true);
  });

  it("rejects phb standardArray when scores are not one-use", () => {
    let state = applyChoice(initialState, "name", "PhbArray");
    state = applyChoice(state, "abilities", {
      mode: "phb",
      scores: { str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_PHB_ARRAY_INVALID")).toBe(true);
  });

  it("rejects rollSets state with no selected set", () => {
    let state = applyChoice(initialState, "name", "RollSets");
    state = applyChoice(state, "abilities", {
      mode: "rollSets",
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      rollSets: {
        generatedSets: [
          [15, 14, 13, 12, 10, 8],
          [14, 14, 13, 12, 10, 8],
          [13, 13, 13, 12, 10, 8],
          [16, 14, 12, 11, 10, 9],
          [15, 15, 12, 11, 10, 8]
        ],
        selectedSetIndex: -1
      }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_ROLLSETS_SELECTION_REQUIRED")).toBe(true);
  });

  it("rejects rollSets scores that do not come from selected set", () => {
    let state = applyChoice(initialState, "name", "RollSetsMismatch");
    state = applyChoice(state, "abilities", {
      mode: "rollSets",
      scores: { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 },
      rollSets: {
        generatedSets: [
          [15, 14, 13, 12, 10, 8],
          [14, 14, 13, 12, 10, 8],
          [13, 13, 13, 12, 10, 8],
          [16, 14, 12, 11, 10, 9],
          [15, 15, 12, 11, 10, 8]
        ],
        selectedSetIndex: 0
      }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_ROLLSETS_SET_MISMATCH")).toBe(true);
  });

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
