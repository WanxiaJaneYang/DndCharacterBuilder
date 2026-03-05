import { describe, expect, it } from "vitest";
import type { PackLocale } from "@dcb/datapack";
import { resolveSpecializedSkillLabel } from "./localization";

describe("resolveSpecializedSkillLabel", () => {
  const locale: PackLocale = {
    entityText: {
      skills: {
        craft: { name: "\u5DE5\u827A" },
        "craft:alchemy": { name: "\u5DE5\u827A\uFF08\u70BC\u91D1\u672F\uFF09" },
      },
    },
  };

  it("returns null for non-specialized IDs without locale overrides", () => {
    expect(
      resolveSpecializedSkillLabel({
        locale: undefined,
        language: "en",
        skillId: "climb",
      }),
    ).toBeNull();
  });

  it("prefers exact locale entries for specialized IDs", () => {
    expect(
      resolveSpecializedSkillLabel({
        locale,
        language: "zh",
        skillId: "craft:alchemy",
      }),
    ).toBe("\u5DE5\u827A\uFF08\u70BC\u91D1\u672F\uFF09");
  });

  it("builds deterministic English fallback labels for specialized IDs", () => {
    const label = resolveSpecializedSkillLabel({
      locale: undefined,
      language: "en",
      skillId: "craft:stone-cutting",
    });
    expect(label).toBe("Craft (Stone Cutting)");
    expect(label).not.toContain(":");
    expect(label).not.toContain("-");
  });

  it("uses localized parent labels in Chinese fallback", () => {
    const label = resolveSpecializedSkillLabel({
      locale,
      language: "zh",
      skillId: "craft:glassblowing",
    });
    expect(label).toBe("\u5DE5\u827A\uFF08Glassblowing\uFF09");
    expect(label).not.toContain(":");
  });
});

