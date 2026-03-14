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
  it("includes a render-ready sheet view model with attack breakdowns and ACP flags", () => {
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
    state = applyChoice(state, "skills", { climb: 1 });
    state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"]);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.sheetViewModel.combat.ac).toMatchObject({
      total: 18,
      touch: 11,
      flatFooted: 17
    });
    expect(sheet.sheetViewModel.combat.ac.components).toEqual(
      expect.arrayContaining([
        { id: "base", label: "Base", value: 10 },
        { id: "armor", label: "Armor", value: 5 },
        { id: "shield", label: "Shield", value: 2 },
        { id: "dex", label: "Dex", value: 1 }
      ])
    );
    expect(sheet.sheetViewModel.combat.attacks).toEqual([
      expect.objectContaining({
        category: "melee",
        itemId: "longsword",
        name: "Longsword",
        attackBonus: 4,
        attackBonusBreakdown: {
          total: 4,
          bab: 1,
          ability: 3,
          size: 0,
          misc: 0
        },
        damage: "1d8",
        damageLine: "1d8+3",
        crit: "19-20/x2"
      })
    ]);
    expect(sheet.sheetViewModel.skills).toEqual(
      expect.arrayContaining([
        {
          id: "climb",
          name: "Climb",
          classSkill: true,
          ranks: 1,
          maxRanks: 4,
          costPerRank: 1,
          costSpent: 1,
          abilityKey: "str",
          abilityMod: 3,
          racialBonus: 0,
          misc: 0,
          acp: -7,
          acpApplied: true,
          total: -3
        },
        expect.objectContaining({
          id: "listen",
          name: "Listen",
          classSkill: false,
          abilityKey: "wis",
          costPerRank: 2,
          racialBonus: 0,
          abilityMod: 0,
          acp: 0,
          acpApplied: false
        })
      ])
    );
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
      hp: {
        total: 12,
        breakdown: {
          hitDie: 10,
          con: 2,
          misc: 0
        }
      },
      initiative: {
        total: 1,
        dex: 1,
        misc: 0
      },
      bab: 1,
      grapple: {
        total: 4,
        bab: 1,
        str: 3,
        size: 0,
        misc: 0
      },
      saves: {
        fort: {
          total: 4,
          base: 2,
          ability: 2,
          misc: 0
        },
        ref: {
          total: 1,
          base: 0,
          ability: 1,
          misc: 0
        },
        will: {
          total: 0,
          base: 0,
          ability: 0,
          misc: 0
        }
      },
      abilities: {
        str: { score: 16, mod: 3 },
        dex: { score: 12, mod: 1 },
        con: { score: 14, mod: 2 },
        int: { score: 10, mod: 0 },
        wis: { score: 10, mod: 0 },
        cha: { score: 8, mod: -1 }
      },
      speed: {
        base: 30,
        adjusted: 20
      },
      skillBudget: {
        total: 12,
        spent: 1,
        remaining: 11
      },
      rulesDecisions: {
        favoredClass: "any",
        ignoresMulticlassXpPenalty: true,
        featSelectionLimit: 3
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
      }
    });
  });
});
