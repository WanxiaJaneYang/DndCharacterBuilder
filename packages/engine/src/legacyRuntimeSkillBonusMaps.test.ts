import { describe, expect, it } from "./engineTestSupport";
import { buildEffectSkillBonusBreakdown } from "./legacyRuntimeSkillBonusMaps";

describe("buildEffectSkillBonusBreakdown", () => {
  it("keeps all effect provenance entries for the same skill", () => {
    const breakdown = buildEffectSkillBonusBreakdown([
      {
        targetPath: "skillBonuses.balance",
        delta: 2,
        source: { packId: "srd-35e-minimal", entityId: "agile" }
      },
      {
        targetPath: "skillBonuses.balance",
        delta: 3,
        source: { packId: "srd-35e-minimal", entityId: "cat-grace" }
      }
    ]);

    expect(breakdown.balance).toEqual([
      expect.objectContaining({
        sourceType: "effect",
        bonus: 2,
        source: expect.objectContaining({ entityId: "agile" })
      }),
      expect.objectContaining({
        sourceType: "effect",
        bonus: 3,
        source: expect.objectContaining({ entityId: "cat-grace" })
      })
    ]);
  });
});
