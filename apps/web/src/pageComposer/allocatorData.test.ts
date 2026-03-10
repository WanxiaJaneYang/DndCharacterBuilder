import { describe, expect, it, vi } from "vitest";
import uiTextJson from "../uiText.json";
import { type AbilityMode, buildAbilitiesAllocatorData, buildSkillsAllocatorData } from "./pageDataBuilders";

const t = uiTextJson.en;

describe("allocator data builders", () => {
  it("builds abilities allocator data with grouped modifier rows", () => {
    const abilityModes: AbilityMode[] = ["pointBuy", "rollSets"];
    const result = buildAbilitiesAllocatorData({
      t,
      title: "Ability Scores",
      abilityModes,
      selectedAbilityMode: "pointBuy",
      selectedAbilityModeValue: "pointBuy",
      modeUi: { pointBuy: { labelKey: "ABILITY_MODE_POINT_BUY", hintKey: "ABILITY_METHOD_HINT_POINT_BUY" } },
      abilityMethodHintOpen: true,
      modeSelectorHandlers: { onMouseEnter: vi.fn(), onMouseLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onClick: vi.fn(), onKeyDown: vi.fn(), onChange: vi.fn(), helpRef: { current: null } },
      pointBuyPanel: { pointCap: 32, pointCapMin: 20, pointCapMax: 40, pointCapStep: 1, pointBuyRemaining: 32, isTableOpen: false, costTable: { "8": 0, "9": 1 }, onPointCapChange: vi.fn(), onToggleTable: vi.fn() },
      rollSetsPanel: undefined,
      abilityOrder: ["str", "dex", "con", "int", "wis", "cha"],
      abilityScores: { str: 8, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilityMinScore: 8,
      abilityMaxScore: 18,
      rollSetNeedsSelection: false,
      onAbilityChange: vi.fn(),
      onAbilityBlur: vi.fn(),
      onAbilityStep: vi.fn(),
      reviewAbilities: { str: { score: 10, mod: 0 } },
      provenanceByTargetPath: new Map([["abilities.str.score", [{ delta: 2, source: { packId: "srd-35e-minimal", entityId: "elf" } }]]]),
      sourceMetaByEntityKey: new Map([["srd-35e-minimal:elf", { sourceType: "races", sourceLabel: "Elf" }]]),
      localizeAbilityLabel: (ability) => ability.toUpperCase(),
      showModifierTable: true,
      hideZeroGroups: true,
      sourceTypeLabels: { races: "Race" },
    });

    expect(result.modeSelector.helpText).toBe(t.ABILITY_METHOD_HINT_POINT_BUY);
    expect(result.modifierRows[0]?.groups[0]?.label).toBe("Race");
    expect(result.pointBuyPanel?.pointCap).toBe(32);
  });

  it("builds skills allocator data with notes and breakdown rows", () => {
    const onUpdateRanks = vi.fn();
    const result = buildSkillsAllocatorData({
      t,
      title: "Skills",
      budget: { total: 8, spent: 0, remaining: 8 },
      skills: [{ id: "climb", displayName: "Climb", data: { armorCheckPenaltyApplies: true } }],
      skillViewModelById: new Map([["climb", { classSkill: true, costPerRank: 1, maxRanks: 4, racialBonus: 0, misc: 0, acp: 0, abilityMod: 3, total: 3, acpApplied: true }]]),
      selectedSkillRanks: { climb: 0 },
      onUpdateRanks,
    });

    expect(result.budget.remaining).toBe(8);
    expect(result.rows[0]?.notes[2]).toBe(t.SKILLS_ACP_APPLIES_LABEL);
    expect(result.rows[0]?.breakdown).toContain("= 3");
    result.rows[0]?.onIncrease();
    expect(onUpdateRanks).toHaveBeenCalledWith("climb", 1);
  });
});
