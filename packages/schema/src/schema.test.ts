import { describe, expect, it } from "vitest";
import { AuthenticityLockSchema, EntitySchema, FlowSchema, ManifestSchema } from "./index";

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
});

describe("class entity schema", () => {
  it("accepts structured class data", () => {
    const parsed = EntitySchema.parse({
      id: "fighter-1",
      name: "Fighter (Level 1)",
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

    expect(parsed.id).toBe("fighter-1");
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
      effects: []
    });

    expect(parsed.id).toBe("longsword");

    const parsedOmitted = EntitySchema.parse({
      id: "shield",
      name: "Shield",
      entityType: "items",
      summary: "Shield summary",
      description: "Shield detail"
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
