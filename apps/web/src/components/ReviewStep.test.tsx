import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderReviewStep } from "./review/reviewTestHelpers";

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
});
