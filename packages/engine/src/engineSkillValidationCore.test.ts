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
  it("keeps submitted skill ranks unchanged so validation can be engine-driven", () => {
    let state = applyChoice(initialState, "name", "Norm");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 1.5, listen: 1.5 }, context);

    const ranks = state.selections.skills as Record<string, number>;
    expect(ranks.climb).toBe(1.5);
    expect(ranks.listen).toBe(1.5);

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_CLASS_INTEGER")).toBe(true);
  });

  it("returns UNKNOWN_SKILL when selected skill does not exist", () => {
    let state = applyChoice(initialState, "name", "UnknownSkill");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { "not-a-real-skill": 1 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "UNKNOWN_SKILL")).toBe(true);
  });

  it("returns SKILL_RANK_INVALID for negative and non-finite skill ranks", () => {
    let state = applyChoice(initialState, "name", "InvalidSkillRanks");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: -1, jump: Number.POSITIVE_INFINITY } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_INVALID")).toBe(true);
  });

  it("returns SKILL_RANK_MAX when ranks exceed class/cross-class limits", () => {
    let state = applyChoice(initialState, "name", "RankMax");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: 5, listen: 2.5 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_MAX")).toBe(true);
  });

  it("computes total skill points and per-skill budget metadata at higher levels", () => {
    const levelSkillPack: LoadedPack = {
      manifest: { id: "level-skill-pack", name: "LevelSkillPack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "human",
          name: "Human",
          entityType: "races",
          summary: "Human",
          description: "Human race",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "medium",
            baseSpeed: 30,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [{ id: "extra-skill-points", name: "Extra Skill Points", summary: "", description: "" }]
          }
        }],
        classes: [{
          id: "fighter-3",
          name: "Fighter 3",
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
          { id: "climb", name: "Climb", entityType: "skills", summary: "", description: "", portraitUrl: null, iconUrl: null, data: { ability: "str", armorCheckPenaltyApplies: true } },
          { id: "listen", name: "Listen", entityType: "skills", summary: "", description: "", portraitUrl: null, iconUrl: null, data: { ability: "wis", armorCheckPenaltyApplies: false } }
        ],
        rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
      packPath: "level-skill-pack"
    };
    const resolvedLevelSkills = resolveLoadedPacks([makePack("base", 1), levelSkillPack], ["level-skill-pack"]);
    const levelSkillContext = { enabledPackIds: ["level-skill-pack"], resolvedData: resolvedLevelSkills };

    let state = applyChoice(initialState, "name", "Budget3");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 12, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-3");
    state = applyChoice(state, "skills", { climb: 6, listen: 3 }, levelSkillContext);

    const sheet = finalizeCharacter(state, levelSkillContext);

    expect(sheet.decisions.skillPoints.total).toBe(24);
    expect(sheet.decisions.skillPoints.spent).toBe(12);
    expect(sheet.decisions.skillPoints.remaining).toBe(12);
    expect(sheet.skills.climb?.ranks).toBe(6);
    expect(sheet.skills.climb?.costSpent).toBe(6);
    expect(sheet.skills.climb?.isClassSkill).toBe(true);
    expect(sheet.skills.climb?.maxRanks).toBe(6);
    expect(sheet.skills.listen?.ranks).toBe(3);
    expect(sheet.skills.listen?.costSpent).toBe(6);
    expect(sheet.skills.listen?.isClassSkill).toBe(false);
    expect(sheet.skills.listen?.maxRanks).toBe(3);
  });
});
