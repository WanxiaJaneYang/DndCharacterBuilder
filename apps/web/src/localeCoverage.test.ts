import { describe, expect, it } from "vitest";
import skillsJson from "../../../packs/srd-35e-minimal/entities/skills.json";
import enLocaleJson from "../../../packs/srd-35e-minimal/locales/en.json";
import zhLocaleJson from "../../../packs/srd-35e-minimal/locales/zh.json";

type SkillEntity = { id: string; name: string };

const skills = skillsJson as SkillEntity[];
const en = enLocaleJson as {
  entityNames?: { skills?: Record<string, string> };
  entityText?: { skills?: Record<string, { name?: string }> };
};
const zh = zhLocaleJson as {
  entityNames?: { skills?: Record<string, string> };
  entityText?: { skills?: Record<string, { name?: string }> };
};

function missingSkillLocaleIds(locale: typeof en): string[] {
  const names = locale.entityNames?.skills ?? {};
  const text = locale.entityText?.skills ?? {};
  return skills
    .map((skill) => skill.id)
    .filter((id) => {
      const nameValue = names[id];
      const textNameValue = text[id]?.name;
      return (
        typeof nameValue !== "string" ||
        nameValue.length === 0 ||
        typeof textNameValue !== "string" ||
        textNameValue.length === 0
      );
    });
}

describe("skill locale coverage", () => {
  it("covers all current skill IDs in en locale", () => {
    expect(missingSkillLocaleIds(en)).toEqual([]);
  });

  it("covers all current skill IDs in zh locale", () => {
    expect(missingSkillLocaleIds(zh)).toEqual([]);
  });
});

