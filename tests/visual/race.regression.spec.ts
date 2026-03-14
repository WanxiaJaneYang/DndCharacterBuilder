import { expect, test, type Page } from "@playwright/test";

type Locale = "en" | "zh";

const locales: Locale[] = ["en", "zh"];

const labels = {
  player: /Player|\u73a9\u5bb6/i,
  back: /Back|\u4e0a\u4e00\u6b65|\u8fd4\u56de/i,
  next: /Next|\u4e0b\u4e00\u6b65/i,
  startWizard: /Start Wizard|\u5f00\u59cb\u521b\u5efa/i,
  rulesSetupHeading: /Rules Setup|\u89c4\u5219\u8bbe\u7f6e/i,
  raceHeading: /Race|\u79cd\u65cf/i,
  classHeading: /Class|\u804c\u4e1a/i,
  english: /EN|English/i,
  chinese: /\u4e2d\u6587|Chinese/i,
  human: /Human|\u4eba\u7c7b/i,
};

async function chooseLanguage(page: Page, locale: Locale) {
  const radio = page.getByRole("radio", {
    name: locale === "zh" ? labels.chinese : labels.english,
  });
  await radio.click();
  await expect(radio).toBeChecked();
  await expect(page.locator(`main[lang="${locale}"]`)).toBeVisible();
}

async function goToRaceStep(page: Page, locale: Locale) {
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
}

test.describe("race step e2e regression", () => {
  for (const locale of locales) {
    test(`blocks progression until a race is selected (${locale})`, async ({
      page,
    }) => {
      await goToRaceStep(page, locale);

      const next = page.getByRole("button", { name: labels.next });
      await expect(next).toBeDisabled();

      await page.getByLabel(labels.human).click();
      await expect(next).toBeEnabled();
      await next.click({ force: true });

      await expect(
        page.getByRole("heading", { name: labels.classHeading }),
      ).toBeVisible();
    });

    test(`keeps the selected race when navigating back from class (${locale})`, async ({
      page,
    }) => {
      await goToRaceStep(page, locale);

      await page.getByLabel(labels.human).click();
      await page.getByRole("button", { name: labels.next }).click({
        force: true,
      });
      await expect(
        page.getByRole("heading", { name: labels.classHeading }),
      ).toBeVisible();

      await page.getByRole("button", { name: labels.back }).click();
      const human = page.getByRole("radio", { name: labels.human });
      await expect(human).toBeChecked();
    });
  }
});
