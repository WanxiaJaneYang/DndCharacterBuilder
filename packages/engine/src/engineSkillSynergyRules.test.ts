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
  it("keeps derived skill totals finite for pathological submitted ranks", () => {
    let state = applyChoice(initialState, "name", "HugeSkillRanks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { listen: 1e308 }, context);

    const sheet = finalizeCharacter(state, context);

    expect(Number.isFinite(sheet.decisions.skillPoints.spent)).toBe(true);
    expect(Number.isFinite(sheet.decisions.skillPoints.remaining)).toBe(true);
    expect(Number.isFinite(sheet.skills.listen?.costSpent ?? NaN)).toBe(true);
    expect(Number.isFinite(sheet.skills.listen?.total ?? NaN)).toBe(true);
  });

  it("builds a legal fighter skill allocation with class and cross-class costs in the breakdown", () => {
    let state = applyChoice(initialState, "name", "SkillMath");
    state = applyChoice(state, "abilities", { str: 14, dex: 12, con: 10, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "equipment", ["chainmail"], context);
    state = applyChoice(state, "skills", { climb: 4, jump: 3, diplomacy: 0.5 }, context);

    const errors = validateState(state, context);
    const sheet = finalizeCharacter(state, context);
    const climb = sheet.skills.climb;
    const diplomacy = sheet.skills.diplomacy;
    const phase2Climb = sheet.phase2.skills.find((skill) => skill.id === "climb");

    expect(errors).toEqual([]);
    expect(sheet.decisions.skillPoints.total).toBe(12);
    expect(sheet.decisions.skillPoints.spent).toBe(8);
    expect(sheet.decisions.skillPoints.remaining).toBe(4);
    expect(climb).toMatchObject({
      classSkill: true,
      ranks: 4,
      costPerRank: 1,
      costSpent: 4,
      abilityMod: 2,
      total: 6
    });
    expect(diplomacy).toMatchObject({
      classSkill: false,
      ranks: 0.5,
      costPerRank: 2,
      costSpent: 1,
      abilityMod: -1,
      total: -0.5
    });
    expect(phase2Climb).toMatchObject({
      ranks: 4,
      ability: 2,
      misc: 0,
      acp: -5,
      total: 1
    });
  });

  it("does not apply synergy bonuses when effective cross-class source ranks are below threshold", () => {
    let state = applyChoice(initialState, "name", "SynergyBelowThreshold");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { tumble: 4.75 }, context);

    const sheet = finalizeCharacter(state, context);
    const balance = sheet.skills.balance;
    const phase2Balance = sheet.phase2.skills.find((skill) => skill.id === "balance");

    expect(sheet.skills.tumble?.ranks).toBe(4.5);
    expect(balance).toMatchObject({
      miscBonus: 0,
      total: 1
    });
    expect(phase2Balance).toMatchObject({
      misc: 0,
      total: 1
    });
  });

  it("applies 3.5 skill synergy at 5 effective source ranks and surfaces misc breakdown", () => {
    let state = applyChoice(initialState, "name", "SynergyAtThreshold");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { tumble: 5 }, context);

    const sheet = finalizeCharacter(state, context);
    const balance = sheet.skills.balance;
    const phase2Balance = sheet.phase2.skills.find((skill) => skill.id === "balance");

    expect(sheet.skills.tumble?.ranks).toBe(5);
    expect(balance).toMatchObject({
      miscBonus: 2,
      total: 3
    });
    expect(balance?.miscBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "synergy-tumble-balance",
          sourceType: "skillSynergy",
          bonus: 2
        })
      ])
    );
    expect(phase2Balance).toMatchObject({
      misc: 2,
      total: 3
    });
  });
});
