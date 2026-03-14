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

describe("engine determinism", () => {
  it("parses conditional predicate operators and discriminator strings case-insensitively", () => {
    const caseInsensitivePack: LoadedPack = {
      manifest: { id: "case-insensitive-pack", name: "CaseInsensitivePack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "human",
          name: "Human",
          entityType: "races",
          summary: "Human",
          description: "Human",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "medium",
            baseSpeed: 30,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: ["Any"],
            favoredClass: "any",
            racialTraits: []
          }
        }],
        classes: [{
          id: "fighter",
          name: "Fighter",
          entityType: "classes",
          summary: "Fighter",
          description: "Fighter",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { hitDie: 10, skillPointsPerLevel: 2, classSkills: ["climb"] }
        }],
        feats: [],
        items: [],
        skills: [
          { id: "climb", name: "Climb", entityType: "skills", summary: "Climb", description: "Climb", portraitUrl: null, iconUrl: null, data: { ability: "str", armorCheckPenaltyApplies: true } },
          { id: "balance", name: "Balance", entityType: "skills", summary: "Balance", description: "Balance", portraitUrl: null, iconUrl: null, data: { ability: "dex", armorCheckPenaltyApplies: true } }
        ],
        rules: [{
          id: "base-ac",
          name: "Base AC",
          entityType: "rules",
          summary: "Base AC",
          description: "Base AC",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
        }, {
          id: "case-predicate",
          name: "Case Predicate",
          entityType: "rules",
          summary: "Case Predicate",
          description: "Case-insensitive conditional parsing",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            conditionalModifiers: [{
              id: "case-insensitive-gte",
              source: { type: "misc" },
              when: {
                op: "GTE",
                left: { kind: "skillRanks", id: "climb" },
                right: 5
              },
              apply: {
                target: { kind: "SkIlL", id: "balance" },
                bonus: 3
              }
            }]
          }
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
      packPath: "case-insensitive-pack"
    };
    const caseInsensitiveContext = {
      enabledPackIds: ["case-insensitive-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), caseInsensitivePack], ["case-insensitive-pack"])
    };

    let state = applyChoice(initialState, "name", "CasePredicate");
    state = applyChoice(state, "abilities", { str: 12, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 5 }, caseInsensitiveContext);

    const sheet = finalizeCharacter(state, caseInsensitiveContext);
    expect(sheet.skills.balance?.miscBonus).toBe(3);
  });
});
