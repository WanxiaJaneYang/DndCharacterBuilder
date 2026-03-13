import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContractFixtureSchema } from "@dcb/schema";
import { runAuthenticityChecks, runContracts } from "./index";

function writeMinimalPack(
  root: string,
  spec: {
    id: string;
    dependencies?: string[];
    raceFavoredClass?: string;
    classes?: string[];
  }
): void {
  const packDir = path.join(root, spec.id);
  fs.mkdirSync(path.join(packDir, "entities"), { recursive: true });

  fs.writeFileSync(
    path.join(packDir, "manifest.json"),
    JSON.stringify(
      {
        id: spec.id,
        name: spec.id,
        version: "1.0.0",
        priority: 1,
        dependencies: spec.dependencies ?? []
      },
      null,
      2
    )
  );

  if (spec.raceFavoredClass) {
    fs.writeFileSync(
      path.join(packDir, "entities/races.json"),
      JSON.stringify(
        [
          {
            id: "race-a",
            name: "Race A",
            entityType: "races",
            summary: "Race summary",
            description: "Race description",
            data: { favoredClass: spec.raceFavoredClass }
          }
        ],
        null,
        2
      )
    );
  }

  const classes = spec.classes ?? [];
  fs.writeFileSync(
    path.join(packDir, "entities/classes.json"),
    JSON.stringify(
      classes.map((classId) => ({
        id: classId,
        name: classId,
        entityType: "classes",
        summary: `${classId} summary`,
        description: `${classId} description`,
        data: {
          skillPointsPerLevel: 2,
          classSkills: ["listen"],
          hitDie: 6,
          baseAttackProgression: "half",
          baseSaveProgression: { fort: "poor", ref: "poor", will: "good" },
          levelTable: [{ level: 1, bab: 0, fort: 0, ref: 0, will: 2 }]
        }
      })),
      null,
      2
    )
  );
}

describe("pack contracts", () => {
  it("runs all contract fixtures", () => {
    expect(() => runContracts(path.resolve(process.cwd(), "../../packs"))).not.toThrow();
  });

  it("verifies authenticity locks for official packs", () => {
    expect(() => runAuthenticityChecks(path.resolve(process.cwd(), "../../packs"))).not.toThrow();
  });


  it("ignores non-directory entries under packs root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contracts-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "README.md"), "not a pack dir");

    try {
      expect(() => runContracts(tempRoot)).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("preserves contract clarifications in fixture parsing", () => {
    const fixture = ContractFixtureSchema.parse({
      enabledPacks: ["srd-35e-minimal"],
      initialState: {},
      actions: [],
      contractClarifications: {
        stats: "initiative is part of the baseline"
      },
      expected: {}
    });

    expect(fixture.contractClarifications).toEqual({
      stats: "initiative is part of the baseline"
    });
  });

  it("runs CharacterSpec-based compute fixtures alongside legacy action fixtures", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-compute-contract-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "contracts/human-fighter-1-compute.json"),
      JSON.stringify(
        {
          enabledPacks: ["srd-35e-minimal"],
          characterSpec: {
            meta: {
              name: "Aric",
              rulesetId: "dnd35e",
              sourceIds: ["srd-35e-minimal"]
            },
            raceId: "human",
            class: {
              classId: "fighter",
              level: 1
            },
            abilities: {
              str: 16,
              dex: 12,
              con: 14,
              int: 10,
              wis: 10,
              cha: 8
            },
            skillRanks: {
              climb: 4,
              jump: 3,
              diplomacy: 0.5
            },
            featIds: ["power-attack"],
            equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
          },
          contractClarifications: {
            goldenPath: "Canonical compute contract fixture using CharacterSpec input."
          },
          expected: {
            validationIssueCodes: [],
            computeResultSubset: {
              schemaVersion: "0.1",
              sheetViewModel: {
                schemaVersion: "0.1",
                data: {
                  combat: {
                    ac: {
                      total: 18
                    },
                    attacks: [
                      {
                        itemId: "longsword",
                        attackBonus: 4,
                        damageLine: "1d8+3"
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        null,
        2
      )
    );

    try {
      expect(() => runContracts(tempRoot)).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects compute fixtures missing top-level CharacterSpec fields before compute() runs", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-compute-contract-invalid-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "contracts/invalid-compute.json"),
      JSON.stringify(
        {
          enabledPacks: ["srd-35e-minimal"],
          characterSpec: {},
          expected: {
            validationIssueCodes: []
          }
        },
        null,
        2
      )
    );

    try {
      let thrown: unknown;
      try {
        runContracts(tempRoot);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeDefined();
      expect(thrown).not.toBeInstanceOf(TypeError);
      const message = thrown instanceof Error ? thrown.message : String(thrown);
      expect(message).toMatch(/characterSpec/i);
      expect(message).toMatch(/meta|abilities/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a contract fixture contains non-ASCII text", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contract-ascii-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });

    const fixturePath = path.join(packDest, "contracts/human-fighter-1.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
      contractClarifications?: Record<string, string>;
    };
    fixture.contractClarifications = {
      ...(fixture.contractClarifications ?? {}),
      asciiCheck: "contains café"
    };
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));

    try {
      expect(() => runContracts(tempRoot)).toThrow(/ASCII/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a contract fixture contains escaped bidi control characters", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contract-bidi-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });

    const fixturePath = path.join(packDest, "contracts/human-fighter-1.json");
    const fixtureText = fs.readFileSync(fixturePath, "utf8");
    const updatedFixtureText = fixtureText.replace(
      "\"goldenPath\": \"Human Fighter 1 with chainmail+shield+longsword for core combat assertions.\"",
      "\"goldenPath\": \"Human Fighter 1 with chainmail+shield+longsword for core combat assertions. \\u202E\""
    );
    fs.writeFileSync(fixturePath, updatedFixtureText);

    try {
      expect(() => runContracts(tempRoot)).toThrow(/bidirectional|bidi/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when finalSheetSubset arrays omit actual trailing items", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contract-array-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });

    const fixturePath = path.join(packDest, "contracts/human-fighter-1.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
      expected: {
        finalSheetSubset: {
          phase2: {
            skills: Array<Record<string, unknown>>;
          };
        };
      };
    };
    fixture.expected.finalSheetSubset.phase2.skills =
      fixture.expected.finalSheetSubset.phase2.skills.slice(0, 1);
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));

    try {
      expect(() => runContracts(tempRoot)).toThrow(/Final sheet subset mismatch/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when actual validation errors exceed the expected list", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contract-errors-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });

    const fixturePath = path.join(packDest, "contracts/human-fighter-1.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
      actions: Array<{ choiceId: string; selection: unknown }>;
      expected: { validationErrorCodes: string[] };
    };
    fixture.actions = fixture.actions.filter((action) => action.choiceId !== "name");
    fixture.expected.validationErrorCodes = [];
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));

    try {
      expect(() => runContracts(tempRoot)).toThrow(/validation/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails authenticity checks when locked artifact changes", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-auth-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");
    fs.cpSync(packSource, packDest, { recursive: true });

    const target = path.join(packDest, "entities/classes.json");
    fs.writeFileSync(target, `${fs.readFileSync(target, "utf8")}\n`);

    try {
      expect(() => runAuthenticityChecks(tempRoot)).toThrow(/checksum mismatch/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when entity references point to missing IDs", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-ref-integrity-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");
    fs.cpSync(packSource, packDest, { recursive: true });

    const racesPath = path.join(packDest, "entities/races.json");
    const races = JSON.parse(fs.readFileSync(racesPath, "utf8")) as Array<{
      id: string;
      data?: { favoredClass?: string };
    }>;

    const dwarf = races.find((entry) => entry.id === "dwarf");
    if (!dwarf?.data?.favoredClass) {
      throw new Error("Fixture precondition failed: dwarf favoredClass missing");
    }
    dwarf.data.favoredClass = "missing-class-id";
    fs.writeFileSync(racesPath, JSON.stringify(races, null, 2));

    try {
      let thrown: unknown;
      try {
        runContracts(tempRoot);
      } catch (error) {
        thrown = error;
      }
      const message = thrown instanceof Error ? thrown.message : String(thrown);
      expect(message).toMatch(/reference integrity/i);
      expect(message).toMatch(/races\.json/i);
      expect(message).toMatch(/favoredClass/i);
      expect(message).toMatch(/missing-class-id/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when favoredClass exists only in an unrelated pack", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-ref-closure-fail-"));
    writeMinimalPack(tempRoot, { id: "pack-a", raceFavoredClass: "wizard" });
    writeMinimalPack(tempRoot, { id: "pack-b", classes: ["wizard"] });

    try {
      expect(() => runContracts(tempRoot)).toThrow(/reference integrity/i);
      expect(() => runContracts(tempRoot)).toThrow(/pack=pack-a/i);
      expect(() => runContracts(tempRoot)).toThrow(/missing=wizard/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("passes when favoredClass is provided by a declared dependency", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-ref-closure-pass-"));
    writeMinimalPack(tempRoot, { id: "pack-b", classes: ["wizard"] });
    writeMinimalPack(tempRoot, { id: "pack-a", dependencies: ["pack-b"], raceFavoredClass: "wizard" });

    try {
      expect(() => runContracts(tempRoot)).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when an entities file is not a JSON array", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-ref-array-shape-"));
    const packDir = path.join(tempRoot, "bad-pack");
    fs.mkdirSync(path.join(packDir, "entities"), { recursive: true });
    fs.writeFileSync(
      path.join(packDir, "manifest.json"),
      JSON.stringify(
        {
          id: "bad-pack",
          name: "bad-pack",
          version: "1.0.0",
          priority: 1,
          dependencies: []
        },
        null,
        2
      )
    );
    fs.writeFileSync(path.join(packDir, "entities/races.json"), JSON.stringify({ id: "not-an-array" }, null, 2));

    try {
      expect(() => runContracts(tempRoot)).toThrow(/Expected JSON array in entities file/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps key PHB race mechanics encoded in races data", () => {
    const racesPath = path.resolve(process.cwd(), "../../packs/srd-35e-minimal/entities/races.json");
    const races = JSON.parse(fs.readFileSync(racesPath, "utf8")) as Array<{
      id: string;
      data?: {
        saveBonuses?: Array<{ target?: string; bonus?: number }>;
        attackBonuses?: Array<{ target?: string; bonus?: number }>;
        racialTraits?: Array<{ id?: string }>;
      };
    }>;

    const byId = new Map(races.map((race) => [race.id, race]));

    const dwarf = byId.get("dwarf");
    expect(dwarf?.data?.attackBonuses?.some((bonus) => bonus.target === "orcs-and-half-orcs" && bonus.bonus === 1)).toBe(true);
    expect(dwarf?.data?.attackBonuses?.some((bonus) => bonus.target === "goblinoids" && bonus.bonus === 1)).toBe(true);

    const gnome = byId.get("gnome");
    expect(gnome?.data?.saveBonuses?.some((bonus) => bonus.target === "illusions" && bonus.bonus === 2)).toBe(true);

    const halfling = byId.get("halfling");
    expect(halfling?.data?.saveBonuses?.some((bonus) => bonus.target === "all" && bonus.bonus === 1)).toBe(true);
    expect(halfling?.data?.saveBonuses?.some((bonus) => bonus.target === "fear" && bonus.bonus === 2)).toBe(true);

    const halfOrc = byId.get("half-orc");
    expect(halfOrc?.data?.racialTraits?.some((trait) => trait.id === "minimum-intelligence")).toBe(true);
  });
});
