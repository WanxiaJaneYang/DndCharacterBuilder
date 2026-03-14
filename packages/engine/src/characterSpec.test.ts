import {
  characterSpecToState,
  describe,
  engineLegacyApi,
  enginePublicApi,
  expect,
  it,
  normalizeCharacterSpec,
  validateCharacterSpec
} from "./engineTestSupport";

describe("CharacterSpec v1", () => {
  it("keeps legacy wizard/state APIs off the top-level engine surface and behind the legacy entrypoint", () => {
    expect("characterSpecToState" in enginePublicApi).toBe(false);
    expect("initialState" in enginePublicApi).toBe(false);
    expect("applyChoice" in enginePublicApi).toBe(false);
    expect("listChoices" in enginePublicApi).toBe(false);
    expect("validateState" in enginePublicApi).toBe(false);
    expect("finalizeCharacter" in enginePublicApi).toBe(false);

    expect("initialState" in engineLegacyApi).toBe(true);
    expect("applyChoice" in engineLegacyApi).toBe(true);
    expect("listChoices" in engineLegacyApi).toBe(true);
    expect("validateState" in engineLegacyApi).toBe(true);
    expect("finalizeCharacter" in engineLegacyApi).toBe(true);
  });

  it("normalizes a minimal flow-independent spec and passes validation", () => {
    const normalized = normalizeCharacterSpec({
      meta: { rulesetId: "  DnD35E  ", sourceIds: [" srd-35e-minimal ", "srd-35e-minimal"] },
      raceId: " Human ",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { " Climb ": 2, "": 1, Spot: -1 },
      featIds: [" Power-Attack ", "power-attack"],
      equipmentIds: [" Longsword ", "longsword"]
    });

    expect(normalized.meta.rulesetId).toBe("dnd35e");
    expect(normalized.meta.sourceIds).toEqual(["srd-35e-minimal"]);
    expect(normalized.raceId).toBe("human");
    expect(normalized.skillRanks).toEqual({ climb: 2 });
    expect(normalized.featIds).toEqual(["power-attack"]);
    expect(normalized.equipmentIds).toEqual(["longsword"]);
    expect(validateCharacterSpec(normalized)).toEqual([]);
  });

  it("maps CharacterSpec to legacy CharacterState for engine compatibility", () => {
    const state = characterSpecToState({
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 3 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { climb: 4, listen: 2 },
      featIds: ["power-attack"],
      equipmentIds: ["longsword"]
    });

    expect(state.metadata).toEqual({ name: "Aric" });
    expect(state.abilities).toEqual({ str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    expect(state.selections.race).toBe("human");
    expect(state.selections.class).toBe("fighter-3");
    expect(state.selections.skills).toEqual({ climb: 4, listen: 2 });
    expect(state.selections.feats).toEqual(["power-attack"]);
    expect(state.selections.equipment).toEqual(["longsword"]);
  });

  it("omits legacy skills selection when normalized skillRanks are empty", () => {
    const state = characterSpecToState({
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: {}
    });

    expect(state.selections.skills).toBeUndefined();
  });

  it("drops malformed optional ids during normalization and state mapping", () => {
    const spec = {
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "   ",
      class: { classId: "   ", level: 0 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      featIds: ["power-attack"]
    };

    const normalized = normalizeCharacterSpec(spec);
    const state = characterSpecToState(spec);

    expect(normalized.raceId).toBeUndefined();
    expect(normalized.class).toBeUndefined();
    expect(state.selections.race).toBeUndefined();
    expect(state.selections.class).toBeUndefined();
  });

  it("reports invalid sourceIds shape instead of silently normalizing non-array values", () => {
    const invalidSpec = {
      meta: { rulesetId: "dnd35e", sourceIds: "srd-35e-minimal" },
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    } as unknown as Parameters<typeof normalizeCharacterSpec>[0];

    expect(validateCharacterSpec(invalidSpec).some((issue) => issue.code === "SPEC_META_SOURCEIDS_INVALID")).toBe(true);
  });

  it("reports SPEC_CLASS_LEVEL_INVALID for raw class levels before normalization", () => {
    for (const level of [0, -1, 1.9]) {
      expect(validateCharacterSpec({
        meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        class: { classId: "fighter", level },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
      })).toEqual(expect.arrayContaining([expect.objectContaining({ code: "SPEC_CLASS_LEVEL_INVALID", path: "class.level" })]));
    }
  });

  it("does not throw when class is null in malformed runtime input", () => {
    const malformedSpec = {
      meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      class: null,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    } as unknown as Parameters<typeof validateCharacterSpec>[0];

    expect(() => validateCharacterSpec(malformedSpec)).not.toThrow();
  });
});
