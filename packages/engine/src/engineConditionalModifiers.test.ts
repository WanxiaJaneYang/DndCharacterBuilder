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
  it("treats malformed composite conditional predicates as invalid and applies no bonus", () => {
    const malformedConditionalPack: LoadedPack = {
      manifest: { id: "malformed-conditional-pack", name: "MalformedConditionalPack", version: "1.0.0", priority: 5, dependencies: [] },
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
          id: "bad-composite",
          name: "Bad Composite",
          entityType: "rules",
          summary: "Bad Composite",
          description: "Should not apply when malformed",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            conditionalModifiers: [{
              id: "malformed-or",
              source: { type: "misc" },
              when: {
                op: "or",
                args: [
                  { op: "gte", left: { kind: "skillRanks", id: "climb" }, right: 1 },
                  { op: "gte", left: { kind: "not-skill-ranks", id: "climb" }, right: 1 }
                ]
              },
              apply: {
                target: { kind: "skill", id: "balance" },
                bonus: 9
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
      packPath: "malformed-conditional-pack"
    };
    const malformedContext = {
      enabledPackIds: ["malformed-conditional-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), malformedConditionalPack], ["malformed-conditional-pack"])
    };

    let state = applyChoice(initialState, "name", "MalformedPredicate");
    state = applyChoice(state, "abilities", { str: 12, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 1 }, malformedContext);

    const sheet = finalizeCharacter(state, malformedContext);
    expect(sheet.skills.balance?.miscBonus).toBe(0);
  });
});
