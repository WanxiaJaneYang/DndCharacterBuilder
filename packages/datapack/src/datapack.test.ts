import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "./index";
import { resolveLoadedPacks, resolvePackSet, topoSortPacks } from "./index";

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
    expect(resolved.fingerprint.length).toBe(64);
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
    expect(resolved.entities.rules.shared.name).toBe("Overridden");
    expect(resolved.entities.rules.shared._source.packId).toBe("override");
  });
});
