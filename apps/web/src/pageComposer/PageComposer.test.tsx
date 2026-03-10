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

  it("renders a review sheet block from prepared review data", async () => {
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
              t,
              characterName: "Aric",
              selectedRaceName: "Human",
              selectedClassName: "Fighter",
              identityRows: [{ label: t.REVIEW_LEVEL_LABEL, value: 1 }],
              statCards: [{ label: t.REVIEW_AC_LABEL, value: 16 }],
              saveHpRows: [{
                label: t.REVIEW_FORT_LABEL,
                base: 2,
                ability: 2,
                adjustments: 0,
                final: 4
              }],
              attackRows: [{
                id: "melee-longsword",
                typeLabel: t.REVIEW_ATTACK_MELEE_LABEL,
                name: "Longsword",
                attackBonus: "+4",
                damage: "1d8+3",
                crit: "19-20/x2",
                range: "-"
              }],
              featSummary: [{ id: "power-attack", name: "Power Attack", description: "Trade attack for damage." }],
              traitSummary: [{ id: "bonus-feat", name: "Bonus Feat", description: "Humans gain one extra feat." }],
              abilityRows: [{
                id: "str",
                label: "STR",
                base: 16,
                adjustments: [],
                final: 16,
                mod: "+3"
              }],
              combatRows: [{
                id: "bab",
                label: t.REVIEW_BAB_LABEL,
                base: 1,
                adjustments: [],
                final: "1"
              }],
              skillsSummary: { spent: 4, total: 8, remaining: 4 },
              skillsRows: [{
                id: "climb",
                name: "Climb",
                ranks: "4",
                ability: "+3 (STR)",
                racial: "+0",
                misc: "+0",
                acp: "-0",
                total: "7",
                pointCost: "4 (1/rank)"
              }],
              equipmentLoad: {
                selectedItems: "Chainmail",
                totalWeight: 40,
                loadCategory: "Medium",
                speedImpact: "Reduced to 20"
              },
              movementDetail: {
                base: 30,
                adjusted: 20,
                notes: "Reduced by armor or load"
              },
              rulesDecisions: {
                favoredClass: "Any",
                ignoresMulticlassXpPenalty: "Yes",
                featSelectionLimit: 2
              },
              packInfo: {
                selectedEdition: "D&D 3.5e SRD",
                enabledPacks: [{ packId: "srd-35e-minimal", version: "1.0.0" }],
                fingerprint: "abc123"
              },
              showProvenance: false,
              provenanceJson: "[]",
              onExportJson,
              onToggleProvenance
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: t.REVIEW })).toBeTruthy();
    expect(screen.getByText("Aric")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: t.EXPORT_JSON }));
    await user.click(screen.getByRole("button", { name: t.TOGGLE_PROVENANCE }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
    expect(onToggleProvenance).toHaveBeenCalledTimes(1);
  });
});
