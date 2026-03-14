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

describe("sheetViewModel", () => {
  it("includes review context and skill budget metadata needed by the UI", () => {
    let state = applyChoice(initialState, "name", "Aric");
    state = applyChoice(state, "abilities", {
      str: 16,
      dex: 12,
      con: 14,
      int: 10,
      wis: 10,
      cha: 8
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 4, jump: 3, diplomacy: 0.5 }, context);
    state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"], context);

    const sheet = finalizeCharacter(state, context);
    const climb = sheet.sheetViewModel.skills.find((skill) => skill.id === "climb");
    const diplomacy = sheet.sheetViewModel.skills.find((skill) => skill.id === "diplomacy");

    expect(sheet.sheetViewModel.review).toMatchObject({
      identity: {
        level: 1,
        xp: 0,
        size: "medium",
        speed: {
          base: 30,
          adjusted: 20
        }
      },
      bab: 1,
      speed: {
        base: 30,
        adjusted: 20
      },
      equipmentLoad: {
        selectedItems: expect.arrayContaining([
          "longsword",
          "chainmail",
          "heavy-wooden-shield"
        ]),
        totalWeight: 54,
        loadCategory: "light",
        reducesSpeed: true
      },
      movement: {
        base: 30,
        adjusted: 20,
        reducedByArmorOrLoad: true
      },
      rulesDecisions: {
        featSelectionLimit: 3,
        favoredClass: "any",
        ignoresMulticlassXpPenalty: true
      },
      skillBudget: {
        total: 12,
        spent: 8,
        remaining: 4
      }
    });
    expect(climb).toMatchObject({
      classSkill: true,
      costPerRank: 1,
      costSpent: 4,
      maxRanks: 4,
      racialBonus: 0
    });
    expect(diplomacy).toMatchObject({
      classSkill: false,
      costPerRank: 2,
      costSpent: 1,
      maxRanks: 2,
      racialBonus: 0
    });
  });

  it("derives the base AC component from the actual AC total", () => {
    const baseAcPack = makePack("base-ac-pack", 1);
    const rules = baseAcPack.entities.rules ?? [];
    rules[0] = {
      ...rules[0]!,
      effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 12 } }]
    };
    baseAcPack.entities.rules = rules;
    const baseAcContext = {
      enabledPackIds: ["base-ac-pack"],
      resolvedData: resolveLoadedPacks([baseAcPack], ["base-ac-pack"])
    };

    let state = applyChoice(initialState, "name", "Shielded");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, baseAcContext);

    expect(sheet.sheetViewModel.combat.ac.components).toEqual(
      expect.arrayContaining([
        { id: "base", label: "Base", value: 12 }
      ])
    );
  });
});
