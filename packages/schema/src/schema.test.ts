import { describe, expect, it } from "vitest";
import * as schema from "./index";
import { AuthenticityLockSchema, EntitySchema, FlowSchema, ManifestSchema } from "./index";

const validTypedConditionExpr: schema.ConditionExpr = {
  op: "numeric-gte",
  left: {
    kind: "selection-metric",
    schemaId: "sel:progression-track",
    refId: "class:paladin",
    field: "amount"
  },
  right: { kind: "const", value: 4 }
};

void validTypedConditionExpr;

// @ts-expect-error unsupported engine-level primitive must remain outside the typed DSL
const invalidTypedConditionExpr: schema.ConditionExpr = { op: "min-level", value: 4 };

void invalidTypedConditionExpr;

describe("manifest schema", () => {
  it("validates minimal manifest", () => {
    const parsed = ManifestSchema.parse({
      id: "srd-35e-minimal",
      name: "SRD",
      version: "0.1.0",
      priority: 10,
      dependencies: []
    });
    expect(parsed.id).toBe("srd-35e-minimal");
  });
});

describe("flow schema", () => {
  it("rejects unknown step ids with a clear message", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "mystery", kind: "review", label: "Review", source: { type: "manual" } }
        ]
      })
    ).toThrow(/unknown step id: mystery/i);
  });

  it("rejects invalid kind for a known step id", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "review", kind: "metadata", label: "Review", source: { type: "manual" } }
        ]
      })
    ).toThrow(/invalid step kind/i);
  });

  it("requires entityType for entityType sources", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "race", kind: "race", label: "Race", source: { type: "entityType" } }
        ]
      })
    ).toThrow();
  });

  it("accepts skills as a manual step", () => {
    const parsed = FlowSchema.parse({
      steps: [
        { id: "skills", kind: "skills", label: "Skills", source: { type: "manual" } }
      ]
    });

    expect(parsed.steps[0]?.id).toBe("skills");
  });

  it("accepts abilities step with data-driven generation config", () => {
    const parsed = FlowSchema.parse({
      steps: [
        {
          id: "abilities",
          kind: "abilities",
          label: "Ability Scores",
          source: { type: "manual" },
          abilitiesConfig: {
            modes: ["pointBuy", "phb", "rollSets"],
            defaultMode: "pointBuy",
            pointBuy: {
              costTable: {
                "8": 0,
                "9": 1,
                "10": 2,
                "11": 3,
                "12": 4,
                "13": 5,
                "14": 6,
                "15": 8,
                "16": 10,
                "17": 13,
                "18": 16
              },
              defaultPointCap: 32,
              minPointCap: 20,
              maxPointCap: 40,
              pointCapStep: 1,
              minScore: 8,
              maxScore: 18
            },
            phb: {
              methodType: "standardArray",
              standardArray: [15, 14, 13, 12, 10, 8]
            },
            rollSets: {
              setsCount: 5,
              rollFormula: "4d6_drop_lowest",
              scoresPerSet: 6,
              assignmentPolicy: "assign_after_pick"
            }
          },
          abilityPresentation: {
            showExistingModifiers: true,
            groupBy: "sourceType",
            hideZeroEffectGroups: true,
            sourceTypeLabels: {
              races: "Race",
              classes: "Class",
              origins: "Origin"
            }
          }
        }
      ]
    });

    expect(parsed.steps[0]?.id).toBe("abilities");
  });

  it("rejects abilities config where defaultMode is not in modes", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy", "phb"],
              defaultMode: "rollSets"
            }
          }
        ]
      })
    ).toThrow(/defaultMode must be one of modes/i);
  });

  it("rejects point-buy config when cost table is missing a score in range", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1
                },
                defaultPointCap: 32,
                minPointCap: 20,
                maxPointCap: 40,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 10
              }
            }
          }
        ]
      })
    ).toThrow(/pointBuy.costTable must include all scores in configured range/i);
  });

  it("rejects point-buy config when minPointCap is greater than maxPointCap", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1,
                  "10": 2,
                  "11": 3,
                  "12": 4,
                  "13": 5,
                  "14": 6,
                  "15": 8,
                  "16": 10,
                  "17": 13,
                  "18": 16
                },
                defaultPointCap: 32,
                minPointCap: 40,
                maxPointCap: 20,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 18
              }
            }
          }
        ]
      })
    ).toThrow(/pointBuy minPointCap cannot be greater than maxPointCap/i);
  });

  it("rejects point-buy config when defaultPointCap is outside min and max bounds", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1,
                  "10": 2,
                  "11": 3,
                  "12": 4,
                  "13": 5,
                  "14": 6,
                  "15": 8,
                  "16": 10,
                  "17": 13,
                  "18": 16
                },
                defaultPointCap: 19,
                minPointCap: 20,
                maxPointCap: 40,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 18
              }
            }
          }
        ]
      })
    ).toThrow(/pointBuy defaultPointCap must be between minPointCap and maxPointCap/i);
  });

  it("rejects phb manualRange when minScore is greater than maxScore", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["phb"],
              defaultMode: "phb",
              phb: {
                methodType: "manualRange",
                manualRange: {
                  minScore: 18,
                  maxScore: 8
                }
              }
            }
          }
        ]
      })
    ).toThrow(/phb manualRange minScore cannot be greater than maxScore/i);
  });

  it("rejects rollSets config with setsCount lower than 1", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["rollSets"],
              defaultMode: "rollSets",
              rollSets: {
                setsCount: 0,
                rollFormula: "4d6_drop_lowest",
                scoresPerSet: 6,
                assignmentPolicy: "assign_after_pick"
              }
            }
          }
        ]
      })
    ).toThrow();
  });

  it("rejects unknown legacy modifierSources field in abilityPresentation", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1,
                  "10": 2,
                  "11": 3,
                  "12": 4,
                  "13": 5,
                  "14": 6,
                  "15": 8,
                  "16": 10,
                  "17": 13,
                  "18": 16
                },
                defaultPointCap: 32,
                minPointCap: 20,
                maxPointCap: 40,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 18
              }
            },
            abilityPresentation: {
              showExistingModifiers: true,
              modifierSources: ["race"]
            }
          }
        ]
      })
    ).toThrow();
  });

  it("rejects unknown abilityPresentation.modeUi keys", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1,
                  "10": 2,
                  "11": 3,
                  "12": 4,
                  "13": 5,
                  "14": 6,
                  "15": 8,
                  "16": 10,
                  "17": 13,
                  "18": 16
                },
                defaultPointCap: 32,
                minPointCap: 20,
                maxPointCap: 40,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 18
              }
            },
            abilityPresentation: {
              showExistingModifiers: true,
              modeUi: {
                pointBuyy: {
                  labelKey: "abilityModePointBuy",
                  hintKey: "abilityMethodHelpLabel"
                }
              }
            }
          }
        ]
      })
    ).toThrow();
  });

  it("rejects unknown fields inside abilityPresentation.modeUi entries", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            abilitiesConfig: {
              modes: ["pointBuy"],
              defaultMode: "pointBuy",
              pointBuy: {
                costTable: {
                  "8": 0,
                  "9": 1,
                  "10": 2,
                  "11": 3,
                  "12": 4,
                  "13": 5,
                  "14": 6,
                  "15": 8,
                  "16": 10,
                  "17": 13,
                  "18": 16
                },
                defaultPointCap: 32,
                minPointCap: 20,
                maxPointCap: 40,
                pointCapStep: 1,
                minScore: 8,
                maxScore: 18
              }
            },
            abilityPresentation: {
              showExistingModifiers: true,
              modeUi: {
                pointBuy: {
                  labelKey: "abilityModePointBuy",
                  hintKey: "abilityMethodHelpLabel",
                  lableKey: "typo"
                }
              }
            }
          }
        ]
      })
    ).toThrow();
  });



  it("rejects manual source for entity-selection kinds", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "race", kind: "race", label: "Race", source: { type: "manual" } }
        ]
      })
    ).toThrow(/expected entityType source, got manual/i);
  });

  it("rejects entityType source for manual-only kinds", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "review", kind: "review", label: "Review", source: { type: "entityType", entityType: "items" } }
        ]
      })
    ).toThrow(/expected manual source, got entityType/i);
  });

  it("rejects entityType/limit fields on manual sources", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "review",
            kind: "review",
            label: "Review",
            source: { type: "manual", entityType: "items", limit: 1 }
          }
        ]
      })
    ).toThrow();
  });
});

describe("race entity schema", () => {
  it("accepts structured race data", () => {
    const parsed = EntitySchema.parse({
      id: "elf",
      name: "Elf",
      entityType: "races",
      effects: [
        { kind: "set", targetPath: "stats.speed", value: { const: 30 } },
        { kind: "add", targetPath: "abilities.dex.score", value: { const: 2 } }
      ],
      summary: "Elf summary",
      description: "Elf detail",
      portraitUrl: "assets/races/elf-portrait.png",
      iconUrl: "assets/icons/races/elf.png",
      data: {
        size: "medium",
        baseSpeed: 30,
        abilityModifiers: { dex: 2, con: -2 },
        vision: { lowLight: true, darkvisionFeet: 0 },
        automaticLanguages: ["Common", "Elven"],
        bonusLanguages: ["Draconic"],
        favoredClass: "wizard",
        racialTraits: [{ id: "immune-sleep", name: "Immune to Sleep", description: "Immune to magical sleep effects." }],
        skillBonuses: [{ skill: "listen", bonus: 2, type: "racial" }],
        saveBonuses: [{ target: "enchantmentSpellsAndEffects", bonus: 2, type: "racial" }],
        attackBonuses: [{ target: "orcs", bonus: 1, type: "racial" }],
        innateSpellLikeAbilities: []
      }
    });

    expect(parsed.id).toBe("elf");
  });

  it("rejects race data missing required structured fields", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-race",
        name: "Broken Race",
        entityType: "races",
        summary: "Broken",
        description: "Broken",
        portraitUrl: "assets/races/broken-portrait.png",
        iconUrl: "assets/icons/races/broken.png",
        data: { size: "medium" }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("accepts race v2 structured fields for ancestry, size modifiers, movement overrides, AC bonuses, and spell DC bonuses", () => {
    const parsed = EntitySchema.parse({
      id: "half-elf",
      name: "Half-Elf",
      entityType: "races",
      summary: "Half-elf summary",
      description: "Half-elf detail",
      portraitUrl: null,
      iconUrl: null,
      data: {
        size: "medium",
        baseSpeed: 30,
        abilityModifiers: {},
        vision: { lowLight: true, darkvisionFeet: 0 },
        automaticLanguages: ["Common", "Elven"],
        bonusLanguages: ["Any (except secret languages)"],
        favoredClass: "any",
        racialTraits: [{ id: "elven-blood", name: "Elven Blood", description: "Counts as elf for race effects." }],
        ancestryTags: ["human", "elf"],
        sizeModifiers: {
          ac: 0,
          attack: 0,
          hide: 0,
          carryingCapacityMultiplier: 1
        },
        movementOverrides: {
          ignoreArmorSpeedReduction: false
        },
        acBonuses: [{ target: "giants", bonus: 4, type: "racial", when: "dodge bonus" }],
        spellDcBonuses: [{ school: "illusion", bonus: 1, type: "racial" }]
      }
    });

    expect(parsed.id).toBe("half-elf");
  });

  it("rejects race v2 fields with invalid ancestry tags", () => {
    expect(() =>
      EntitySchema.parse({
        id: "invalid-race",
        name: "Invalid Race",
        entityType: "races",
        summary: "Invalid",
        description: "Invalid",
        portraitUrl: null,
        iconUrl: null,
        data: {
          size: "medium",
          baseSpeed: 30,
          abilityModifiers: {},
          vision: { lowLight: false, darkvisionFeet: 0 },
          automaticLanguages: ["Common"],
          bonusLanguages: ["Any"],
          favoredClass: "any",
          racialTraits: [],
          ancestryTags: ["dragonborn"]
        }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("rejects empty race movement override object", () => {
    expect(() =>
      EntitySchema.parse({
        id: "invalid-movement-override",
        name: "Invalid Movement Override",
        entityType: "races",
        summary: "Invalid",
        description: "Invalid",
        portraitUrl: null,
        iconUrl: null,
        data: {
          size: "medium",
          baseSpeed: 30,
          abilityModifiers: {},
          vision: { lowLight: false, darkvisionFeet: 0 },
          automaticLanguages: ["Common"],
          bonusLanguages: ["Any"],
          favoredClass: "any",
          racialTraits: [],
          movementOverrides: {}
        }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("rejects race v2 spell DC bonuses with unknown school values", () => {
    expect(() =>
      EntitySchema.parse({
        id: "invalid-spell-dc-school",
        name: "Invalid Spell DC School",
        entityType: "races",
        summary: "Invalid",
        description: "Invalid",
        portraitUrl: null,
        iconUrl: null,
        data: {
          size: "medium",
          baseSpeed: 30,
          abilityModifiers: {},
          vision: { lowLight: false, darkvisionFeet: 0 },
          automaticLanguages: ["Common"],
          bonusLanguages: ["Any"],
          favoredClass: "any",
          racialTraits: [],
          spellDcBonuses: [{ school: "illusions", bonus: 1 }]
        }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("accepts deferred mechanics metadata for not-yet-implemented race rules", () => {
    const parsed = EntitySchema.parse({
      id: "dwarf",
      name: "Dwarf",
      entityType: "races",
      summary: "Dwarf summary",
      description: "Dwarf detail",
      portraitUrl: null,
      iconUrl: null,
      data: {
        size: "medium",
        baseSpeed: 20,
        abilityModifiers: { con: 2, cha: -2 },
        vision: { lowLight: false, darkvisionFeet: 60 },
        automaticLanguages: ["Common", "Dwarven"],
        bonusLanguages: ["Giant"],
        favoredClass: "fighter",
        racialTraits: [{ id: "stonecunning", name: "Stonecunning", description: "Stonework sense." }],
        deferredMechanics: [
          {
            id: "dwarf-weapon-familiarity-proficiency",
            category: "proficiency",
            description: "Dwarven weapon familiarity requires equipment proficiency mechanics.",
            dependsOn: ["cap:equipment-proficiency", "cap:equipment-validation"],
            impacts: ["proficiency:weapon:dwarven-waraxe", "proficiency:weapon:dwarven-urgrosh"]
          }
        ]
      }
    });

    expect(parsed.id).toBe("dwarf");
  });

  it("rejects malformed race deferred mechanics metadata", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-race-deferred",
        name: "Broken Race Deferred",
        entityType: "races",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          size: "medium",
          baseSpeed: 30,
          abilityModifiers: {},
          vision: { lowLight: false, darkvisionFeet: 0 },
          automaticLanguages: ["Common"],
          bonusLanguages: ["Any"],
          favoredClass: "any",
          racialTraits: [{ id: "bonus-feat", name: "Bonus Feat", description: "Extra feat." }],
          deferredMechanics: [
            {
              id: "broken-deferred-mechanic",
              category: "alignment",
              description: "Broken deferred metadata.",
              dependsOn: []
            }
          ]
        }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("rejects legacy race deferred mechanics dependency labels and impactPaths", () => {
    expect(() =>
      EntitySchema.parse({
        id: "legacy-race-deferred",
        name: "Legacy Race Deferred",
        entityType: "races",
        summary: "Legacy",
        description: "Legacy",
        portraitUrl: null,
        iconUrl: null,
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
              id: "legacy-race-mechanic",
              category: "proficiency",
              description: "Legacy shape should be rejected.",
              dependsOn: ["equipment-validation-engine"],
              impactPaths: ["validation.race.proficiency"]
            }
          ]
        }
      })
    ).toThrow(/invalid races\.data/i);
  });

  it("rejects unknown capability ids and malformed impact ids for race deferred mechanics", () => {
    expect(() =>
      EntitySchema.parse({
        id: "invalid-race-capability",
        name: "Invalid Race Capability",
        entityType: "races",
        summary: "Invalid",
        description: "Invalid",
        portraitUrl: null,
        iconUrl: null,
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
              id: "invalid-race-mechanic",
              category: "proficiency",
              description: "Invalid identifiers should fail.",
              dependsOn: ["cap:not-in-registry"],
              impacts: ["Combat:ArmorClass"]
            }
          ]
        }
      })
    ).toThrow(/invalid races\.data/i);
  });
});

describe("class entity schema", () => {
  it("accepts structured class data", () => {
    const parsed = EntitySchema.parse({
      id: "fighter",
      name: "Fighter",
      entityType: "classes",
      summary: "Fighter summary",
      description: "Fighter detail",
      portraitUrl: null,
      iconUrl: null,
      data: {
        skillPointsPerLevel: 2,
        classSkills: ["climb", "jump", "ride"],
        hitDie: 10,
        baseAttackProgression: "full",
        baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
        levelTable: [
          {
            level: 1,
            bab: 1,
            fort: 2,
            ref: 0,
            will: 0,
            features: ["bonus-fighter-feat"],
            specialLabel: "Fighter bonus feat"
          }
        ]
      }
    });

    expect(parsed.id).toBe("fighter");
  });

  it("rejects classes with malformed class data", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class",
        name: "Broken Class",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "invalid",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 1, bab: 1, fort: 2, ref: 0, will: 0 }]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects negative level-1 BAB or saves", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-negative",
        name: "Broken Class Negative",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 1, bab: -1, fort: 2, ref: 0, will: 0 }]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects level-1 row inconsistent with declared progressions", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-inconsistent",
        name: "Broken Class Inconsistent",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 1, bab: 0, fort: 2, ref: 0, will: 0 }]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("accepts progression-only class data without levelTable", () => {
    const parsed = EntitySchema.parse({
      id: "rogue",
      name: "Rogue",
      entityType: "classes",
      summary: "Rogue summary",
      description: "Rogue detail",
      portraitUrl: null,
      iconUrl: null,
      data: {
        skillPointsPerLevel: 8,
        classSkills: ["climb", "jump"],
        hitDie: 6,
        baseAttackProgression: "threeQuarters",
        baseSaveProgression: { fort: "poor", ref: "good", will: "poor" },
        progression: {
          levelGains: [
            {
              level: 1,
              effects: [
                { kind: "set", targetPath: "stats.bab", value: { const: 0 } },
                { kind: "set", targetPath: "stats.ref", value: { const: 2 } }
              ],
              grants: [{ kind: "grantFeature", featureId: "sneak-attack", label: "Sneak Attack +1d6" }]
            }
          ]
        }
      }
    });

    expect(parsed.id).toBe("rogue");
  });

  it("accepts deferred mechanics metadata for not-yet-implemented class rules", () => {
    const parsed = EntitySchema.parse({
      id: "barbarian",
      name: "Barbarian",
      entityType: "classes",
      summary: "Barbarian summary",
      description: "Barbarian detail",
      portraitUrl: null,
      iconUrl: null,
      data: {
        skillPointsPerLevel: 4,
        classSkills: ["climb", "jump"],
        hitDie: 12,
        baseAttackProgression: "full",
        baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
        progression: {
          levelGains: [
            {
              level: 1,
              effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 1 } }]
            }
          ]
        },
        deferredMechanics: [
          {
            id: "alignment-restriction-non-lawful",
            category: "alignment",
            description: "Barbarians cannot be lawful until alignment system is implemented.",
            dependsOn: ["cap:alignment-selection", "cap:alignment-validation"],
            impacts: ["alignment:restriction"],
            sourceRefs: ["https://www.d20srd.org/srd/classes/barbarian.htm"]
          }
        ]
      }
    });

    expect(parsed.id).toBe("barbarian");
  });

  it("rejects missing or misplaced level-1 row in levelTable", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-missing-level-1",
        name: "Broken Class Missing Level 1",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 2, bab: 2, fort: 3, ref: 0, will: 0 }]
        }
      })
    ).toThrow(/invalid classes\.data/i);

    expect(() =>
      EntitySchema.parse({
        id: "broken-class-misplaced-level-1",
        name: "Broken Class Misplaced Level 1",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [
            { level: 2, bab: 2, fort: 3, ref: 0, will: 0 },
            { level: 1, bab: 1, fort: 2, ref: 0, will: 0 }
          ]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects class data missing both levelTable and progression", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-missing-all-progression",
        name: "Broken Class Missing Progression",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" }
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects progression missing level 1 gain", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-missing-level1-gain",
        name: "Broken Class Missing Level 1 Gain",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          progression: {
            levelGains: [
              {
                level: 2,
                effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 2 } }]
              }
            ]
          }
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects malformed deferred mechanics metadata", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-deferred-mechanics",
        name: "Broken Class Deferred Mechanics",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          progression: {
            levelGains: [
              {
                level: 1,
                effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 1 } }]
              }
            ]
          },
          deferredMechanics: [
            {
              id: "alignment-restriction-non-lawful",
              category: "alignment",
              description: "Barbarians cannot be lawful.",
              dependsOn: []
            }
          ]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects duplicate level entries in levelTable", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-duplicate-levels",
        name: "Broken Class Duplicate Levels",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [
            { level: 1, bab: 1, fort: 2, ref: 0, will: 0 },
            { level: 1, bab: 1, fort: 2, ref: 0, will: 0 }
          ]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects non-strictly-ascending level order in levelTable", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-class-non-ascending-levels",
        name: "Broken Class Non-Ascending Levels",
        entityType: "classes",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [
            { level: 1, bab: 1, fort: 2, ref: 0, will: 0 },
            { level: 3, bab: 3, fort: 3, ref: 1, will: 1 },
            { level: 2, bab: 2, fort: 3, ref: 0, will: 0 }
          ]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });

  it("rejects legacy class deferred mechanics impactPaths", () => {
    expect(() =>
      EntitySchema.parse({
        id: "legacy-class-deferred",
        name: "Legacy Class Deferred",
        entityType: "classes",
        summary: "Legacy",
        description: "Legacy",
        portraitUrl: null,
        iconUrl: null,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["climb"],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          progression: {
            levelGains: [
              {
                level: 1,
                effects: [{ kind: "set", targetPath: "stats.bab", value: { const: 1 } }]
              }
            ]
          },
          deferredMechanics: [
            {
              id: "legacy-class-mechanic",
              category: "alignment",
              description: "Legacy field should be rejected.",
              dependsOn: ["cap:alignment-validation"],
              impactPaths: ["validation.class.alignment"]
            }
          ]
        }
      })
    ).toThrow(/invalid classes\.data/i);
  });
});

describe("feat entity schema", () => {
  it("accepts structured feat source metadata", () => {
    const parsed = EntitySchema.parse({
      id: "power-attack",
      name: "Power Attack",
      entityType: "feats",
      summary: "Trade melee attack bonus for extra damage.",
      description: "POWER ATTACK [GENERAL] ...",
      portraitUrl: null,
      iconUrl: null,
      effects: [
        { kind: "add", targetPath: "stats.attackBonus", value: { const: -1 } },
        { kind: "add", targetPath: "stats.damage", value: { const: 1 } }
      ],
      data: {
        sourcePages: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
        text: "POWER ATTACK [GENERAL] ...",
        featType: "GENERAL",
        prerequisite: "Str 13",
        benefit: "Trade attack bonus for damage.",
        special: "A fighter may select this as a bonus feat."
      }
    });

    expect(parsed.id).toBe("power-attack");
    expect(parsed.effects).toHaveLength(2);
  });

  it("rejects feats missing source metadata text", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-feat",
        name: "Broken Feat",
        entityType: "feats",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          sourcePages: [90]
        }
      })
    ).toThrow(/invalid feats\.data/i);
  });

  it("rejects engine effect data nested inside feat source metadata", () => {
    expect(() =>
      EntitySchema.parse({
        id: "power-attack",
        name: "Power Attack",
        entityType: "feats",
        summary: "Trade melee attack bonus for extra damage.",
        description: "POWER ATTACK [GENERAL] ...",
        portraitUrl: null,
        iconUrl: null,
        data: {
          sourcePages: [89],
          text: "POWER ATTACK [GENERAL] ...",
          benefitComputed: [
            { kind: "add", targetPath: "stats.attackBonus", value: { const: -1 } }
          ]
        }
      })
    ).toThrow(/invalid feats\.data/i);
  });

  it("accepts deferred mechanics metadata for not-yet-implemented feat rules", () => {
    const parsed = EntitySchema.parse({
      id: "manyshot",
      name: "Manyshot",
      entityType: "feats",
      summary: "Fire multiple arrows simultaneously.",
      description: "MANYSHOT [GENERAL] ...",
      portraitUrl: null,
      iconUrl: null,
      data: {
        sourcePages: [96],
        text: "MANYSHOT [GENERAL] ...",
        featType: "GENERAL",
        prerequisite: "Dex 17, Point Blank Shot, Rapid Shot, base attack bonus +6.",
        benefit: "As a standard action, fire two or more arrows at a single target.",
        deferredMechanics: [
          {
            id: "manyshot-multi-arrow-resolution",
            category: "attack-routine",
            description: "Manyshot requires attack-sequence modeling beyond the current engine.",
            dependsOn: ["cap:combat-attack-sequence", "cap:ammo-consumption"],
            impacts: ["combat:ranged-attack-roll", "attack:multi-projectile"]
          }
        ]
      }
    });

    expect(parsed.id).toBe("manyshot");
  });

  it("rejects malformed feat deferred mechanics metadata", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-feat-deferred",
        name: "Broken Feat Deferred",
        entityType: "feats",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        data: {
          sourcePages: [96],
          text: "BROKEN [GENERAL] ...",
          deferredMechanics: [
            {
              id: "broken-deferred-mechanic",
              category: "combat"
            }
          ]
        }
      })
    ).toThrow(/invalid feats\.data/i);
  });

  it("rejects legacy feat deferred mechanics impactPaths", () => {
    expect(() =>
      EntitySchema.parse({
        id: "legacy-feat-deferred",
        name: "Legacy Feat Deferred",
        entityType: "feats",
        summary: "Legacy",
        description: "Legacy",
        portraitUrl: null,
        iconUrl: null,
        data: {
          sourcePages: [96],
          text: "LEGACY [GENERAL] ...",
          deferredMechanics: [
            {
              id: "legacy-feat-mechanic",
              category: "attack-routine",
              description: "Legacy field should be rejected.",
              dependsOn: ["cap:combat-attack-sequence"],
              impactPaths: ["combat.ranged.fullAttack"]
            }
          ]
        }
      })
    ).toThrow(/invalid feats\.data/i);
  });
});

describe("item entity schema", () => {
  const makeItemEntity = (
    data: Record<string, unknown>,
    overrides: Partial<Record<"id" | "name" | "summary" | "description", string>> = {}
  ) => ({
    id: overrides.id ?? "test-item",
    name: overrides.name ?? "Test Item",
    entityType: "items",
    summary: overrides.summary ?? "Test item summary.",
    description: overrides.description ?? "Test item description.",
    portraitUrl: null,
    iconUrl: null,
    data
  });

  const expectInvalidItemData = (
    data: Record<string, unknown>,
    overrides: Partial<Record<"id" | "name" | "summary" | "description", string>> = {}
  ) => {
    expect(() => EntitySchema.parse(makeItemEntity(data, overrides))).toThrow(/invalid items\.data/i);
  };

  it("accepts structured item data for weapon, armor, shield, and gear categories", () => {
    const weapon = EntitySchema.parse({
      id: "longsword",
      name: "Longsword",
      entityType: "items",
      summary: "Martial melee weapon.",
      description: "One-handed martial blade.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "weapon",
        weaponType: "melee",
        damage: "1d8",
        crit: "19-20/x2",
        weight: 4
      }
    });
    expect(weapon.id).toBe("longsword");

    const armor = EntitySchema.parse({
      id: "chainmail",
      name: "Chainmail",
      entityType: "items",
      summary: "Medium armor.",
      description: "Interlocking metal armor links.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "armor",
        weight: 40,
        armorCheckPenalty: -5
      }
    });
    expect(armor.id).toBe("chainmail");

    const shield = EntitySchema.parse({
      id: "heavy-wooden-shield",
      name: "Heavy Wooden Shield",
      entityType: "items",
      summary: "Shield for defense.",
      description: "Heavy wooden shield.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "shield",
        weight: 10,
        armorCheckPenalty: -2
      }
    });
    expect(shield.id).toBe("heavy-wooden-shield");

    const gear = EntitySchema.parse({
      id: "rope",
      name: "Rope",
      entityType: "items",
      summary: "Adventuring gear.",
      description: "General utility rope.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "gear",
        weight: 10
      }
    });
    expect(gear.id).toBe("rope");
  });

  it("accepts ranged weapon range text, fractional gear weights, and zero ACP armor entries", () => {
    const rangedWeapon = EntitySchema.parse({
      id: "dart",
      name: "Dart",
      entityType: "items",
      summary: "Simple thrown weapon.",
      description: "Small ranged weapon with a short range increment.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "weapon",
        weaponType: "ranged",
        damage: "1d4",
        crit: "20/x2",
        range: "20 ft.",
        weight: 0.5
      }
    });
    expect(rangedWeapon.id).toBe("dart");

    const armor = EntitySchema.parse({
      id: "leather",
      name: "Leather Armor",
      entityType: "items",
      summary: "Light armor.",
      description: "Flexible leather protection.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "armor",
        weight: 15,
        armorCheckPenalty: 0
      }
    });
    expect(armor.id).toBe("leather");

    const gear = EntitySchema.parse({
      id: "belt-pouch",
      name: "Belt Pouch",
      entityType: "items",
      summary: "Compact storage.",
      description: "A small pouch sized for coins and small tools.",
      portraitUrl: null,
      iconUrl: null,
      data: {
        category: "gear",
        weight: 0.5
      }
    });
    expect(gear.id).toBe("belt-pouch");
  });

  it("rejects non-weapon categories that leak weapon-only combat fields", () => {
    expectInvalidItemData({
      category: "armor",
      weight: 25,
      weaponType: "melee"
    }, { id: "armor-with-weapon-type", name: "Armor With Weapon Type" });

    expectInvalidItemData({
      category: "shield",
      weight: 10,
      damage: "1d6"
    }, { id: "shield-with-damage", name: "Shield With Damage" });

    expectInvalidItemData({
      category: "gear",
      weight: 2,
      crit: "20/x2"
    }, { id: "gear-with-crit", name: "Gear With Crit" });
  });

  it("rejects malformed weapon formatting invariants", () => {
    expectInvalidItemData({
      category: "weapon",
      weaponType: "melee",
      damage: "d8",
      crit: "19-20/x2",
      weight: 4
    }, { id: "weapon-invalid-damage", name: "Weapon Invalid Damage" });

    expectInvalidItemData({
      category: "weapon",
      weaponType: "melee",
      damage: "1d8",
      crit: "19-20x2",
      weight: 4
    }, { id: "weapon-invalid-crit", name: "Weapon Invalid Crit" });

    expectInvalidItemData({
      category: "weapon",
      weaponType: "ranged",
      damage: "1d8",
      crit: "20/x3",
      range: "",
      weight: 3
    }, { id: "weapon-invalid-range", name: "Weapon Invalid Range" });
  });

  it("rejects negative weights and missing required armor or shield weights", () => {
    expectInvalidItemData({
      category: "gear",
      weight: -0.5
    }, { id: "gear-negative-weight", name: "Gear Negative Weight" });

    expectInvalidItemData({
      category: "armor",
      armorCheckPenalty: -4
    }, { id: "armor-missing-weight", name: "Armor Missing Weight" });

    expectInvalidItemData({
      category: "shield",
      armorCheckPenalty: -2
    }, { id: "shield-missing-weight", name: "Shield Missing Weight" });
  });

  it("rejects items with unknown categories", () => {
    expect(() =>
      EntitySchema.parse({
        id: "mystery",
        name: "Mystery Item",
        entityType: "items",
        summary: "Unknown item category.",
        description: "Unknown item category.",
        portraitUrl: null,
        iconUrl: null,
        data: {
          category: "artifact",
          weight: 1
        }
      })
    ).toThrow(/invalid items\.data/i);
  });

  it("rejects items missing data with explicit message", () => {
    expect(() =>
      EntitySchema.parse({
        id: "missing-item-data",
        name: "Missing Item Data",
        entityType: "items",
        summary: "Missing data.",
        description: "Missing data.",
        portraitUrl: null,
        iconUrl: null
      })
    ).toThrow(/items\.data is required/i);
  });

  it("rejects weapon items without required combat profile", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-weapon",
        name: "Broken Weapon",
        entityType: "items",
        summary: "Broken weapon entry.",
        description: "Broken weapon entry.",
        portraitUrl: null,
        iconUrl: null,
        data: {
          category: "weapon",
          weight: 4
        }
      })
    ).toThrow(/invalid items\.data/i);
  });

  it("rejects armor and shield items that declare positive ACP", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-armor",
        name: "Broken Armor",
        entityType: "items",
        summary: "Broken armor entry.",
        description: "Broken armor entry.",
        portraitUrl: null,
        iconUrl: null,
        data: {
          category: "armor",
          weight: 25,
          armorCheckPenalty: 2
        }
      })
    ).toThrow(/invalid items\.data/i);

    expect(() =>
      EntitySchema.parse({
        id: "broken-shield",
        name: "Broken Shield",
        entityType: "items",
        summary: "Broken shield entry.",
        description: "Broken shield entry.",
        portraitUrl: null,
        iconUrl: null,
        data: {
          category: "shield",
          weight: 10,
          armorCheckPenalty: 1
        }
      })
    ).toThrow(/invalid items\.data/i);
  });
});

describe("rule entity schema", () => {
  it("accepts legacy mixed-case conditional modifier predicates", () => {
    const parsed = EntitySchema.parse({
      id: "legacy-conditional-rule",
      name: "Legacy Conditional Rule",
      entityType: "rules",
      summary: "Legacy",
      description: "Legacy",
      portraitUrl: null,
      iconUrl: null,
      effects: [],
      data: {
        conditionalModifiers: [
          {
            id: "legacy-acrobatic",
            source: { type: "skillSynergy", ref: "tumble" },
            when: {
              op: "Or",
              args: [
                {
                  op: "GTE",
                  left: { kind: "SKILLRANKS", id: "tumble" },
                  right: 5
                },
                {
                  op: "isProficient",
                  target: { kind: "SkIlL", id: "balance" }
                }
              ]
            },
            apply: {
              target: { kind: "skill", id: "balance" },
              bonus: 2
            }
          }
        ]
      }
    });

    expect(parsed.data?.conditionalModifiers).toHaveLength(1);
  });

  it("rejects malformed conditional modifiers in rules data", () => {
    expect(() =>
      EntitySchema.parse({
        id: "broken-conditional-rule",
        name: "Broken Conditional Rule",
        entityType: "rules",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        effects: [],
        data: {
          conditionalModifiers: [
            {
              id: "broken-skill-synergy",
              source: { type: "skillSynergy", ref: "tumble" },
              when: {
                op: "gte",
                left: { kind: "not-skill-ranks", id: "tumble" },
                right: 5
              },
              apply: {
                target: { kind: "skill", id: "balance" },
                bonus: 2
              }
            }
          ]
        }
      })
    ).toThrow(/invalid rules\.data/i);
  });
});


describe("entity UI metadata", () => {
  it("requires summary/description on all entities", () => {
    expect(() =>
      EntitySchema.parse({
        id: "longsword",
        name: "Longsword",
        entityType: "items"
      })
    ).toThrow();
  });

  it("accepts null/omitted portrait and icon urls", () => {
    const parsed = EntitySchema.parse({
      id: "longsword",
      name: "Longsword",
      entityType: "items",
      summary: "Standard martial melee weapon.",
      description: "A versatile one-handed blade favored by trained warriors.",
      portraitUrl: null,
      iconUrl: null,
      effects: [],
      data: {
        category: "weapon",
        weaponType: "melee",
        damage: "1d8",
        crit: "19-20/x2",
        weight: 4
      }
    });

    expect(parsed.id).toBe("longsword");

    const parsedOmitted = EntitySchema.parse({
      id: "shield",
      name: "Shield",
      entityType: "items",
      summary: "Shield summary",
      description: "Shield detail",
      data: {
        category: "shield",
        weight: 6
      }
    });

    expect(parsedOmitted.id).toBe("shield");
  });
});

describe("authenticity lock schema", () => {
  it("accepts a valid lock file", () => {
    const parsed = AuthenticityLockSchema.parse({
      packId: "srd-35e-minimal",
      officialRuleset: true,
      generatedAt: "2026-02-19T09:40:00.000Z",
      generatedBy: "unit-test",
      sourceAuthorities: [{ title: "SRD", url: "https://www.d20srd.org/" }],
      artifacts: [{ path: "entities/races.json", sha256: "d7070ecc0f6291cecfe3ef4c90d62801e7254b2d3ac6fe1e6bb652e99f26da64" }]
    });

    expect(parsed.packId).toBe("srd-35e-minimal");
  });

  it("rejects malformed hash values", () => {
    expect(() =>
      AuthenticityLockSchema.parse({
        packId: "srd-35e-minimal",
        officialRuleset: true,
        generatedAt: "2026-02-19T09:40:00.000Z",
        generatedBy: "unit-test",
        sourceAuthorities: [{ title: "SRD", url: "https://www.d20srd.org/" }],
        artifacts: [{ path: "entities/races.json", sha256: "not-a-real-hash" }]
      })
    ).toThrow();
  });
});

describe("engine runtime architecture contracts", () => {
  it("accepts bundle statements for invoke, grant, and constraint", () => {
    const invoke = schema.BundleStatementSchema.parse({
      kind: "invoke",
      capability: "cap:skills",
      op: "assign-category",
      args: {
        target: "skill:ride",
        categoryId: "skill-category:class"
      }
    });

    const grant = schema.BundleStatementSchema.parse({
      kind: "grant",
      entity: "feature:paladin:divine-health"
    });

    const constraint = schema.BundleStatementSchema.parse({
      kind: "constraint",
      capability: "cap:eligibility",
      op: "requires-tags",
      args: {
        subjectFact: "fact:identity:alignment",
        allOf: ["alignment:lawful", "alignment:good"]
      },
      requiresFacts: ["fact:identity:alignment"]
    });

    expect(invoke.kind).toBe("invoke");
    expect(grant.kind).toBe("grant");
    expect(constraint.kind).toBe("constraint");
  });

  it("rejects request-side statements from bundle schemas", () => {
    expect(() =>
      schema.BundleStatementSchema.parse({
        kind: "selection",
        schemaId: "sel:progression-track",
        refId: "class:paladin",
        amount: 4
      })
    ).toThrow();

    expect(() =>
      schema.BundleStatementSchema.parse({
        kind: "acquire",
        capability: "cap:skills",
        target: "rank:skill:ride",
        amount: 2
      })
    ).toThrow();
  });

  it("rejects malformed bundle when expressions", () => {
    expect(() =>
      schema.BundleStatementSchema.parse({
        kind: "grant",
        entity: "feature:paladin:divine-health",
        when: {
          op: "min-level",
          value: 4
        }
      })
    ).toThrow();
  });

  it("accepts runtime requests with selections, inputs, and acquire intents", () => {
    const parsed = schema.RuntimeRequestSchema.parse({
      selections: [
        {
          kind: "selection",
          schemaId: "sel:progression-track",
          refId: "class:paladin",
          amount: 4
        }
      ],
      inputs: [
        {
          kind: "input",
          inputId: "input:identity:alignment",
          value: ["alignment:lawful", "alignment:good"]
        }
      ],
      acquireIntents: [
        {
          kind: "acquire",
          capability: "cap:skills",
          target: "rank:skill:ride",
          amount: 2
        }
      ]
    });

    expect(parsed.selections).toHaveLength(1);
    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.acquireIntents).toHaveLength(1);
  });

  it("rejects direct fact injection in runtime request inputs", () => {
    expect(() =>
      schema.RuntimeRequestSchema.parse({
        selections: [],
        inputs: [
          {
            kind: "input",
            inputId: "fact:identity:alignment",
            value: ["alignment:lawful", "alignment:good"]
          }
        ]
      })
    ).toThrow();
  });

  it("accepts typed condition expressions for selection metrics, facts, resources, and constants", () => {
    const parsed = schema.ConditionExprSchema.parse({
      op: "all-of",
      args: [
        {
          op: "numeric-gte",
          left: {
            kind: "selection-metric",
            schemaId: "sel:progression-track",
            refId: "class:paladin",
            field: "amount"
          },
          right: { kind: "const", value: 4 }
        },
        {
          op: "has-fact",
          fact: {
            kind: "published-fact",
            factId: "fact:identity:alignment"
          }
        },
        {
          op: "resource-at-least",
          resource: {
            kind: "resource-amount",
            resourceId: "budget:skill-points"
          },
          amount: { kind: "const", value: 1 }
        }
      ]
    });

    expect(parsed.op).toBe("all-of");
  });

  it("rejects bare min-level condition nodes", () => {
    expect(() =>
      schema.ConditionExprSchema.parse({
        op: "min-level",
        value: 4
      })
    ).toThrow();
  });

  it("accepts invoke and constraint specs as distinct registry entries", () => {
    const invoke = schema.InvokeSpecSchema.parse({
      kind: "invoke",
      capability: "cap:skills",
      op: "assign-category",
      version: "1",
      argsSchema: { type: "object" },
      phase: "invoke",
      reads: ["selection:progression"],
      writes: ["resource:skill-points"],
      publishes: ["fact:skills:class-category"],
      idempotent: true
    });

    const constraint = schema.ConstraintSpecSchema.parse({
      kind: "constraint",
      capability: "cap:eligibility",
      op: "requires-tags",
      version: "1",
      argsSchema: { type: "object" },
      reads: ["fact:identity:alignment"],
      requiresFacts: ["fact:identity:alignment"],
      evaluationPhase: "constraints",
      deferredWhenMissing: true
    });

    expect(invoke.kind).toBe("invoke");
    expect(constraint.kind).toBe("constraint");
  });

  it("accepts boolean argsSchema values in registry specs", () => {
    const invoke = schema.InvokeSpecSchema.parse({
      kind: "invoke",
      capability: "cap:skills",
      op: "assign-category",
      version: "1",
      argsSchema: true,
      phase: "invoke",
      reads: ["selection:progression"],
      writes: ["resource:skill-points"],
      idempotent: true
    });

    const constraint = schema.ConstraintSpecSchema.parse({
      kind: "constraint",
      capability: "cap:eligibility",
      op: "requires-tags",
      version: "1",
      argsSchema: false,
      reads: ["fact:identity:alignment"],
      evaluationPhase: "constraints",
      deferredWhenMissing: true
    });

    expect(invoke.argsSchema).toBe(true);
    expect(constraint.argsSchema).toBe(false);
  });

  it("rejects write-capable fields on constraint specs", () => {
    expect(() =>
      schema.ConstraintSpecSchema.parse({
        kind: "constraint",
        capability: "cap:eligibility",
        op: "requires-tags",
        version: "1",
        argsSchema: { type: "object" },
        reads: ["fact:identity:alignment"],
        writes: ["resource:skill-points"],
        evaluationPhase: "constraints",
        deferredWhenMissing: true
      })
    ).toThrow();
  });
});
