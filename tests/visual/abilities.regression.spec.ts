import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

type Locale = "en" | "zh";

const locales: Locale[] = ["en", "zh"];

const labels = {
  player: /Player|\u73a9\u5bb6/i,
  next: /Next|\u4e0b\u4e00\u6b65/i,
  back: /Back|\u4e0a\u4e00\u6b65|\u8fd4\u56de/i,
  rulesSetupHeading: /Rules Setup|\u89c4\u5219\u8bbe\u7f6e/i,
  startWizard: /Start Wizard|\u5f00\u59cb\u521b\u5efa/i,
  raceHeading: /Race|\u79cd\u65cf/i,
  classHeading: /Class|\u804c\u4e1a/i,
  abilityHeading: /Ability Scores|\u5c5e\u6027/i,
  featHeading: /Feat|\u4e13\u957f/i,
  reviewHeading: /Review|\u603b\u89c8/i,
  reviewAbilityBreakdown:
    /Ability Score Breakdown|\u5c5e\u6027\u503c\u660e\u7ec6/i,
  reviewFingerprintLabel: /Fingerprint|\u6307\u7eb9/i,
  exportJson: /Export JSON|\u5bfc\u51fa JSON/i,
  human: /Human|\u4eba\u7c7b/i,
  fighter:
    /^(?:Fighter(?: \(Level 1\))?|\u6218\u58eb(?:\uff081\u7ea7\uff09)?)$/i,
  abilityGeneration: /Ability Generation|\u751f\u6210\u65b9\u5f0f/i,
  pointCap: /Point Cap|\u70b9\u6570\u4e0a\u9650/i,
  pointsRemaining: /Points Remaining|\u5269\u4f59\u70b9\u6570/i,
  pointBuyToggle:
    /(?:Show|Hide) Point Buy Table|(?:\u5c55\u5f00|\u6536\u8d77)\u70b9\u8d2d\u8868/i,
  pointBuyTable: /Point Buy Cost Table|\u70b9\u8d2d\u82b1\u8d39\u8868/i,
  str: /STR|\u529b\u91cf/i,
  increaseStr: /Increase STR|\u63d0\u9ad8\s*\u529b\u91cf/i,
  decreaseStr: /Decrease STR|\u964d\u4f4e\s*\u529b\u91cf/i,
  set1: /(?:Set\s*1|\u7b2c\s*1\s*\u7ec4)/i,
  english: /EN|English/i,
  chinese: /\u4e2d\u6587|Chinese/i,
};

async function chooseLanguage(page: Page, locale: Locale) {
  const radioName = locale === "zh" ? labels.chinese : labels.english;
  const radio = page.getByRole("radio", { name: radioName });
  await radio.click();
  await expect(radio).toBeChecked();
  await expect(page.locator(`main[lang="${locale}"]`)).toBeVisible();
}

async function clickNext(page: Page) {
  const next = page.getByRole("button", { name: labels.next });
  await expect(next).toBeVisible();
  await next.scrollIntoViewIfNeeded();
  // Mobile layouts can have overlapping content near footer actions.
  await next.click({ force: true });
}

async function goToReviewStep(page: Page) {
  for (let i = 0; i < 50; i += 1) {
    if (
      await page
        .getByRole("heading", { name: labels.reviewHeading })
        .isVisible()
    ) {
      return;
    }
    const next = page.getByRole("button", { name: labels.next });
    if (!(await next.isVisible()) || (await next.isDisabled())) break;
    await clickNext(page);
  }
  await expect(
    page.getByRole("heading", { name: labels.reviewHeading }),
  ).toBeVisible();
}

async function goToAbilitiesStep(page: Page, locale: Locale) {
  await page.goto("/");
  await chooseLanguage(page, locale);

  await page.getByRole("button", { name: labels.player }).click();
  await expect(
    page.getByRole("heading", { name: labels.rulesSetupHeading }),
  ).toBeVisible();
  await page.getByRole("button", { name: labels.startWizard }).click({
    force: true,
  });

  await expect(
    page.getByRole("heading", { name: labels.raceHeading }),
  ).toBeVisible();
  await page.getByLabel(labels.human).click();
  await clickNext(page);

  await expect(
    page.getByRole("heading", { name: labels.classHeading }),
  ).toBeVisible();
  await page.getByLabel(labels.fighter).click();
  await clickNext(page);

  await expect(
    page.getByRole("heading", { name: labels.abilityHeading }),
  ).toBeVisible();
}

test.describe("abilities step e2e regression", () => {
  for (const locale of locales) {
    test(`point-buy defaults and STR stepping update remaining points correctly (${locale})`, async ({
      page,
    }) => {
      await goToAbilitiesStep(page, locale);

      await expect(
        page.getByRole("combobox", { name: labels.abilityGeneration }),
      ).toHaveValue("pointBuy");
      await expect(
        page.getByRole("spinbutton", { name: labels.pointCap }),
      ).toHaveValue("32");
      await expect(
        page.getByText(/(?:Points Remaining|\u5269\u4f59\u70b9\u6570):\s*32/i),
      ).toBeVisible();

      const strInput = page.getByRole("spinbutton", { name: labels.str });
      await expect(strInput).toHaveValue("8");

      await page.getByRole("button", { name: labels.increaseStr }).click();
      await expect(strInput).toHaveValue("9");
      await expect(
        page.getByText(/(?:Points Remaining|\u5269\u4f59\u70b9\u6570):\s*31/i),
      ).toBeVisible();

      await page.getByRole("button", { name: labels.increaseStr }).click();
      await expect(strInput).toHaveValue("10");
      await expect(
        page.getByText(/(?:Points Remaining|\u5269\u4f59\u70b9\u6570):\s*30/i),
      ).toBeVisible();

      await page.getByRole("button", { name: labels.decreaseStr }).click();
      await expect(strInput).toHaveValue("9");
      await expect(
        page.getByText(/(?:Points Remaining|\u5269\u4f59\u70b9\u6570):\s*31/i),
      ).toBeVisible();
    });

    test(`point-buy table is hidden by default and toggles open (${locale})`, async ({
      page,
    }) => {
      await goToAbilitiesStep(page, locale);

      const table = page.getByRole("table", { name: labels.pointBuyTable });
      await expect(table).toBeHidden();

      const toggle = page.getByRole("button", { name: labels.pointBuyToggle });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();

      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(table).toBeVisible();
    });

    test(`roll-sets mode disables ability input before set selection and enables after selection (${locale})`, async ({
      page,
    }) => {
      await goToAbilitiesStep(page, locale);

      const generationSelect = page.getByRole("combobox", {
        name: labels.abilityGeneration,
      });
      await generationSelect.selectOption("rollSets");

      const strInput = page.getByRole("spinbutton", { name: labels.str });
      await expect(strInput).toBeDisabled();

      await page.getByRole("radio", { name: labels.set1 }).click();
      await expect(strInput).toBeEnabled();
    });

    test(`ability changes persist after navigating away and back (${locale})`, async ({
      page,
    }) => {
      await goToAbilitiesStep(page, locale);

      const strInput = page.getByRole("spinbutton", { name: labels.str });
      await page.getByRole("button", { name: labels.increaseStr }).click();
      await expect(strInput).toHaveValue("9");

      await clickNext(page);
      await expect(
        page.getByRole("heading", { name: labels.featHeading }),
      ).toBeVisible();

      await page.getByRole("button", { name: labels.back }).click();
      await expect(
        page.getByRole("heading", { name: labels.abilityHeading }),
      ).toBeVisible();
      await expect(
        page.getByRole("spinbutton", { name: labels.str }),
      ).toHaveValue("9");
    });

    test(`review reflects ability changes and provenance metadata (${locale})`, async ({
      page,
    }) => {
      await goToAbilitiesStep(page, locale);

      await page.getByRole("button", { name: labels.increaseStr }).click();
      await expect(
        page.getByRole("spinbutton", { name: labels.str }),
      ).toHaveValue("9");

      await goToReviewStep(page);
      await expect(
        page.getByRole("heading", { name: labels.reviewAbilityBreakdown }),
      ).toBeVisible();
      await expect(page.getByText(labels.reviewFingerprintLabel)).toBeVisible();

      const abilitySection = page
        .locator("article")
        .filter({
          has: page.getByRole("heading", {
            name: labels.reviewAbilityBreakdown,
          }),
        })
        .first();
      const strRow = abilitySection
        .locator("tr")
        .filter({ hasText: labels.str })
        .first();
      await expect(strRow).toContainText("9");
      await expect(strRow).toContainText("-1");

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: labels.exportJson }).click();
      const download = await downloadPromise;
      const filePath = await download.path();
      expect(filePath).toBeTruthy();
      const exported = JSON.parse(
        await readFile(filePath as string, "utf-8"),
      ) as {
        schemaVersion?: string;
        sheetViewModel?: {
          schemaVersion?: string;
          data?: {
            combat?: { ac?: { total?: number } };
            skills?: Array<{ id?: string; total?: number }>;
          };
        };
        validationIssues?: unknown[];
        unresolved?: unknown[];
        assumptions?: unknown[];
        provenance?: Array<{
          targetPath?: string;
          source?: { packId?: string; entityId?: string };
        }>;
      };
      expect(exported.schemaVersion).toBe("0.1");
      expect(exported.sheetViewModel?.schemaVersion).toBe("0.1");
      expect(exported.sheetViewModel?.data?.combat?.ac?.total).toBeGreaterThan(
        0,
      );
      expect(Array.isArray(exported.sheetViewModel?.data?.skills)).toBe(true);
      expect(Array.isArray(exported.validationIssues)).toBe(true);
      expect(Array.isArray(exported.unresolved)).toBe(true);
      expect(Array.isArray(exported.assumptions)).toBe(true);
      expect(Array.isArray(exported.provenance)).toBe(true);
      expect((exported.provenance ?? []).length).toBeGreaterThan(0);
      expect(
        (exported.provenance ?? []).some(
          (record) =>
            Boolean(record.targetPath) &&
            Boolean(record.source?.packId) &&
            Boolean(record.source?.entityId),
        ),
      ).toBe(true);
    });
  }
});
