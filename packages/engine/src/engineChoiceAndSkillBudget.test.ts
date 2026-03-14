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

  it("applies selected feat skill bonuses to skill totals and phase-2 misc values", () => {
    let state = applyChoice(initialState, "name", "Scout");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["acrobatic", "agile", "alertness"]);
    state = applyChoice(state, "skills", {
      jump: 1,
      tumble: 1,
      balance: 1,
      "escape-artist": 1,
      listen: 1,
      spot: 1
    });

    const sheet = finalizeCharacter(state, context);

    expect(sheet.skills.jump?.total).toBe(3);
    expect(sheet.skills.tumble?.total).toBe(3);
    expect(sheet.skills.balance?.total).toBe(3);
    expect(sheet.skills["escape-artist"]?.total).toBe(3);
    expect(sheet.skills.listen?.total).toBe(3);
    expect(sheet.skills.spot?.total).toBe(3);
    expect(sheet.phase2.skills.find((skill) => skill.id === "jump")?.misc).toBe(2);
    expect(sheet.phase2.skills.find((skill) => skill.id === "spot")?.misc).toBe(2);
    expect(sheet.skills.jump?.miscBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: "effect",
          bonus: 2
        })
      ])
    );
  });
});
