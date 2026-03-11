import { describe, expect, it } from "vitest";
import { normalizeCharacterSpec, validateCharacterSpec } from "./characterSpec";

describe("validateCharacterSpec", () => {
  const baseSpec = {
    meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  };

  it("reports SPEC_CLASS_LEVEL_INVALID for raw string class levels", () => {
    const issues = validateCharacterSpec({
      ...baseSpec,
      class: { classId: "fighter", level: "2" as unknown as number }
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_CLASS_LEVEL_INVALID",
          path: "class.level"
        })
      ])
    );
  });

  it("reports SPEC_CLASS_LEVEL_INVALID for raw boolean class levels", () => {
    const issues = validateCharacterSpec({
      ...baseSpec,
      class: { classId: "fighter", level: true as unknown as number }
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC_CLASS_LEVEL_INVALID",
          path: "class.level"
        })
      ])
    );
  });
});

describe("normalizeCharacterSpec", () => {
  it("does not preserve non-number class levels through normalization", () => {
    const normalized = normalizeCharacterSpec({
      meta: { rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      class: { classId: "fighter", level: "2" as unknown as number },
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    });

    expect(normalized.class?.level).toBe(1);
  });
});
