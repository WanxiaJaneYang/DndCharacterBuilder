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
      classes: [{ id: "fighter-1", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: "assets/classes/fighter-portrait.png", iconUrl: "assets/icons/classes/fighter.png", effects: [] }],
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
    state = applyChoice(state, "class", "fighter-1");
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

  it("applies race-driven feat limit for humans", () => {
    const humanState = applyChoice(initialState, "race", "human");
    const humanFeatLimit = listChoices(humanState, context).find((c) => c.stepId === "feat")?.limit;

    const dwarfState = applyChoice(initialState, "race", "dwarf");
    const dwarfFeatLimit = listChoices(dwarfState, context).find((c) => c.stepId === "feat")?.limit;

    expect(humanFeatLimit).toBe(2);
    expect(dwarfFeatLimit).toBe(1);
  });

  it("computes skill budget and racial skill bonuses from race/class data", () => {
    let state = applyChoice(initialState, "name", "Lia");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "half-elf");
    state = applyChoice(state, "class", "fighter-1");
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
    state = applyChoice(state, "class", "fighter-1");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.decisions.skillPoints.total).toBe(4);
  });

  it("rejects fractional ranks for class skills", () => {
    let state = applyChoice(initialState, "name", "Ranks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-1");
    state = applyChoice(state, "skills", { climb: 0.5 });

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_CLASS_INTEGER")).toBe(true);
  });

  it("uses overriding pack id in provenance records", () => {
    const base = makePack("base", 1);
    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "base-ac", value: { effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 15 } }] } }];

    const resolvedOverride = resolveLoadedPacks([base, override], ["override"]);
    let state = applyChoice(initialState, "name", "Ref");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-1");

    const sheet = finalizeCharacter(state, { enabledPackIds: ["override"], resolvedData: resolvedOverride });
    const acSource = sheet.provenance.find((entry) => entry.targetPath === "stats.ac");

    expect(acSource?.setValue).toBe(15);
    expect(acSource?.source.packId).toBe("override");
  });
});
