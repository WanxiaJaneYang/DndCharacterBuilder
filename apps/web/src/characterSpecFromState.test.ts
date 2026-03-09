import { describe, expect, it } from "vitest";
import { type CharacterState } from "@dcb/engine";
import { characterSpecFromState } from "./characterSpecFromState";

describe("characterSpecFromState", () => {
  it("maps wizard state and edition metadata into CharacterSpec", () => {
    const state: CharacterState = {
      metadata: { name: "Aric" },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      selections: {
        race: "human",
        class: "fighter",
        skills: { climb: 4, jump: 3, diplomacy: 0.5 },
        feats: ["power-attack"],
        equipment: ["longsword", "chainmail", "heavy-wooden-shield"],
      },
    };

    const spec = characterSpecFromState({
      state,
      rulesetId: "dnd-3.5-srd",
      sourceIds: ["srd-35e-minimal"],
    });

    expect(spec).toEqual({
      meta: {
        name: "Aric",
        rulesetId: "dnd-3.5-srd",
        sourceIds: ["srd-35e-minimal"],
      },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
      featIds: ["power-attack"],
      equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"],
    });
  });
});
