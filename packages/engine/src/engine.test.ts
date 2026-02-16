import { describe, expect, it } from "vitest";
import { finalizeCharacter, initialState, applyChoice, listChoices } from "./index";
import { resolvePackSet } from "@dcb/datapack";
import path from "node:path";

const resolved = resolvePackSet(path.resolve(process.cwd(), "../../packs"), ["srd-35e-minimal"]);
const context = { enabledPackIds: ["srd-35e-minimal"], resolvedData: resolved };

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
});
