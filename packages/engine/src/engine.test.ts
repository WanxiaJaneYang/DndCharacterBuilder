import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "@dcb/datapack";
import { resolveLoadedPacks } from "@dcb/datapack";
import { resolvePackSet } from "@dcb/datapack/node";
import {
  finalizeCharacter,
  initialState,
  applyChoice,
  listChoices,
  validateState,
  normalizeCharacterSpec,
  characterSpecToState,
  validateCharacterSpec,
  compute
} from "./index";

const resolved = resolvePackSet(path.resolve(process.cwd(), "../../packs"), ["srd-35e-minimal"]);
const context = { enabledPackIds: ["srd-35e-minimal"], resolvedData: resolved };

function makePack(id: string, priority: number, dependencies: string[] = []): LoadedPack {
  return {
    manifest: { id, name: id, version: "1.0.0", priority, dependencies },
    entities: {
      races: [{ id: "human", name: "Human", entityType: "races", summary: "Human", description: "Human race", portraitUrl: "assets/races/human-portrait.png", iconUrl: "assets/icons/races/human.png", effects: [], data: { size: "medium", baseSpeed: 30, abilityModifiers: {}, vision: { lowLight: false, darkvisionFeet: 0 }, automaticLanguages: ["Common"], bonusLanguages: ["Any"], favoredClass: "any", racialTraits: [] } }],
      classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: "assets/classes/fighter-portrait.png", iconUrl: "assets/icons/classes/fighter.png", effects: [] }],
      feats: [],
      items: [],
      skills: [],
      rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC rule", portraitUrl: "assets/rules/base-ac-portrait.png", iconUrl: "assets/icons/rules/base-ac.png", effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
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
    packPath: id
  };
}

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

describe("engine determinism", () => {


  it("returns identical sheets for same inputs", () => {
    let state = applyChoice(initialState, "name", "Aric");
    state = applyChoice(state, "abilities", { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["power-attack"]);
    state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"]);

    const one = finalizeCharacter(state, context);
    const two = finalizeCharacter(state, context);

    expect(one).toEqual(two);
    expect(one.stats.ac).toBe(18);
    expect(one.stats.attackBonus).toBe(4);
    expect(one.stats.initiative).toBe(1);
    expect(one.phase1.combat.initiative.total).toBe(1);
    expect(one.phase1.combat.initiative.dex).toBe(1);
    expect(one.phase1.combat.initiative.misc).toBe(0);
    expect(one.phase1.identity.level).toBe(1);
    expect(one.phase1.combat.ac.touch).toBe(11);
    expect(one.phase1.combat.ac.flatFooted).toBe(17);
    expect(one.phase1.combat.attacks.melee.length).toBeGreaterThan(0);
    expect(one.phase2.feats.length).toBe(1);
    expect(one.phase2.feats[0]?.id).toBe("power-attack");
    expect(one.phase2.equipment.totalWeight).toBe(54);
    expect(one.phase2.movement.adjusted).toBe(20);
  });

  it("surfaces deferred mechanics from selected entities as deterministic unresolved rules", () => {
    let state = applyChoice(initialState, "name", "Durgan");
    state = applyChoice(state, "abilities", { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["acrobatic"]);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.unresolvedRules.map((rule) => rule.id)).toEqual([
      "srd-35e-minimal:classes:fighter:fighter-bonus-feat-runtime",
      "srd-35e-minimal:classes:fighter:fighter-proficiency-automation",
      "srd-35e-minimal:feats:acrobatic:acrobatic-benefit",
      "srd-35e-minimal:races:dwarf:dwarf-conditional-bonuses",
      "srd-35e-minimal:races:dwarf:dwarf-weapon-familiarity-proficiency"
    ]);
    expect(sheet.unresolvedRules).toEqual(expect.arrayContaining([
      {
        id: "srd-35e-minimal:feats:acrobatic:acrobatic-benefit",
        category: "feat-benefit",
        description: "GENERAL feat benefit is preserved from source text but not yet enforced by the current engine. You get a +2 bonus on all Jump checks and Tumble checks.",
        dependsOn: ["cap:feat-effect-runtime", "cap:character-sheet-feat-benefits"],
        impacts: ["skills:jump", "skills:tumble"],
        source: {
          entityType: "feats",
          entityId: "acrobatic",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:races:dwarf:dwarf-weapon-familiarity-proficiency",
        category: "proficiency",
        description: "Dwarven weapon familiarity is documented but not enforced by current equipment/proficiency mechanics.",
        dependsOn: ["cap:equipment-proficiency", "cap:equipment-validation"],
        impacts: ["proficiency:weapon:dwarven-waraxe", "proficiency:weapon:dwarven-urgrosh"],
        source: {
          entityType: "races",
          entityId: "dwarf",
          packId: "srd-35e-minimal"
        }
      }
    ]));
  });

  it("uses ordinal id ordering and preserves legacy impact path fallbacks", () => {
    const customPack: LoadedPack = {
      manifest: { id: "issue-pack", name: "IssuePack", version: "1.0.0", priority: 10, dependencies: [] },
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
            racialTraits: [],
            deferredMechanics: [
              {
                id: "alpha",
                category: "legacy",
                description: "Legacy fallback unresolved rule.",
                dependsOn: ["cap:legacy-support"],
                impactPaths: ["legacy:path"]
              },
              {
                id: "Beta",
                category: "modern",
                description: "Explicit impacts take precedence.",
                dependsOn: ["cap:modern-support"],
                impactPaths: ["legacy:ignored"],
                impacts: ["modern:kept"]
              }
            ]
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
          effects: []
        }],
        feats: [],
        items: [],
        skills: [],
        rules: [{
          id: "base-ac",
          name: "Base AC",
          entityType: "rules",
          summary: "Base AC",
          description: "Base AC rule",
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
      packPath: "issue-pack"
    };

    const customContext = {
      enabledPackIds: ["issue-pack"],
      resolvedData: resolveLoadedPacks([customPack], ["issue-pack"])
    };

    let state = applyChoice(initialState, "name", "Casey");
    state = applyChoice(state, "abilities", { str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, customContext);

    expect(sheet.unresolvedRules).toEqual([
      {
        id: "issue-pack:races:human:Beta",
        category: "modern",
        description: "Explicit impacts take precedence.",
        dependsOn: ["cap:modern-support"],
        impacts: ["modern:kept"],
        source: {
          entityType: "races",
          entityId: "human",
          packId: "issue-pack"
        }
      },
      {
        id: "issue-pack:races:human:alpha",
        category: "legacy",
        description: "Legacy fallback unresolved rule.",
        dependsOn: ["cap:legacy-support"],
        impacts: ["legacy:path"],
        source: {
          entityType: "races",
          entityId: "human",
          packId: "issue-pack"
        }
      }
    ]);
  });

  it("derives equipment load, ACP, and attack classification from entity data", () => {
    const dataDrivenPack: LoadedPack = {
      manifest: { id: "data-driven-pack", name: "DataDrivenPack", version: "1.0.0", priority: 5, dependencies: [] },
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
          description: "Fighter class",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: ["climb", "spot"],
            progression: {
              levelGains: [{
                level: 1,
                bab: 1,
                fort: 2,
                ref: 0,
                will: 0,
                effects: [
                  { kind: "set", targetPath: "stats.bab", value: { const: 1 } },
                  { kind: "set", targetPath: "stats.fort", value: { const: 2 } },
                  { kind: "set", targetPath: "stats.ref", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.will", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.hp", value: { const: 10 } }
                ],
                featureChoices: []
              }]
            },
            baseAttackProgression: "full",
            baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
            levelTable: [{
              level: 1,
              bab: 1,
              fort: 2,
              ref: 0,
              will: 0,
              specials: [],
              spellsPerDay: null,
              spellsKnown: null
            }]
          }
        }],
        feats: [],
        items: [
          {
            id: "training-axe",
            name: "Training Axe",
            entityType: "items",
            summary: "Training weapon",
            description: "Training weapon",
            portraitUrl: null,
            iconUrl: null,
            effects: [],
            data: { category: "weapon", weaponType: "melee", damage: "1d6", crit: "x3", weight: 7 }
          },
          {
            id: "test-armor",
            name: "Test Armor",
            entityType: "items",
            summary: "Test armor",
            description: "Test armor",
            portraitUrl: null,
            iconUrl: null,
            effects: [
              { kind: "add", targetPath: "stats.ac", value: { const: 4 } },
              { kind: "set", targetPath: "stats.speed", value: { const: 20 } }
            ],
            data: { category: "armor", weight: 25, armorCheckPenalty: -3 }
          }
        ],
        skills: [
          {
            id: "climb",
            name: "Climb",
            entityType: "skills",
            summary: "Climb",
            description: "Climb",
            portraitUrl: null,
            iconUrl: null,
            data: { ability: "str", armorCheckPenaltyApplies: true }
          },
          {
            id: "spot",
            name: "Spot",
            entityType: "skills",
            summary: "Spot",
            description: "Spot",
            portraitUrl: null,
            iconUrl: null,
            data: { ability: "wis", armorCheckPenaltyApplies: false }
          }
        ],
        rules: [
          {
            id: "base-ac",
            name: "Base AC",
            entityType: "rules",
            summary: "Base AC",
            description: "Base AC",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
          }
        ]
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
      packPath: "data-driven-pack"
    };
    const resolvedDataDriven = resolveLoadedPacks([makePack("base", 1), dataDrivenPack], ["data-driven-pack"]);
    const localContext = { enabledPackIds: ["data-driven-pack"], resolvedData: resolvedDataDriven };

    let state = applyChoice(initialState, "name", "Data");
    state = applyChoice(state, "abilities", { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["training-axe", "test-armor"], skills: { climb: 1, spot: 1 } } };

    const sheet = finalizeCharacter(state, localContext);
    const climb = sheet.phase2.skills.find((skill) => skill.id === "climb");
    const spot = sheet.phase2.skills.find((skill) => skill.id === "spot");

    expect(sheet.phase2.equipment.totalWeight).toBe(32);
    expect(sheet.phase2.equipment.loadCategory).toBe("light");
    expect(climb?.acp).toBe(-3);
    expect(spot?.acp).toBe(0);
    expect(sheet.phase1.combat.attacks.melee.some((attack) => attack.itemId === "training-axe")).toBe(true);
    expect(sheet.phase1.combat.attacks.melee.some((attack) => attack.itemId === "test-armor")).toBe(false);
  });

  it("classifies shield AC from item category and omits +0 in melee fallback damage", () => {
    const acPack: LoadedPack = {
      manifest: { id: "ac-pack", name: "AcPack", version: "1.0.0", priority: 5, dependencies: [] },
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
            racialTraits: []
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
        items: [
          {
            id: "club",
            name: "Club",
            entityType: "items",
            summary: "Simple weapon",
            description: "Simple weapon",
            portraitUrl: null,
            iconUrl: null,
            effects: [],
            data: { category: "weapon", weaponType: "melee" }
          },
          {
            id: "buckler",
            name: "Buckler",
            entityType: "items",
            summary: "Shield",
            description: "Shield",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 1 } }],
            data: { category: "shield", weight: 5 }
          },
          {
            id: "chain-shirt",
            name: "Chain Shirt",
            entityType: "items",
            summary: "Armor",
            description: "Armor",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 4 } }],
            data: { category: "armor", weight: 25, armorCheckPenalty: -2 }
          }
        ],
        skills: [],
        rules: [
          {
            id: "base-ac",
            name: "Base AC",
            entityType: "rules",
            summary: "Base AC",
            description: "Base AC",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }]
          },
          {
            id: "shield-of-faith",
            name: "Shield of Faith",
            entityType: "rules",
            summary: "Magic AC bonus",
            description: "Magic AC bonus",
            portraitUrl: null,
            iconUrl: null,
            effects: [{ kind: "add", targetPath: "stats.ac", value: { const: 2 } }]
          }
        ]
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
      packPath: "ac-pack"
    };
    const resolvedAc = resolveLoadedPacks([makePack("base", 1), acPack], ["ac-pack"]);
    const localContext = { enabledPackIds: ["ac-pack"], resolvedData: resolvedAc };

    let state = applyChoice(initialState, "name", "AC");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["club", "buckler", "chain-shirt"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.combat.ac.breakdown.armor).toBe(4);
    expect(sheet.phase1.combat.ac.breakdown.shield).toBe(1);
    expect(sheet.phase1.combat.ac.breakdown.misc).toBe(2);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("club");
    expect(sheet.phase1.combat.attacks.melee[0]?.damage).toBe("1d8");
  });

  it("omits +0 in unarmed fallback damage", () => {
    let state = applyChoice(initialState, "name", "Unarmed");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("unarmed-strike");
    expect(sheet.phase1.combat.attacks.melee[0]?.damage).toBe("1d3");
    expect(sheet.phase1.combat.attacks.melee[0]?.crit).toBe("20/x2");
  });

  it("normalizes short crit format and omits placeholder range for ranged weapons", () => {
    const rangedPack: LoadedPack = {
      manifest: { id: "ranged-pack", name: "RangedPack", version: "1.0.0", priority: 5, dependencies: [] },
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
            racialTraits: []
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
          id: "shortbow",
          name: "Shortbow",
          entityType: "items",
          summary: "Simple ranged weapon",
          description: "Simple ranged weapon",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { category: "weapon", weaponType: "ranged", damage: "1d6", crit: "x3" }
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
      packPath: "ranged-pack"
    };
    const resolvedRanged = resolveLoadedPacks([makePack("base", 1), rangedPack], ["ranged-pack"]);
    const localContext = { enabledPackIds: ["ranged-pack"], resolvedData: resolvedRanged };

    let state = applyChoice(initialState, "name", "Ranged");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["shortbow"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase1.combat.attacks.ranged).toHaveLength(1);
    expect(sheet.phase1.combat.attacks.ranged[0]?.crit).toBe("20/x3");
    expect(sheet.phase1.combat.attacks.ranged[0]?.range).toBeUndefined();
  });

  it("applies carrying capacity size multiplier to load category thresholds", () => {
    const smallCarryPack: LoadedPack = {
      manifest: { id: "small-carry-pack", name: "SmallCarryPack", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "smallfolk",
          name: "Smallfolk",
          entityType: "races",
          summary: "Small race",
          description: "Small race",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: {
            size: "small",
            baseSpeed: 30,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [],
            sizeModifiers: { ac: 1, attack: 1, hide: 4, carryingCapacityMultiplier: 0.75 }
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
          effects: [],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: [],
            progression: {
              levelGains: [{
                level: 1,
                bab: 1,
                fort: 2,
                ref: 0,
                will: 0,
                effects: [
                  { kind: "set", targetPath: "stats.bab", value: { const: 1 } },
                  { kind: "set", targetPath: "stats.fort", value: { const: 2 } },
                  { kind: "set", targetPath: "stats.ref", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.will", value: { const: 0 } },
                  { kind: "set", targetPath: "stats.hp", value: { const: 10 } }
                ],
                featureChoices: []
              }]
            },
            baseAttackProgression: "full",
            baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
            levelTable: [{
              level: 1,
              bab: 1,
              fort: 2,
              ref: 0,
              will: 0,
              specials: [],
              spellsPerDay: null,
              spellsKnown: null
            }]
          }
        }],
        feats: [],
        items: [{
          id: "cargo-pack",
          name: "Cargo Pack",
          entityType: "items",
          summary: "Heavy cargo",
          description: "Heavy cargo",
          portraitUrl: null,
          iconUrl: null,
          effects: [],
          data: { category: "gear", weight: 90 }
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
      packPath: "small-carry-pack"
    };
    const resolvedSmallCarry = resolveLoadedPacks([makePack("base", 1), smallCarryPack], ["small-carry-pack"]);
    const localContext = { enabledPackIds: ["small-carry-pack"], resolvedData: resolvedSmallCarry };

    let state = applyChoice(initialState, "name", "Carry");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "smallfolk");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, equipment: ["cargo-pack"] } };

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.phase2.equipment.totalWeight).toBe(90);
    expect(sheet.phase2.equipment.loadCategory).toBe("heavy");
    expect(sheet.phase1.combat.attacks.ranged).toEqual([]);
    expect(sheet.phase1.combat.attacks.melee[0]?.itemId).toBe("unarmed-strike");
  });

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
          id: "fighter-3",
          name: "Fighter 3",
          entityType: "classes",
          summary: "Level 3 fighter",
          description: "Level 3 fighter",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.hp", value: { const: 25 } }],
          data: {
            hitDie: 10,
            skillPointsPerLevel: 2,
            classSkills: []
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
    expect(sheet.phase1.combat.hp.total).toBe(25);
    expect(sheet.phase1.combat.hp.breakdown.con).toBe(6);
    expect(sheet.phase1.combat.hp.breakdown.hitDie).toBe(19);
    expect(sheet.phase1.combat.hp.breakdown.misc).toBe(0);
  });

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

  it("applies minimum level-1 skill budget floor before multiplier", () => {
    let state = applyChoice(initialState, "name", "LowInt");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 3, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.decisions.skillPoints.total).toBe(4);
  });

  it("rejects fractional ranks for class skills", () => {
    let state = applyChoice(initialState, "name", "Ranks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = { ...state, selections: { ...state.selections, skills: { climb: 0.5 } } };

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "SKILL_RANK_CLASS_INTEGER")).toBe(true);
  });

  it("recalculates ability modifiers after race effects", () => {
    let state = applyChoice(initialState, "name", "Orc");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "half-orc");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.abilities.str!.score).toBe(12);
    expect(sheet.abilities.str!.mod).toBe(1);
    expect(sheet.stats.attackBonus).toBe(2);
  });

  it("applies small-size combat modifiers to AC and attack bonus", () => {
    let state = applyChoice(initialState, "name", "Small");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "halfling");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);
    expect(sheet.stats.ac).toBe(11);
    expect(sheet.stats.attackBonus).toBe(1);
  });

  it("applies large-size fallback modifiers when race only provides size", () => {
    const largePack: LoadedPack = {
      manifest: { id: "large-race-pack", name: "LargeRace", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "ogrekin",
          name: "Ogrekin",
          entityType: "races",
          summary: "Large race",
          description: "Large race",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.speed", value: { const: 40 } }],
          data: {
            size: "large",
            baseSpeed: 40,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: []
          }
        }],
        classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: null, iconUrl: null, effects: [] }],
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
      packPath: "large-race-pack"
    };
    const resolvedLarge = resolveLoadedPacks([makePack("base", 1), largePack], ["large-race-pack"]);
    const localContext = { enabledPackIds: ["large-race-pack"], resolvedData: resolvedLarge };

    let state = applyChoice(initialState, "name", "Large");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "ogrekin");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.stats.ac).toBe(9);
    expect(sheet.stats.attackBonus).toBe(-1);
    expect(sheet.decisions.sizeModifiers.carryingCapacityMultiplier).toBe(2);
  });

  it("uses explicit race sizeModifiers override when provided", () => {
    const overridePack: LoadedPack = {
      manifest: { id: "override-race-pack", name: "OverrideRace", version: "1.0.0", priority: 5, dependencies: [] },
      entities: {
        races: [{
          id: "tinyling",
          name: "Tinyling",
          entityType: "races",
          summary: "Override race",
          description: "Override race",
          portraitUrl: null,
          iconUrl: null,
          effects: [{ kind: "set", targetPath: "stats.speed", value: { const: 20 } }],
          data: {
            size: "small",
            baseSpeed: 20,
            abilityModifiers: {},
            vision: { lowLight: false, darkvisionFeet: 0 },
            automaticLanguages: ["Common"],
            bonusLanguages: [],
            favoredClass: "any",
            racialTraits: [],
            sizeModifiers: { ac: 2, attack: 2, hide: 8, carryingCapacityMultiplier: 0.5 }
          }
        }],
        classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: null, iconUrl: null, effects: [] }],
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
      packPath: "override-race-pack"
    };
    const resolvedOverride = resolveLoadedPacks([makePack("base", 1), overridePack], ["override-race-pack"]);
    const localContext = { enabledPackIds: ["override-race-pack"], resolvedData: resolvedOverride };

    let state = applyChoice(initialState, "name", "Override");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "tinyling");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, localContext);
    expect(sheet.stats.ac).toBe(12);
    expect(sheet.stats.attackBonus).toBe(2);
    expect(sheet.decisions.sizeModifiers.hide).toBe(8);
    expect(sheet.decisions.sizeModifiers.carryingCapacityMultiplier).toBe(0.5);
  });

  it("exposes structured race bonus datasets in decision summary", () => {
    let state = applyChoice(initialState, "name", "Gnomish");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "gnome");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, context);

    expect(sheet.decisions.racialSaveBonuses.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialAttackBonuses.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialInnateSpellLikeAbilities.length).toBeGreaterThan(0);
    expect(sheet.decisions.racialSaveBonuses.some((bonus) => bonus.target === "illusions")).toBe(true);
  });

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

  it("keeps derived skill totals finite for pathological submitted ranks", () => {
    let state = applyChoice(initialState, "name", "HugeSkillRanks");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { listen: 1e308 }, context);

    const sheet = finalizeCharacter(state, context);

    expect(Number.isFinite(sheet.decisions.skillPoints.spent)).toBe(true);
    expect(Number.isFinite(sheet.decisions.skillPoints.remaining)).toBe(true);
    expect(Number.isFinite(sheet.skills.listen?.costSpent ?? NaN)).toBe(true);
    expect(Number.isFinite(sheet.skills.listen?.total ?? NaN)).toBe(true);
  });

  it("builds a legal fighter skill allocation with class and cross-class costs in the breakdown", () => {
    let state = applyChoice(initialState, "name", "SkillMath");
    state = applyChoice(state, "abilities", { str: 14, dex: 12, con: 10, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "equipment", ["chainmail"], context);
    state = applyChoice(state, "skills", { climb: 4, jump: 3, diplomacy: 0.5 }, context);

    const errors = validateState(state, context);
    const sheet = finalizeCharacter(state, context);
    const climb = sheet.skills.climb;
    const diplomacy = sheet.skills.diplomacy;
    const phase2Climb = sheet.phase2.skills.find((skill) => skill.id === "climb");

    expect(errors).toEqual([]);
    expect(sheet.decisions.skillPoints.total).toBe(12);
    expect(sheet.decisions.skillPoints.spent).toBe(8);
    expect(sheet.decisions.skillPoints.remaining).toBe(4);
    expect(climb).toMatchObject({
      classSkill: true,
      ranks: 4,
      costPerRank: 1,
      costSpent: 4,
      abilityMod: 2,
      total: 6
    });
    expect(diplomacy).toMatchObject({
      classSkill: false,
      ranks: 0.5,
      costPerRank: 2,
      costSpent: 1,
      abilityMod: -1,
      total: -0.5
    });
    expect(phase2Climb).toMatchObject({
      ranks: 4,
      ability: 2,
      misc: 0,
      acp: -5,
      total: 1
    });
  });

  it("does not apply synergy bonuses when effective cross-class source ranks are below threshold", () => {
    let state = applyChoice(initialState, "name", "SynergyBelowThreshold");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { tumble: 4.75 }, context);

    const sheet = finalizeCharacter(state, context);
    const balance = sheet.skills.balance;
    const phase2Balance = sheet.phase2.skills.find((skill) => skill.id === "balance");

    expect(sheet.skills.tumble?.ranks).toBe(4.5);
    expect(balance).toMatchObject({
      miscBonus: 0,
      total: 1
    });
    expect(phase2Balance).toMatchObject({
      misc: 0,
      total: 1
    });
  });

  it("applies 3.5 skill synergy at 5 effective source ranks and surfaces misc breakdown", () => {
    let state = applyChoice(initialState, "name", "SynergyAtThreshold");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", { tumble: 5 }, context);

    const sheet = finalizeCharacter(state, context);
    const balance = sheet.skills.balance;
    const phase2Balance = sheet.phase2.skills.find((skill) => skill.id === "balance");

    expect(sheet.skills.tumble?.ranks).toBe(5);
    expect(balance).toMatchObject({
      miscBonus: 2,
      total: 3
    });
    expect(balance?.miscBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "synergy-tumble-balance",
          sourceType: "skillSynergy",
          bonus: 2
        })
      ])
    );
    expect(phase2Balance).toMatchObject({
      misc: 2,
      total: 3
    });
  });

  it("applies multiple PHB synergy mappings from pack data without engine code changes", () => {
    let state = applyChoice(initialState, "name", "SynergyMatrix");
    state = applyChoice(state, "abilities", { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 12 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "skills", {
      bluff: 5,
      "sense-motive": 5,
      jump: 5,
      tumble: 5
    }, context);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.skills.diplomacy?.miscBonus).toBe(4);
    expect(sheet.skills.intimidate?.miscBonus).toBe(2);
    expect(sheet.skills["sleight-of-hand"]?.miscBonus).toBe(2);
    expect(sheet.skills.tumble?.miscBonus).toBe(2);
    expect(sheet.skills.jump?.miscBonus).toBe(2);
    expect(sheet.skills.balance?.miscBonus).toBe(2);
    expect(sheet.phase2.skills.find((skill) => skill.id === "diplomacy")?.misc).toBe(4);
    expect(sheet.phase2.skills.find((skill) => skill.id === "tumble")?.misc).toBe(2);
    expect(sheet.phase2.skills.find((skill) => skill.id === "jump")?.misc).toBe(2);
  });

  it("returns STEP_LIMIT_EXCEEDED when selections exceed dynamic feat limit", () => {
    let state = applyChoice(initialState, "name", "FeatLimit");
    state = applyChoice(state, "abilities", { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["power-attack", "weapon-focus-longsword", "unknown-feat"]);

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "STEP_LIMIT_EXCEEDED")).toBe(true);
  });

  it("rejects point-buy allocations above configured cap", () => {
    let state = applyChoice(initialState, "name", "PointBuy");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 20,
      scores: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(true);
  });

  it("sanitizes point-buy cap to configured bounds before validating", () => {
    let state = applyChoice(initialState, "name", "PointBuyCapClamp");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 999,
      scores: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(true);
  });

  it("rejects phb standardArray when scores are not one-use", () => {
    let state = applyChoice(initialState, "name", "PhbArray");
    state = applyChoice(state, "abilities", {
      mode: "phb",
      scores: { str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_PHB_ARRAY_INVALID")).toBe(true);
  });

  it("rejects rollSets state with no selected set", () => {
    let state = applyChoice(initialState, "name", "RollSets");
    state = applyChoice(state, "abilities", {
      mode: "rollSets",
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      rollSets: {
        generatedSets: [
          [15, 14, 13, 12, 10, 8],
          [14, 14, 13, 12, 10, 8],
          [13, 13, 13, 12, 10, 8],
          [16, 14, 12, 11, 10, 9],
          [15, 15, 12, 11, 10, 8]
        ],
        selectedSetIndex: -1
      }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_ROLLSETS_SELECTION_REQUIRED")).toBe(true);
  });

  it("rejects rollSets scores that do not come from selected set", () => {
    let state = applyChoice(initialState, "name", "RollSetsMismatch");
    state = applyChoice(state, "abilities", {
      mode: "rollSets",
      scores: { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 },
      rollSets: {
        generatedSets: [
          [15, 14, 13, 12, 10, 8],
          [14, 14, 13, 12, 10, 8],
          [13, 13, 13, 12, 10, 8],
          [16, 14, 12, 11, 10, 9],
          [15, 15, 12, 11, 10, 8]
        ],
        selectedSetIndex: 0
      }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, context);
    expect(errors.some((error) => error.code === "ABILITY_ROLLSETS_SET_MISMATCH")).toBe(true);
  });

  it("returns explicit config error when selected ability mode config is missing", () => {
    const steps = context.resolvedData.flow.steps.map((step) => {
      if (step.id !== "abilities") return step;
      const asRecord = step as Record<string, unknown>;
      return {
        ...asRecord,
        abilitiesConfig: {
          ...(asRecord.abilitiesConfig as Record<string, unknown>),
          pointBuy: undefined
        }
      };
    });
    const brokenContext = {
      ...context,
      resolvedData: {
        ...context.resolvedData,
        flow: {
          ...context.resolvedData.flow,
          steps
        }
      }
    };

    let state = applyChoice(initialState, "name", "BrokenAbilityConfig");
    state = applyChoice(state, "abilities", {
      mode: "pointBuy",
      pointCap: 32,
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
    });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const errors = validateState(state, brokenContext as typeof context);
    expect(errors.some((error) => error.code === "ABILITY_MODE_CONFIG_MISSING")).toBe(true);
  });

  it("uses overriding pack id in provenance records", () => {
    const base = makePack("base", 1);
    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "base-ac", value: { effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 15 } }] } }];

    const resolvedOverride = resolveLoadedPacks([base, override], ["override"]);
    let state = applyChoice(initialState, "name", "Ref");
    state = applyChoice(state, "abilities", { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const sheet = finalizeCharacter(state, { enabledPackIds: ["override"], resolvedData: resolvedOverride });
    const acSource = sheet.provenance.find((entry) => entry.targetPath === "stats.ac");

    expect(acSource?.setValue).toBe(15);
    expect(acSource?.source.packId).toBe("override");
  });
});

describe("CharacterSpec v1", () => {
  it("normalizes a minimal flow-independent spec and passes validation", () => {
    const normalized = normalizeCharacterSpec({
      meta: {
        rulesetId: "  DnD35E  ",
        sourceIds: [" srd-35e-minimal ", "srd-35e-minimal"]
      },
      raceId: " Human ",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { " Climb ": 2, "": 1, Spot: -1 },
      featIds: [" Power-Attack ", "power-attack"],
      equipmentIds: [" Longsword ", "longsword"]
    });

    expect(normalized.meta.rulesetId).toBe("dnd35e");
    expect(normalized.meta.sourceIds).toEqual(["srd-35e-minimal"]);
    expect(normalized.raceId).toBe("human");
    expect(normalized.skillRanks).toEqual({ climb: 2 });
    expect(normalized.featIds).toEqual(["power-attack"]);
    expect(normalized.equipmentIds).toEqual(["longsword"]);
    expect(validateCharacterSpec(normalized)).toEqual([]);
  });

  it("maps CharacterSpec to legacy CharacterState for engine compatibility", () => {
    const state = characterSpecToState({
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 3 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { climb: 4, listen: 2 },
      featIds: ["power-attack"],
      equipmentIds: ["longsword"]
    });

    expect(state.metadata).toEqual({ name: "Aric" });
    expect(state.abilities).toEqual({ str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    expect(state.selections.race).toBe("human");
    expect(state.selections.class).toBe("fighter-3");
    expect(state.selections.skills).toEqual({ climb: 4, listen: 2 });
    expect(state.selections.feats).toEqual(["power-attack"]);
    expect(state.selections.equipment).toEqual(["longsword"]);
  });

  it("omits legacy skills selection when normalized skillRanks are empty", () => {
    const state = characterSpecToState({
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: {}
    });

    expect(state.selections.skills).toBeUndefined();
  });

  it("drops malformed optional ids during normalization and state mapping", () => {
    const spec = {
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "   ",
      class: { classId: "   ", level: 0 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      featIds: ["power-attack"]
    };

    const normalized = normalizeCharacterSpec(spec);
    const state = characterSpecToState(spec);

    expect(normalized.raceId).toBeUndefined();
    expect(normalized.class).toBeUndefined();
    expect(state.selections.race).toBeUndefined();
    expect(state.selections.class).toBeUndefined();
  });

  it("reports invalid sourceIds shape instead of silently normalizing non-array values", () => {
    const invalidSpec = {
      meta: { rulesetId: "dnd35e", sourceIds: "srd-35e-minimal" },
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    } as unknown as Parameters<typeof normalizeCharacterSpec>[0];

    const issues = validateCharacterSpec(invalidSpec);
    expect(issues.some((issue) => issue.code === "SPEC_META_SOURCEIDS_INVALID")).toBe(true);
  });

  it("reports SPEC_CLASS_LEVEL_INVALID for raw class levels before normalization", () => {
    for (const level of [0, -1, 1.9]) {
      const issues = validateCharacterSpec({
        meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        class: { classId: "fighter", level },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
      });

      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "SPEC_CLASS_LEVEL_INVALID",
            path: "class.level"
          })
        ])
      );
    }
  });

  it("does not throw when class is null in malformed runtime input", () => {
    const malformedSpec = {
      meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      class: null,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    } as unknown as Parameters<typeof validateCharacterSpec>[0];

    expect(() => validateCharacterSpec(malformedSpec)).not.toThrow();
  });
});

describe("compute() contract", () => {
  it("returns versioned ComputeResult for a canonical CharacterSpec", () => {
    const result = compute(
      {
        meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );
    const schemaVersion: "0.1" = result.schemaVersion;
    const sheetSchemaVersion: "0.1" = result.sheetViewModel.schemaVersion;

    expect(schemaVersion).toBe("0.1");
    expect(sheetSchemaVersion).toBe("0.1");
    expect(result.sheetViewModel.data.combat.ac.total).toBe(18);
    expect(result.sheetViewModel.data.review).toMatchObject({
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
        spent: 8,
        remaining: 4
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
    expect(result.sheetViewModel.data.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "climb",
          classSkill: true,
          maxRanks: 4,
          costPerRank: 1,
          costSpent: 4,
          racialBonus: 0
        }),
        expect.objectContaining({
          id: "diplomacy",
          classSkill: false,
          maxRanks: 2,
          costPerRank: 2,
          costSpent: 1,
          racialBonus: 0
        })
      ])
    );
    expect(result.validationIssues).toEqual([]);
    expect(result.unresolved).toEqual(expect.any(Array));
    expect(result.assumptions).toEqual(expect.any(Array));
  });

  it("projects review context and skill metadata through the public ComputeResult contract", () => {
    const result = compute(
      {
        meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    const climb = result.sheetViewModel.data.skills.find((skill) => skill.id === "climb");
    const diplomacy = result.sheetViewModel.data.skills.find((skill) => skill.id === "diplomacy");

    expect(result.sheetViewModel.data.review).toMatchObject({
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

  it("does not apply flow-default point-buy validation to flow-independent CharacterSpec abilities", () => {
    const result = compute(
      {
        meta: { name: "Rolled Case", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 },
        featIds: ["power-attack"],
        skillRanks: { climb: 4 }
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(result.validationIssues.some((issue) => issue.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(false);
  });

  it("sanitizes non-finite ability inputs before compute output reaches JSON serialization", () => {
    const result = compute(
      {
        meta: { name: "NaN Case", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: Number.NaN, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        featIds: ["power-attack"],
        skillRanks: { climb: 4 }
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    const serialized = JSON.parse(JSON.stringify(result));
    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_ABILITIES_INVALID",
          path: "abilities.str"
        })
      ])
    );
    expect(serialized.sheetViewModel.data.review.abilities.str).toEqual({ score: 10, mod: 0 });
    expect(result.assumptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_ABILITY_DEFAULTED",
          path: "abilities.str",
          defaultUsed: 10
        })
      ])
    );
  });

  it("preserves numerically valid string abilities in compute output while still reporting validation", () => {
    const malformedSpec = {
      meta: { name: "String Ability", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: "18", dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      featIds: ["power-attack"],
      skillRanks: { climb: 4 }
    } as unknown as Parameters<typeof compute>[0];

    const result = compute(malformedSpec, {
      resolvedData: context.resolvedData,
      enabledPackIds: context.enabledPackIds
    });

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_ABILITIES_INVALID",
          path: "abilities.str"
        })
      ])
    );
    expect(result.sheetViewModel.data.review.abilities.str).toEqual({ score: 18, mod: 4 });
    expect(result.assumptions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_ABILITY_DEFAULTED",
          path: "abilities.str"
        })
      ])
    );
  });

  it("maps validation paths to CharacterSpec fields and records normalization assumptions", () => {
    const result = compute(
      {
        meta: { name: " ", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1.9 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "NAME_REQUIRED",
          path: "meta.name"
        }),
        expect.objectContaining({
          code: "SPEC_CLASS_LEVEL_INVALID",
          path: "class.level"
        })
      ])
    );
    expect(result.assumptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_CLASS_LEVEL_CLAMPED",
          path: "class.level",
          defaultUsed: 1
        })
      ])
    );
  });

  it("produces deterministic contract snapshot for same spec + rulepack", () => {
    const spec = {
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
      featIds: ["power-attack"],
      equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
    };
    const rulepack = { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds };

    const one = compute(spec, rulepack);
    const two = compute(spec, rulepack);
    const firstThreeSkills = ["climb", "diplomacy", "jump"]
      .map((id) => one.sheetViewModel.data.skills.find((skill) => skill.id === id))
      .filter((skill) => skill !== undefined);

    expect(one).toEqual(two);
    const contractSlice = {
      schemaVersion: one.schemaVersion,
      sheetViewModelSchemaVersion: one.sheetViewModel.schemaVersion,
      ac: one.sheetViewModel.data.combat.ac,
      firstAttack: one.sheetViewModel.data.combat.attacks[0],
      firstThreeSkills,
      review: one.sheetViewModel.data.review,
      validationIssueCodes: one.validationIssues.map((issue) => issue.code),
      unresolvedCodes: one.unresolved.map((entry) => entry.code)
    };

    expect(contractSlice).toMatchInlineSnapshot(`
      {
        "ac": {
          "components": [
            {
              "id": "base",
              "label": "Base",
              "value": 10,
            },
            {
              "id": "armor",
              "label": "Armor",
              "value": 5,
            },
            {
              "id": "shield",
              "label": "Shield",
              "value": 2,
            },
            {
              "id": "dex",
              "label": "Dex",
              "value": 1,
            },
            {
              "id": "size",
              "label": "Size",
              "value": 0,
            },
            {
              "id": "natural",
              "label": "Natural",
              "value": 0,
            },
            {
              "id": "deflection",
              "label": "Deflection",
              "value": 0,
            },
            {
              "id": "misc",
              "label": "Misc",
              "value": 0,
            },
          ],
          "flatFooted": 17,
          "total": 18,
          "touch": 11,
        },
        "firstAttack": {
          "attackBonus": 4,
          "attackBonusBreakdown": {
            "ability": 3,
            "bab": 1,
            "misc": 0,
            "size": 0,
            "total": 4,
          },
          "category": "melee",
          "crit": "19-20/x2",
          "damage": "1d8",
          "damageLine": "1d8+3",
          "itemId": "longsword",
          "name": "Longsword",
        },
        "firstThreeSkills": [
          {
            "abilityKey": "str",
            "abilityMod": 3,
            "acp": -7,
            "acpApplied": true,
            "classSkill": true,
            "costPerRank": 1,
            "costSpent": 4,
            "id": "climb",
            "maxRanks": 4,
            "misc": 0,
            "name": "Climb",
            "racialBonus": 0,
            "ranks": 4,
            "total": 0,
          },
          {
            "abilityKey": "cha",
            "abilityMod": -1,
            "acp": 0,
            "acpApplied": false,
            "classSkill": false,
            "costPerRank": 2,
            "costSpent": 1,
            "id": "diplomacy",
            "maxRanks": 2,
            "misc": 0,
            "name": "Diplomacy",
            "racialBonus": 0,
            "ranks": 0.5,
            "total": -0.5,
          },
          {
            "abilityKey": "str",
            "abilityMod": 3,
            "acp": -7,
            "acpApplied": true,
            "classSkill": true,
            "costPerRank": 1,
            "costSpent": 3,
            "id": "jump",
            "maxRanks": 4,
            "misc": 0,
            "name": "Jump",
            "racialBonus": 0,
            "ranks": 3,
            "total": -1,
          },
        ],
        "review": {
          "abilities": {
            "cha": {
              "mod": -1,
              "score": 8,
            },
            "con": {
              "mod": 2,
              "score": 14,
            },
            "dex": {
              "mod": 1,
              "score": 12,
            },
            "int": {
              "mod": 0,
              "score": 10,
            },
            "str": {
              "mod": 3,
              "score": 16,
            },
            "wis": {
              "mod": 0,
              "score": 10,
            },
          },
          "bab": 1,
          "equipmentLoad": {
            "loadCategory": "light",
            "reducesSpeed": true,
            "selectedItems": [
              "chainmail",
              "heavy-wooden-shield",
              "longsword",
            ],
            "totalWeight": 54,
          },
          "grapple": {
            "bab": 1,
            "misc": 0,
            "size": 0,
            "str": 3,
            "total": 4,
          },
          "hp": {
            "breakdown": {
              "con": 2,
              "hitDie": 10,
              "misc": 0,
            },
            "total": 12,
          },
          "identity": {
            "level": 1,
            "size": "medium",
            "speed": {
              "adjusted": 20,
              "base": 30,
            },
            "xp": 0,
          },
          "initiative": {
            "dex": 1,
            "misc": 0,
            "total": 1,
          },
          "movement": {
            "adjusted": 20,
            "base": 30,
            "reducedByArmorOrLoad": true,
          },
          "rulesDecisions": {
            "favoredClass": "any",
            "featSelectionLimit": 3,
            "ignoresMulticlassXpPenalty": true,
          },
          "saves": {
            "fort": {
              "ability": 2,
              "base": 2,
              "misc": 0,
              "total": 4,
            },
            "ref": {
              "ability": 1,
              "base": 0,
              "misc": 0,
              "total": 1,
            },
            "will": {
              "ability": 0,
              "base": 0,
              "misc": 0,
              "total": 0,
            },
          },
          "skillBudget": {
            "remaining": 4,
            "spent": 8,
            "total": 12,
          },
          "speed": {
            "adjusted": 20,
            "base": 30,
          },
        },
        "schemaVersion": "0.1",
        "sheetViewModelSchemaVersion": "0.1",
        "unresolvedCodes": [
          "srd-35e-minimal:classes:fighter:fighter-bonus-feat-runtime",
          "srd-35e-minimal:classes:fighter:fighter-proficiency-automation",
          "srd-35e-minimal:feats:power-attack:power-attack-benefit",
        ],
        "validationIssueCodes": [],
      }
    `);
  });
});
