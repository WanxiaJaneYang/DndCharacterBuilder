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
  it("returns SKILL_RANK_MAX with level-scaled limits", () => {
    const levelSkillPack: LoadedPack = {
      manifest: { id: "level-skill-pack-2", name: "LevelSkillPack2", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{ id: "human", name: "Human", entityType: "races", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [], data: { size: "medium", baseSpeed: 30, abilityModifiers: {}, vision: { lowLight: false, darkvisionFeet: 0 }, automaticLanguages: ["Common"], bonusLanguages: [], favoredClass: "any", racialTraits: [] } }],
        classes: [{ id: "fighter-3", name: "Fighter 3", entityType: "classes", summary: "", description: "", portraitUrl: null, iconUrl: null, effects: [], data: { hitDie: 10, skillPointsPerLevel: 2, classSkills: ["climb"] } }],
        feats: [],
        items: [],
        skills: [{ id: "climb", name: "Climb", entityType: "skills", summary: "", description: "", portraitUrl: null, iconUrl: null, data: { ability: "str", armorCheckPenaltyApplies: true } }],
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
      packPath: "level-skill-pack-2"
    };
    const resolvedLevelSkills = resolveLoadedPacks([makePack("base", 1), levelSkillPack], ["level-skill-pack-2"]);
    const levelSkillContext = { enabledPackIds: ["level-skill-pack-2"], resolvedData: resolvedLevelSkills };

    let state = applyChoice(initialState, "name", "RankMaxLevel");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-3");
    state = { ...state, selections: { ...state.selections, skills: { climb: 7 } } };

    const errors = validateState(state, levelSkillContext);
    expect(errors.some((error) => error.code === "SKILL_RANK_MAX" && error.message.includes("6"))).toBe(true);
  });

  it("reports zero max ranks when no class level is selected", () => {
    let state = applyChoice(initialState, "name", "NoClassLevel");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");

    const sheet = finalizeCharacter(state, context);

    expect(sheet.decisions.skillPoints.total).toBe(0);
    expect(sheet.skills.climb?.maxRanks).toBe(0);
    expect(sheet.skills.listen?.maxRanks).toBe(0);
  });

  it("rejects non-integer skill point spending increments", () => {
    let state = applyChoice(initialState, "name", "SkillFraction");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { listen: 0.25 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_STEP")).toBe(true);
  });

  it("returns SKILL_POINTS_EXCEEDED when allocated skill cost exceeds budget", () => {
    let state = applyChoice(initialState, "name", "SkillBudget");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 4, diplomacy: 4 }, context);

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_POINTS_EXCEEDED")).toBe(true);
  });

  it("calculates skill-point spend from sanitized derived ranks", () => {
    let state = applyChoice(initialState, "name", "SkillBudgetRawRanks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 1.5, listen: 1.25 }, context);

    const sheet = finalizeCharacter(state, context);
    expect(sheet.decisions.skillPoints.spent).toBe(3);
    expect(sheet.decisions.skillPoints.remaining).toBe(9);
  });

  it("sanitizes derived skill math while preserving raw invalid ranks for validation", () => {
    let state = applyChoice(initialState, "name", "SkillBudgetDerivedClamp");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { climb: 1.5, listen: 1.25 }, context);

    const rawRanks = state.selections.skills as Record<string, number>;
    expect(rawRanks.climb).toBe(1.5);
    expect(rawRanks.listen).toBe(1.25);

    const errors = validateState(state, context);
    const sheet = finalizeCharacter(state, context);

    expect(errors.some((error) => error.code === "SKILL_RANK_CLASS_INTEGER")).toBe(true);
    expect(errors.some((error) => error.code === "SKILL_RANK_STEP")).toBe(true);
    expect(sheet.decisions.skillPoints.spent).toBe(3);
    expect(sheet.decisions.skillPoints.remaining).toBe(9);
    expect(sheet.skills.climb?.ranks).toBe(1);
    expect(sheet.skills.listen?.ranks).toBe(1);
  });
});
