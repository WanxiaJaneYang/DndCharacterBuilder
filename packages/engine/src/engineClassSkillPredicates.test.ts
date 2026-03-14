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
  it("supports explicit isClassSkill predicates and retains isProficient compatibility", () => {
    const classSkillPredicatePack: LoadedPack = {
      manifest: { id: "class-skill-predicate-pack", name: "ClassSkillPredicatePack", version: "1.0.0", priority: 5, dependencies: [] },
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
          { id: "listen", name: "Listen", entityType: "skills", summary: "Listen", description: "Listen", portraitUrl: null, iconUrl: null, data: { ability: "wis", armorCheckPenaltyApplies: false } }
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
          id: "class-skill-predicate",
          name: "Class Skill Predicate",
          entityType: "rules",
          summary: "Class Skill Predicate",
          description: "Class-skill conditional parsing",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            conditionalModifiers: [
              {
                id: "is-class-skill",
                source: { type: "misc" },
                when: {
                  op: "isClassSkill",
                  target: { kind: "skill", id: "climb" }
                },
                apply: {
                  target: { kind: "skill", id: "listen" },
                  bonus: 2
                }
              },
              {
                id: "is-proficient-legacy",
                source: { type: "misc" },
                when: {
                  op: "isProficient",
                  target: { kind: "skill", id: "climb" }
                },
                apply: {
                  target: { kind: "skill", id: "listen" },
                  bonus: 1
                }
              }
            ]
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
      packPath: "class-skill-predicate-pack"
    };
    const classSkillPredicateContext = {
      enabledPackIds: ["class-skill-predicate-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), classSkillPredicatePack], ["class-skill-predicate-pack"])
    };

    let state = applyChoice(initialState, "name", "ClassSkillPredicate");
    state = applyChoice(state, "abilities", { str: 12, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, classSkillPredicateContext);
    expect(sheet.skills.listen?.miscBonus).toBe(3);
  });
});
