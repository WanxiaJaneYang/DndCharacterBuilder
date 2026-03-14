import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createReviewComputeResult,
  renderReviewStep,
} from "./review/reviewTestHelpers";

describe("ReviewStep", () => {
  it("renders engine-backed review summaries instead of conflicting UI props", () => {
    const { text } = renderReviewStep();

    expect(
      screen.getByText(new RegExp(`${text.REVIEW_TOTAL_WEIGHT_LABEL}:\\s*40`, "i")),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(`${text.REVIEW_LOAD_CATEGORY_LABEL}:\\s*loc:medium`, "i"),
      ),
    ).toBeTruthy();
    expect(
      screen.getAllByText(
        new RegExp(`${text.REVIEW_SPEED_BASE_LABEL}:\\s*30`, "i"),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        new RegExp(`${text.REVIEW_SPEED_ADJUSTED_LABEL}:\\s*20`, "i"),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        new RegExp(`${text.REVIEW_SPEED_IMPACT_LABEL}:\\s*reduced:20`, "i"),
      ),
    ).toBeTruthy();
    expect(screen.getByText(/engine-reduced/i)).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_POINTS_SPENT_LABEL}\\s+0\\s*/\\s*8\\s*\\(\\s*8\\s*${text.REVIEW_REMAINING_LABEL}\\s*\\)`,
          "i",
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_FAVORED_CLASS_LABEL}:\\s*${text.REVIEW_FAVORED_CLASS_ANY}`,
          "i",
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${text.REVIEW_MULTICLASS_XP_IGNORED_LABEL}:\\s*${text.REVIEW_YES}`,
          "i",
        ),
      ),
    ).toBeTruthy();
  });

  it("uses engine-backed speed values in the combat breakdown even when provenance disagrees", () => {
    const { text } = renderReviewStep({
      provenanceByTargetPath: new Map([
        [
          "stats.speed",
          [
            {
              targetPath: "stats.speed",
              setValue: 1234,
              source: { packId: "test-pack", entityId: "speed-override" },
            },
          ],
        ],
      ]),
    });

    const combatSection = screen
      .getAllByRole("heading", {
        name: text.REVIEW_COMBAT_BREAKDOWN,
      })
      .map((heading) => heading.closest("article"))
      .find((article) =>
        article?.textContent?.includes(text.REVIEW_SPEED_LABEL),
      );

    expect(combatSection).toBeTruthy();

    const speedRow = within(combatSection as HTMLElement)
      .getByText(text.REVIEW_SPEED_LABEL)
      .closest("tr");

    expect(speedRow).toBeTruthy();
    expect(speedRow?.textContent).toContain("30");
    expect(speedRow?.textContent).toContain("20");
    expect(speedRow?.textContent).not.toContain("1234");
  });

  it("keeps derived zero-rank skills visible in the legacy fallback review step", () => {
    const computeResult = createReviewComputeResult();
    computeResult.sheetViewModel.data.skills = [
      {
        id: "listen",
        name: "Listen",
        abilityKey: "wis",
        abilityMod: 0,
        racialBonus: 0,
        misc: 2,
        acp: 0,
        total: 2,
        ranks: 0,
        costSpent: 0,
        costPerRank: 2,
        maxRanks: 2,
        classSkill: false,
        acpApplied: false,
      },
    ];

    renderReviewStep({ computeResult });

    const skillsTable = screen
      .getAllByRole("table", { name: /Skills and point-spending table/i })
      .find((table) => within(table).queryByRole("cell", { name: "Listen" }));

    expect(skillsTable).toBeTruthy();
    expect(
      within(skillsTable as HTMLElement).getByRole("cell", { name: "Listen" }),
    ).toBeTruthy();
    expect(
      within(skillsTable as HTMLElement).getByRole("cell", { name: "+2" }),
    ).toBeTruthy();
  });
});
