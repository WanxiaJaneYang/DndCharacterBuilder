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
  it("scales inferred HP hit-die breakdown by parsed class level suffix", () => {
    const levelPack: LoadedPack = {
      manifest: { id: "level-pack", name: "LevelPack", version: "1.0.0", priority: 5, dependencies: [] },
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
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: [],
            progression: {
              levelGains: [
                { level: 1, effects: [{ kind: "add", targetPath: "stats.hp", value: { const: 10 } }] },
                { level: 2, effects: [{ kind: "add", targetPath: "stats.hp", value: { const: 5 } }] },
                { level: 3, effects: [{ kind: "add", targetPath: "stats.hp", value: { const: 4 } }] }
              ]
            }
          }
        }],
        feats: [],
        items: [],
        skills: [],
        rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC", portraitUrl: null, iconUrl: null, effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
      packPath: "level-pack"
    };
    const resolvedLevel = resolveLoadedPacks([makePack("base", 1), levelPack], ["level-pack"]);
    const localContext = { enabledPackIds: ["level-pack"], resolvedData: resolvedLevel };

    let state = applyChoice(initialState, "name", "Level");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter-3");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.identity.level).toBe(3);
    expect(sheet.phase1.combat.hp.total).toBe(19);
    expect(sheet.phase1.combat.hp.breakdown.con).toBe(6);
    expect(sheet.phase1.combat.hp.breakdown.hitDie).toBe(13);
    expect(sheet.phase1.combat.hp.breakdown.misc).toBe(0);
    expect(sheet.decisions.skillPoints.total).toBe(12);
  });
});
