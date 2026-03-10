import { describe, expect, it, vi } from "vitest";
import uiTextJson from "../uiText.json";
import { buildReviewSheetData } from "./pageDataBuilders";

const t = uiTextJson.en;

describe("review sheet data builder", () => {
  it("builds review sheet data from pre-shaped review inputs", () => {
    const onExportJson = vi.fn();
    const onToggleProvenance = vi.fn();

    const result = buildReviewSheetData({
      t,
      characterName: "Aric",
      selectedRaceName: "Human",
      selectedClassName: "Fighter",
      reviewData: {
        identity: { level: 1, xp: 0, size: "Medium", speed: { base: 30, adjusted: 20 } },
        hp: { total: 12, breakdown: { hitDie: 10, con: 2, misc: 0 } },
        initiative: { total: 2 },
        bab: 1,
        saves: { fort: { base: 2, ability: 2, misc: 0, total: 4 }, ref: { base: 0, ability: 1, misc: 0, total: 1 }, will: { base: 0, ability: 0, misc: 0, total: 0 } },
        grapple: { total: 4 },
        abilities: { str: { score: 16, mod: 3 } },
        skillBudget: { spent: 4, total: 8, remaining: 4 },
        equipmentLoad: { selectedItems: ["chainmail"], totalWeight: 40, loadCategory: "medium", reducesSpeed: true },
        speed: { base: 30, adjusted: 20 },
        movement: { reducedByArmorOrLoad: true },
        rulesDecisions: { favoredClass: "any", ignoresMulticlassXpPenalty: true, featSelectionLimit: 2 },
      },
      reviewCombat: { ac: { total: 16, touch: 12, flatFooted: 14 }, attacks: [{ category: "melee", itemId: "longsword", name: "Longsword", attackBonus: 4, damageLine: "1d8+3", crit: "19-20/x2" }] },
      selectedFeats: ["power-attack"],
      featsById: { "power-attack": { name: "Power Attack", summary: "Trade attack for damage." } },
      racialTraits: [{ name: "Bonus Feat", description: "Humans gain one extra feat." }],
      skills: [{ id: "climb", name: "Climb", ranks: 0, racialBonus: 2, total: 5, abilityMod: 3, abilityKey: "str", misc: 0, acp: 0, costSpent: 0, costPerRank: 1 }],
      baseAbilityScores: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 8 },
      provenanceByTargetPath: new Map([["stats.bab", [{ setValue: 1, source: { packId: "srd-35e-minimal", entityId: "fighter" } }]]]),
      formatSourceLabel: () => "Fighter",
      localizeAbilityLabel: (ability) => ability.toUpperCase(),
      localizeEntityText: (_entityType, _entityId, _path, fallback) => fallback,
      enabledPackIds: ["srd-35e-minimal"],
      packVersionById: new Map([["srd-35e-minimal", "1.0.0"]]),
      selectedEditionLabel: "D&D 3.5e SRD",
      fingerprint: "abc123",
      localizeLoadCategory: (value) => value,
      formatSpeedImpact: () => "Reduced to 20",
      formatMovementNotes: () => ["Reduced by armor or load"],
      showProvenance: false,
      provenanceJson: "[]",
      onExportJson,
      onToggleProvenance,
    });

    expect(result.characterName).toBe("Aric");
    expect(result.skillsRows[0]?.name).toBe("Climb");
    expect(result.skillsRows).toHaveLength(1);
    expect(result.combatRows.find((row) => row.id === "bab")?.final).toBe("1");
    expect(result.onExportJson).toBe(onExportJson);
    expect(result.onToggleProvenance).toBe(onToggleProvenance);
  });
});
