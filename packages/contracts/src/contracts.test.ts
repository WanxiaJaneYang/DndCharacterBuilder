import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
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

    const gnome = byId.get("gnome");
    expect(gnome?.data?.saveBonuses?.some((bonus) => bonus.target === "illusions" && bonus.bonus === 2)).toBe(true);

    const halfling = byId.get("halfling");
    expect(halfling?.data?.saveBonuses?.some((bonus) => bonus.target === "all" && bonus.bonus === 1)).toBe(true);
    expect(halfling?.data?.saveBonuses?.some((bonus) => bonus.target === "fear" && bonus.bonus === 2)).toBe(true);

    const halfOrc = byId.get("half-orc");
    expect(halfOrc?.data?.racialTraits?.some((trait) => trait.id === "minimum-intelligence")).toBe(true);
  });
});
