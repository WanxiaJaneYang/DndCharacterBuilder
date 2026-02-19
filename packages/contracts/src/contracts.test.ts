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

  it("keeps core SRD 3.5 class details aligned for level-1 class entries", () => {
    const classesPath = path.resolve(process.cwd(), "../../packs/srd-35e-minimal/entities/classes.json");
    const classes = JSON.parse(fs.readFileSync(classesPath, "utf8")) as Array<{
      id: string;
      data?: {
        hitDie?: number;
        classSkills?: string[];
        levelTable?: Array<{ features?: string[]; specialLabel?: string }>;
      };
      effects?: Array<{ kind?: string; targetPath?: string; value?: { const?: number; sum?: Array<{ const?: number }> } }>;
    }>;

    const byId = (id: string) => classes.find((entry) => entry.id === id);
    const effectConst = (entry: (typeof classes)[number] | undefined, targetPath: string) =>
      entry?.effects?.find((effect) => effect.kind === "set" && effect.targetPath === targetPath)?.value?.const ??
      entry?.effects
        ?.find((effect) => effect.kind === "set" && effect.targetPath === targetPath)
        ?.value?.sum?.find((segment) => typeof segment.const === "number")?.const;

    const bard = byId("bard-1");
    expect(bard?.data?.hitDie).toBe(6);
    expect(effectConst(bard, "stats.hp")).toBe(6);

    const ranger = byId("ranger-1");
    expect(ranger?.data?.hitDie).toBe(8);
    expect(effectConst(ranger, "stats.hp")).toBe(8);

    const sorcerer = byId("sorcerer-1");
    expect(sorcerer?.data?.classSkills ?? []).not.toContain("diplomacy");

    const wizard = byId("wizard-1");
    expect(wizard?.data?.classSkills ?? []).not.toContain("diplomacy");

    const druid = byId("druid-1");
    expect(druid?.data?.classSkills ?? []).not.toContain("climb");

    const fighter = byId("fighter-1");
    expect(fighter?.data?.levelTable?.[0]?.features ?? []).toContain("bonus-fighter-feat");
    expect(fighter?.data?.levelTable?.[0]?.specialLabel).toBe("Fighter bonus feat");
  });
});
