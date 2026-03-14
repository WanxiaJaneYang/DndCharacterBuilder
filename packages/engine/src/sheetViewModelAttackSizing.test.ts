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
  it("uses attack size modifier instead of AC size modifier in attack breakdowns", () => {
    const sizePack: LoadedPack = {
      manifest: { id: "size-pack", name: "SizePack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "tinyling",
          name: "Tinyling",
          entityType: "races",
          summary: "Tinyling",
          description: "Tinyling race",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "small",
            baseSpeed: 20,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [],
            sizeModifiers: { ac: 2, attack: 1, hide: 8, carryingCapacityMultiplier: 0.5 }
          }
        }],
        classes: [{
          id: "fighter",
          name: "Fighter",
          entityType: "classes",
          summary: "Fighter",
          description: "Fighter class",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 1 } }],
          data: { hitDie: 10, skillPointsPerLevel: 2, classSkills: [] }
        }],
        feats: [],
        items: [{
          id: "club",
          name: "Club",
          entityType: "items",
          summary: "Club",
          description: "Club weapon",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { category: "weapon", weaponType: "melee", damage: "1d6", crit: "x2" }
        }],
        skills: [],
        rules: [{
          id: "base-ac",
          name: "Base AC",
          entityType: "rules",
          summary: "Base AC",
          description: "Base AC",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
        }]
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
      packPath: "size-pack"
    };
    const localContext = {
      enabledPackIds: ["size-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), sizePack], ["size-pack"])
    };

    let state = applyChoice(initialState, "name", "Tiny");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "tinyling");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["club"] } };

    const sheet = finalizeCharacter(state, localContext);

    expect(sheet.sheetViewModel.combat.attacks).toEqual([
      expect.objectContaining({
        itemId: "club",
        attackBonusBreakdown: {
          total: 2,
          bab: 1,
          ability: 0,
          size: 1,
          misc: 0
        }
      })
    ]);
  });
});
