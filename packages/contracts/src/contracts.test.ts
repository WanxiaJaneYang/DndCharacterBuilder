import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContractFixtureSchema } from "@dcb/schema";
import { runAuthenticityChecks, runContracts } from "./index";

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
