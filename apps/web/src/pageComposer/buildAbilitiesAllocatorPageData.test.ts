import { describe, expect, it, vi } from "vitest";
import uiTextJson from "../uiText.json";
import { buildAbilitiesAllocatorPageData } from "./buildAbilitiesAllocatorPageData";

const t = uiTextJson.en;

describe("buildAbilitiesAllocatorPageData", () => {
  it("forwards prebuilt mode selector handlers without owning interaction policy", () => {
    const modeSelectorHandlers = {
      onMouseEnter: vi.fn(),
      onMouseLeave: vi.fn(),
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
      onChange: vi.fn(),
      helpRef: { current: null },
    };

    const result = buildAbilitiesAllocatorPageData({
      t,
      title: "Ability Scores",
      abilityModes: ["pointBuy", "rollSets"],
      selectedAbilityMode: "pointBuy",
      selectedAbilityModeValue: "pointBuy",
      modeUi: {
        pointBuy: {
          labelKey: "ABILITY_MODE_POINT_BUY",
          hintKey: "ABILITY_METHOD_HINT_POINT_BUY",
        },
      },
      abilityMethodHintOpen: true,
      modeSelectorHandlers,
      abilityOrder: ["str", "dex", "con", "int", "wis", "cha"],
      abilityScores: { str: 8, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilityMinScore: 8,
      abilityMaxScore: 18,
      rollSetNeedsSelection: false,
      onAbilityChange: vi.fn(),
      onAbilityBlur: vi.fn(),
      onAbilityStep: vi.fn(),
      reviewAbilities: { str: { score: 10, mod: 0 } },
      provenanceByTargetPath: new Map(),
      sourceMetaByEntityKey: new Map(),
      localizeAbilityLabel: (ability) => ability.toUpperCase(),
      showModifierTable: true,
      hideZeroGroups: true,
      sourceTypeLabels: {},
    });

    expect(result.modeSelector.onMouseEnter).toBe(modeSelectorHandlers.onMouseEnter);
    expect(result.modeSelector.onMouseLeave).toBe(modeSelectorHandlers.onMouseLeave);
    expect(result.modeSelector.onFocus).toBe(modeSelectorHandlers.onFocus);
    expect(result.modeSelector.onBlur).toBe(modeSelectorHandlers.onBlur);
    expect(result.modeSelector.onClick).toBe(modeSelectorHandlers.onClick);
    expect(result.modeSelector.onKeyDown).toBe(modeSelectorHandlers.onKeyDown);
    expect(result.modeSelector.onChange).toBe(modeSelectorHandlers.onChange);
    expect(result.modeSelector.helpRef).toBe(modeSelectorHandlers.helpRef);
  });
});
