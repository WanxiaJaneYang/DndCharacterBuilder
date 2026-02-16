import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePackSet } from "./index";

describe("resolvePackSet", () => {
  it("loads minimal pack and computes fingerprint", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    expect(resolved.entities.races.human.name).toBe("Human");
    expect(resolved.fingerprint.length).toBe(64);
  });
});
