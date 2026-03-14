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
  it("applies multiple PHB synergy mappings from pack data without engine code changes", () => {
    let state = applyChoice(initialState, "name", "SynergyMatrix");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 12 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", {
      bluff: 5,
      "sense-motive": 5,
      jump: 5,
      tumble: 5
    }, context);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.skills.diplomacy?.miscBonus).toBe(4);
    expect(sheet.skills.intimidate?.miscBonus).toBe(2);
    expect(sheet.skills["sleight-of-hand"]?.miscBonus).toBe(2);
    expect(sheet.skills.tumble?.miscBonus).toBe(2);
    expect(sheet.skills.jump?.miscBonus).toBe(2);
    expect(sheet.skills.balance?.miscBonus).toBe(2);
    expect(sheet.phase2.skills.find((skill) => skill.id === "diplomacy")?.misc).toBe(4);
    expect(sheet.phase2.skills.find((skill) => skill.id === "tumble")?.misc).toBe(2);
    expect(sheet.phase2.skills.find((skill) => skill.id === "jump")?.misc).toBe(2);
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
});
