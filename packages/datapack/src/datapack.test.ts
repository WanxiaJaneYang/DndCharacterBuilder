import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "./index";
import { resolveLoadedPacks, topoSortPacks } from "./core";
import { resolvePackSet } from "./node";

function makePack(id: string, priority: number, dependencies: string[] = []): LoadedPack {
  return {
    manifest: { id, name: id, version: "1.0.0", priority, dependencies },
    entities: {
      races: [],
      classes: [],
      feats: [],
      items: [],
      skills: [],
      rules: [{ id: `${id}-rule`, name: `${id}-rule`, entityType: "rules", summary: "Rule summary", description: "Rule description", portraitUrl: "assets/rules/rule-portrait.png", iconUrl: "assets/icons/rules/rule.png", effects: [] }]
    },
    flow: { steps: [{ id: "name", kind: "metadata", label: "Name", source: { type: "manual" } }] },
    patches: [],
    packPath: id
  };
}

describe("resolvePackSet", () => {
  it("loads minimal pack and computes fingerprint", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    expect(resolved.entities.races?.human?.name).toBe("Human");
    expect(resolved.entities.races?.human?._source.packId).toBe("srd-35e-minimal");
    expect(resolved.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("loads abilities config from flow", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    const abilityStep = resolved.flow.steps.find((step) => step.id === "abilities");

    expect(abilityStep?.abilitiesConfig?.defaultMode).toBe("pointBuy");
    expect(abilityStep?.abilitiesConfig?.modes).toEqual(["pointBuy", "phb", "rollSets"]);
  });

  it("ensures all entities expose required UI metadata", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);

    const buckets = ["races", "classes", "feats", "items", "skills", "rules"] as const;
    for (const bucket of buckets) {
      const entities = Object.values(resolved.entities[bucket] ?? {});
      expect(entities.length).toBeGreaterThan(0);
      for (const entity of entities) {
        expect(entity.summary).toEqual(expect.any(String));
        expect(entity.description).toEqual(expect.any(String));
        expect(["string", "object", "undefined"]).toContain(typeof entity.portraitUrl);
        expect(["string", "object", "undefined"]).toContain(typeof entity.iconUrl);
      }
    }
  });

  it("includes all SRD 3.5 core races with baseline movement data", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);

    const raceIds = Object.keys(resolved.entities.races ?? {}).sort();
    expect(raceIds).toEqual([
      "dwarf",
      "elf",
      "gnome",
      "half-elf",
      "half-orc",
      "halfling",
      "human"
    ]);

    expect(resolved.entities.races?.dwarf?.data?.size).toBe("medium");
    expect(resolved.entities.races?.dwarf?.data?.vision?.darkvisionFeet).toBe(60);
    expect(resolved.entities.races?.elf?.data?.size).toBe("medium");
    expect(resolved.entities.races?.elf?.data?.vision?.lowLight).toBe(true);
    expect(resolved.entities.races?.elf?.data?.abilityModifiers).toEqual({ dex: 2, con: -2 });
    expect(resolved.entities.races?.elf?.data?.innateSpellLikeAbilities).toEqual([]);
    expect(resolved.entities.races?.gnome?.data?.size).toBe("small");
    expect(resolved.entities.races?.["half-elf"]?.data?.size).toBe("medium");
    expect(resolved.entities.races?.["half-orc"]?.data?.size).toBe("medium");
    expect(resolved.entities.races?.halfling?.data?.size).toBe("small");
    expect(resolved.entities.races?.human?.data?.size).toBe("medium");

    expect(resolved.entities.races?.dwarf?.effects).toContainEqual({
      kind: "set",
      targetPath: "stats.speed",
      value: { const: 20 }
    });
    expect(resolved.entities.races?.human?.effects).toContainEqual({
      kind: "set",
      targetPath: "stats.speed",
      value: { const: 30 }
    });
    expect(resolved.entities.races?.elf?.effects).toContainEqual({
      kind: "add",
      targetPath: "abilities.dex.score",
      value: { const: 2 }
    });
  });

  it("ignores non-directory entries under packs root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-packs-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "README.md"), "not a pack");

    try {
      const resolved = resolvePackSet(tempRoot, ["srd-35e-minimal"]);
      expect(resolved.orderedPackIds).toContain("srd-35e-minimal");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });


  it("fails with contextual error for invalid entity data", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-invalid-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(packDest, "entities", "races.json"), JSON.stringify([{ name: "Broken" }]));

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"]))
        .toThrow(/invalid entity file.*races\.json/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });


  it("fails when entityType does not match entity file bucket", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-entitytype-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "entities", "races.json"),
      JSON.stringify([{
        id: "oops",
        name: "Oops",
        entityType: "classes",
        summary: "s",
        description: "d",
        portraitUrl: "p",
        iconUrl: "i",
        data: {
          skillPointsPerLevel: 2,
          classSkills: [],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 1, bab: 1, fort: 2, ref: 0, will: 0 }]
        }
      }])
    );

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"]))
        .toThrow(/expected races/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("preserves dependency order even when priority conflicts", () => {
    const base = makePack("base", 100);
    const addon = makePack("addon", 1, ["base"]);
    const independent = makePack("independent", 0);

    const sorted = topoSortPacks([base, addon, independent], ["addon", "independent"]);
    const ids = sorted.map((pack) => pack.manifest.id);

    expect(ids.indexOf("base")).toBeLessThan(ids.indexOf("addon"));
    expect(ids).toEqual(["independent", "base", "addon"]);
  });

  it("tracks source pack metadata for overriding patches", () => {
    const base = makePack("base", 1);
    base.entities.rules = [{ id: "shared", name: "Shared", entityType: "rules", summary: "Shared rule", description: "Shared rule desc", portraitUrl: "assets/rules/shared-portrait.png", iconUrl: "assets/icons/rules/shared.png", effects: [] }];

    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "shared", value: { name: "Overridden" } }];

    const resolved = resolveLoadedPacks([base, override], ["override"]);
    expect(resolved.entities.rules?.shared?.name).toBe("Overridden");
    expect(resolved.entities.rules?.shared?._source.packId).toBe("override");
    expect(resolved.entities.rules?.shared?._source.entityId).toBe("shared");
  });
});
