import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Page } from "@dcb/schema";
import { PageComposer } from "./PageComposer";
import uiTextJson from "../uiText.json";

const t = uiTextJson.en;

describe("PageComposer", () => {
  it("renders a slot-based single-select page from schema data", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const schema: Page = {
      id: "character.race.singleSelect",
      root: {
        id: "race-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "race-picker",
            componentId: "entityType.singleSelect",
            slot: "main",
            dataSource: "page.entityChoice"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            entityChoice: {
              title: "Race",
              inputName: "race",
              value: "human",
              options: [
                { id: "human", label: "Human" },
                { id: "elf", label: "Elf" }
              ],
              onSelect
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Race" })).toBeTruthy();
    expect((screen.getByLabelText("Human") as HTMLInputElement).checked).toBe(
      true,
    );

    await user.click(screen.getByLabelText("Elf"));

    expect(onSelect).toHaveBeenCalledWith("elf");
  });

  it("renders a metadata text input block from schema data", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const schema: Page = {
      id: "character.name",
      root: {
        id: "metadata-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "metadata-name-field",
            componentId: "metadata.nameField",
            slot: "main",
            dataSource: "page.metadataName"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            metadataName: {
              title: "Name",
              label: "Name",
              inputId: "character-name-input",
              value: "Aric",
              placeholder: "Enter character name",
              onChange
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Name" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();

    await user.type(screen.getByLabelText("Name"), "a");

    expect(onChange).toHaveBeenCalledWith("Arica");
  });

  it("renders an abilities allocator block from prepared page data", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onIncrease = vi.fn();
    const schema: Page = {
      id: "character.abilities",
      root: {
        id: "abilities-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "abilities-allocator",
            componentId: "abilities.allocator",
            slot: "main",
            dataSource: "page.abilitiesAllocator"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            abilitiesAllocator: {
              t,
              title: "Ability Scores",
              modeSelector: {
                label: t.ABILITY_GENERATION_LABEL,
                helpLabel: t.ABILITY_METHOD_HELP_LABEL,
                helpText: t.ABILITY_METHOD_HINT_POINT_BUY,
                isHintVisible: false,
                isHintAvailable: true,
                value: "pointBuy",
                options: [
                  { value: "pointBuy", label: t.ABILITY_MODE_POINT_BUY },
                  { value: "rollSets", label: t.ABILITY_MODE_ROLL_SETS }
                ],
                onMouseEnter: vi.fn(),
                onMouseLeave: vi.fn(),
                onFocus: vi.fn(),
                onBlur: vi.fn(),
                onClick: vi.fn(),
                onKeyDown: vi.fn(),
                onChange: onModeChange,
                helpRef: { current: null }
              },
              pointBuyPanel: {
                pointCap: 32,
                pointCapMin: 20,
                pointCapMax: 40,
                pointCapStep: 1,
                pointBuyRemaining: 32,
                isTableOpen: false,
                costTable: { "8": 0, "9": 1 },
                onPointCapChange: vi.fn(),
                onToggleTable: vi.fn()
              },
              abilityRows: [{
                id: "str",
                label: "STR",
                value: 8,
                disabled: false,
                min: 8,
                max: 18,
                canDecrease: false,
                canIncrease: true,
                onChange: vi.fn(),
                onBlur: vi.fn(),
                onDecrease: vi.fn(),
                onIncrease
              }],
              modifierRows: [],
              showModifierTable: false
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Ability Scores" })).toBeTruthy();

    await user.selectOptions(
      screen.getByRole("combobox", { name: t.ABILITY_GENERATION_LABEL }),
      "rollSets",
    );
    await user.click(screen.getByRole("button", { name: /Increase STR/i }));

    expect(onModeChange).toHaveBeenCalledWith("rollSets");
    expect(onIncrease).toHaveBeenCalledTimes(1);
  });

  it("renders a skills allocator block from prepared page data", async () => {
    const user = userEvent.setup();
    const onIncrease = vi.fn();
    const schema: Page = {
      id: "character.skills",
      root: {
        id: "skills-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "skills-allocator",
            componentId: "skills.allocator",
            slot: "main",
            dataSource: "page.skillsAllocator"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            skillsAllocator: {
              t,
              title: "Skills",
              budget: {
                total: 8,
                spent: 0,
                remaining: 8
              },
              rows: [{
                id: "climb",
                name: "Climb",
                typeLabel: t.SKILLS_CLASS_LABEL,
                pointsLabel: `1${t.SKILLS_PER_RANK_UNIT}`,
                ranks: "0",
                decreaseLabel: "Decrease Climb",
                increaseLabel: "Increase Climb",
                canDecrease: false,
                canIncrease: true,
                onDecrease: vi.fn(),
                onIncrease,
                breakdown: "0 + 3 + 0 - 0 = 3",
                total: "3",
                notes: ["max 4", "racial +0", t.SKILLS_ACP_APPLIES_LABEL]
              }]
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Skills" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: t.SKILLS_TYPE_COLUMN })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Increase Climb" }));

    expect(onIncrease).toHaveBeenCalledTimes(1);
  });

  it("renders decomposed review blocks from prepared review data", async () => {
    const user = userEvent.setup();
    const onExportJson = vi.fn();
    const onToggleProvenance = vi.fn();
    const schema: Page = {
      id: "character.review",
      root: {
        id: "review-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "review-header",
            componentId: "review.header",
            slot: "main",
            dataSource: "page.reviewSheet.header"
          },
          {
            id: "review-stat-cards",
            componentId: "review.statCards",
            slot: "main",
            dataSource: "page.reviewSheet.statCards"
          },
          {
            id: "review-skills",
            componentId: "review.skills",
            slot: "main",
            dataSource: "page.reviewSheet.skills"
          },
          {
            id: "review-pack-info",
            componentId: "review.packInfo",
            slot: "main",
            dataSource: "page.reviewSheet.packInfo"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            reviewSheet: {
              header: {
                title: t.REVIEW,
                characterName: "Aric",
                raceLabel: t.RACE_LABEL,
                selectedRaceName: "Human",
                classLabel: t.CLASS_LABEL,
                selectedClassName: "Fighter",
                exportLabel: t.EXPORT_JSON,
                provenanceLabel: t.TOGGLE_PROVENANCE,
                onExportJson,
                onToggleProvenance
              },
              statCards: {
                cards: [{ label: t.REVIEW_AC_LABEL, value: 16 }]
              },
              skills: {
                title: t.REVIEW_SKILLS_BREAKDOWN,
                caption: t.REVIEW_SKILLS_TABLE_CAPTION,
                summaryLabel: `${t.REVIEW_POINTS_SPENT_LABEL} 4 / 8 (4 ${t.REVIEW_REMAINING_LABEL})`,
                columns: [
                  { key: "name", label: t.REVIEW_SKILL_COLUMN },
                  { key: "ranks", label: t.REVIEW_RANKS_COLUMN },
                  { key: "ability", label: t.REVIEW_ABILITY_COLUMN },
                  { key: "racial", label: t.REVIEW_RACIAL_COLUMN },
                  { key: "misc", label: t.REVIEW_MISC_COLUMN },
                  { key: "acp", label: t.REVIEW_ACP_COLUMN },
                  { key: "total", label: t.REVIEW_TOTAL_COLUMN },
                  { key: "pointCost", label: t.REVIEW_POINT_COST_COLUMN }
                ],
                rows: [{
                  id: "climb",
                  name: "Climb",
                  ranks: "4",
                  ability: "+3 (STR)",
                  racial: "+0",
                  misc: "+0",
                  acp: "-0",
                  total: "7",
                  pointCost: "4 (1/rank)"
                }]
              },
              packInfo: {
                title: t.REVIEW_PACK_INFO,
                selectedEditionLabel: t.REVIEW_SELECTED_EDITION_LABEL,
                enabledPacksLabel: t.REVIEW_ENABLED_PACKS_LABEL,
                fingerprintLabel: t.REVIEW_FINGERPRINT_LABEL,
                selectedEdition: "D&D 3.5e SRD",
                enabledPacks: [{ packId: "srd-35e-minimal", version: "1.0.0" }],
                fingerprint: "abc123"
              }
            }
          }
        }}
      />
    );

    expect(screen.getAllByRole("heading", { name: t.REVIEW }).length).toBeGreaterThan(0);
    expect(screen.getByText("Aric")).toBeTruthy();
    expect(
      screen.getAllByRole("columnheader", { name: t.REVIEW_SKILL_COLUMN }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/srd-35e-minimal \(1.0.0\)/)).toBeTruthy();
    expect(document.querySelectorAll(".review-page .sheet").length).toBeGreaterThan(0);
    expect(
      document.querySelector(
        '[data-page-composer-root="layout.singleColumn"] > .schema-layout-main > .review-page',
      ),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: t.EXPORT_JSON }));
    await user.click(screen.getByRole("button", { name: t.TOGGLE_PROVENANCE }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
    expect(onToggleProvenance).toHaveBeenCalledTimes(1);
  });

  it("keeps legacy review.sheet schemas rendering the full review surface", () => {
    const schema: Page = {
      id: "character.review.legacy",
      root: {
        id: "review-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "review-sheet",
            componentId: "review.sheet",
            slot: "main",
            dataSource: "page.reviewSheet"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            reviewSheet: {
              header: {
                title: t.REVIEW,
                characterName: "Aric",
                raceLabel: t.RACE_LABEL,
                selectedRaceName: "Human",
                classLabel: t.CLASS_LABEL,
                selectedClassName: "Fighter",
                exportLabel: t.EXPORT_JSON,
                provenanceLabel: t.TOGGLE_PROVENANCE,
                onExportJson: vi.fn(),
                onToggleProvenance: vi.fn()
              },
              identity: { title: t.REVIEW_IDENTITY_PROGRESSION, rows: [{ label: t.REVIEW_LEVEL_LABEL, value: 1 }] },
              statCards: { cards: [{ label: t.REVIEW_AC_LABEL, value: 16 }] },
              saveHp: { title: t.REVIEW_SAVE_HP_BREAKDOWN, columns: [], rows: [] },
              attacks: { title: t.REVIEW_ATTACK_LINES, columns: [], rows: [] },
              features: { featTitle: t.REVIEW_FEAT_SUMMARY, featSummary: [], traitTitle: t.REVIEW_TRAIT_SUMMARY, traitSummary: [], emptyLabel: "-" },
              abilities: { title: t.REVIEW_ABILITY_BREAKDOWN, columns: [], rows: [] },
              combat: { title: t.REVIEW_COMBAT_BREAKDOWN, columns: [], rows: [] },
              skills: { title: t.REVIEW_SKILLS_BREAKDOWN, summaryLabel: "summary", columns: [], rows: [] },
              equipment: { title: t.REVIEW_EQUIPMENT_LOAD, rows: [] },
              movement: { title: t.REVIEW_MOVEMENT_DETAIL, rows: [] },
              decisions: { title: t.REVIEW_RULES_DECISIONS, rows: [] },
              packInfo: {
                title: t.REVIEW_PACK_INFO,
                selectedEditionLabel: t.REVIEW_SELECTED_EDITION_LABEL,
                enabledPacksLabel: t.REVIEW_ENABLED_PACKS_LABEL,
                fingerprintLabel: t.REVIEW_FINGERPRINT_LABEL,
                selectedEdition: "D&D 3.5e SRD",
                enabledPacks: [{ packId: "srd-35e-minimal", version: "1.0.0" }],
                fingerprint: "abc123"
              }
            }
          }
        }}
      />
    );

    expect(screen.getAllByRole("heading", { name: t.REVIEW }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.REVIEW_PACK_INFO).length).toBeGreaterThan(0);
  });
});
