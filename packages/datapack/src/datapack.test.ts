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
      rules: [{ id: `${id}-rule`, name: `${id}-rule`, entityType: "rules", effects: [] }]
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
    base.entities.rules = [{ id: "shared", name: "Shared", entityType: "rules", effects: [] }];

    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "shared", value: { name: "Overridden" } }];

    const resolved = resolveLoadedPacks([base, override], ["override"]);
    expect(resolved.entities.rules?.shared?.name).toBe("Overridden");
    expect(resolved.entities.rules?.shared?._source.packId).toBe("override");
    expect(resolved.entities.rules?.shared?._source.entityId).toBe("shared");
  });
});
