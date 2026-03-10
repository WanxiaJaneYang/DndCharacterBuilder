import { describe, expect, it, vi } from "vitest";
import uiTextJson from "../uiText.json";
import { buildReviewSheetPageData } from "./buildReviewSheetPageData";

const t = uiTextJson.en;

describe("buildReviewSheetPageData", () => {
  it("reads racial traits from selectedRaceEntity.data", () => {
    const result = buildReviewSheetPageData({
      t,
      characterName: "Aric",
      selectedRaceId: "human",
      selectedClassId: "fighter",
      selectedRaceEntity: {
        name: "Human",
        data: {
          racialTraits: [
            { name: "Bonus Feat", description: "Humans gain one extra feat." },
          ],
        },
      },
      selectedClassEntity: { name: "Fighter", data: {} },
      reviewData: {
        identity: { level: 1, xp: 0, size: "Medium", speed: { base: 30, adjusted: 30 } },
        hp: { total: 9, breakdown: { hitDie: 10, con: -1, misc: 0 } },
        initiative: { total: -1 },
        bab: 1,
        saves: {
          fort: { base: 2, ability: -1, misc: 0, total: 1 },
          ref: { base: 0, ability: -1, misc: 0, total: -1 },
          will: { base: 0, ability: -1, misc: 0, total: -1 },
        },
        grapple: { total: 0 },
        abilities: { str: { score: 8, mod: -1 } },
        skillBudget: { spent: 0, total: 8, remaining: 8 },
        equipmentLoad: { selectedItems: [], totalWeight: 0, loadCategory: "light", reducesSpeed: false },
        speed: { base: 30, adjusted: 30 },
        movement: { reducedByArmorOrLoad: false },
        rulesDecisions: { favoredClass: "any", ignoresMulticlassXpPenalty: true, featSelectionLimit: 3 },
      },
      reviewCombat: {
        ac: { total: 9, touch: 9, flatFooted: 9 },
        attacks: [{ category: "melee", itemId: "unarmed", name: "Unarmed Strike", attackBonus: 0, damageLine: "1d3-1", crit: "20/x2" }],
      },
      selectedFeats: [],
      featsById: {},
      skills: [],
      baseAbilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      provenanceByTargetPath: new Map(),
      sourceNameByEntityId: new Map(),
      localizeAbilityLabel: (ability) => ability.toUpperCase(),
      localizeEntityText: (_entityType, _entityId, _path, fallback) => fallback,
      enabledPackIds: ["srd-35e-minimal"],
      packVersionById: new Map([["srd-35e-minimal", "0.1.0"]]),
      selectedEditionLabel: "D&D 3.5 SRD",
      fingerprint: "abc123",
      localizeLoadCategory: (category) => category,
      formatSpeedImpact: () => "No speed reduction",
      formatMovementNotes: () => ["No movement penalty detected."],
      showProvenance: false,
      provenanceJson: "[]",
      onExportJson: vi.fn(),
      onToggleProvenance: vi.fn(),
    });

    expect(result.selectedRaceName).toBe("Human");
    expect(result.traitSummary).toHaveLength(1);
    expect(result.traitSummary[0]).toMatchObject({
      name: "Bonus Feat",
      description: "Humans gain one extra feat.",
    });
  });
});
