import { expect, test, type Page } from '@playwright/test';

type Locale = 'en' | 'zh';

const labels = {
  player: /Player|\u73a9\u5bb6/i,
  next: /Next|\u4e0b\u4e00\u6b65/i,
  startWizard: /Start Wizard|\u5f00\u59cb\u521b\u5efa/i,
  rulesSetupHeading: /Rules Setup|\u89c4\u5219\u8bbe\u7f6e/i,
  raceHeading: /Race|\u79cd\u65cf/i,
  classHeading: /Class|\u804c\u4e1a/i,
  abilityHeading: /Ability Scores|\u5c5e\u6027/i,
  featHeading: /Feat|\u4e13\u957f/i,
  skillsHeading: /Skills|\u6280\u80fd/i,
  english: /EN|English/i,
  chinese: /\u4e2d\u6587|Chinese/i,
  human: /Human|\u4eba\u7c7b/i,
  fighter: /^(?:Fighter(?: \(Level 1\))?|\u6218\u58eb(?:\uff081\u7ea7\uff09)?)$/i,
  powerAttack: /Power Attack|\u5f3a\u529b\u653b\u51fb/i,
  str: /STR|\u529b\u91cf/i,
  climb: /Climb|\u6500\u722c/i,
  diplomacy: /Diplomacy|\u4ea4\u6d89/i,
  increaseClimb: /Increase Climb|\u63d0\u9ad8 \u6500\u722c/i,
  increaseDiplomacy: /Increase Diplomacy|\u63d0\u9ad8 \u4ea4\u6d89/i,
};

async function chooseLanguage(page: Page, locale: Locale) {
  const radio = page.getByRole('radio', {
    name: locale === 'zh' ? labels.chinese : labels.english,
  });
  await radio.click();
  await expect(radio).toBeChecked();
  await expect(page.locator(`main[lang="${locale}"]`)).toBeVisible();
}

async function clickNext(page: Page) {
  const next = page.getByRole('button', { name: labels.next });
  await expect(next).toBeVisible();
  await next.scrollIntoViewIfNeeded();
  await next.click({ force: true });
}

async function goToSkillsStep(page: Page, locale: Locale) {
  await page.goto('/');
  await chooseLanguage(page, locale);
  await page.getByRole('button', { name: labels.player }).click();

  await expect(page.getByRole('heading', { name: labels.rulesSetupHeading })).toBeVisible();
  await page.getByRole('button', { name: labels.startWizard }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.raceHeading })).toBeVisible();
  await page.getByLabel(labels.human).click();
  await clickNext(page);

  await expect(page.getByRole('heading', { name: labels.classHeading })).toBeVisible();
  await page.getByLabel(labels.fighter).click();
  await clickNext(page);

  await expect(page.getByRole('heading', { name: labels.abilityHeading })).toBeVisible();
  await page.getByRole('spinbutton', { name: labels.str }).fill('13');
  await clickNext(page);

  await expect(page.getByRole('heading', { name: labels.featHeading })).toBeVisible();
  await page.getByLabel(labels.powerAttack).click();
  await clickNext(page);

  await expect(page.getByRole('heading', { name: labels.skillsHeading })).toBeVisible();
}

for (const locale of ['en', 'zh'] as const) {
  test.describe(`skills step e2e regression (${locale})`, () => {
    test('skill point investment UI updates class-skill ranks', async ({ page }) => {
      await goToSkillsStep(page, locale);

      const climbRanks = page.getByLabel(/Climb\s+ranks|\u6500\u722c\s+ranks/i);
      const climbDecrease = page.getByRole('button', { name: /Decrease Climb|\u964d\u4f4e \u6500\u722c/i });
      await expect(climbRanks).toHaveText('0');
      await expect(climbDecrease).toBeDisabled();

      await page.getByRole('button', { name: labels.increaseClimb }).click();
      await expect(climbRanks).toHaveText('1');

      await climbDecrease.click();
      await expect(climbRanks).toHaveText('0');
      await expect(climbDecrease).toBeDisabled();
    });

    test('class and cross-class skills use the expected rank increments', async ({ page }) => {
      await goToSkillsStep(page, locale);

      const climbRow = page.getByRole('row', { name: labels.climb });
      const diplomacyRow = page.getByRole('row', { name: labels.diplomacy });

      await expect(climbRow).toContainText(/Class|\u672c\u804c/i);
      await expect(diplomacyRow).toContainText(/Cross|\u8de8\u804c/i);

      const climbRanks = page.getByLabel(/Climb\s+ranks|\u6500\u722c\s+ranks/i);
      const diplomacyRanks = page.getByLabel(/Diplomacy\s+ranks|\u4ea4\u6d89\s+ranks/i);

      await page.getByRole('button', { name: labels.increaseClimb }).click();
      await expect(climbRanks).toHaveText('1');

      await page.getByRole('button', { name: labels.increaseDiplomacy }).click();
      await expect(diplomacyRanks).toHaveText('0.5');
    });

    test('enforces level-1 rank caps and disables increase controls at cap', async ({ page }) => {
      await goToSkillsStep(page, locale);

      const climbRanks = page.getByLabel(/Climb\s+ranks|\u6500\u722c\s+ranks/i);
      const climbIncrease = page.getByRole('button', { name: labels.increaseClimb });
      for (let i = 0; i < 8; i += 1) {
        if (await climbIncrease.isDisabled()) break;
        await climbIncrease.click();
      }
      await expect(climbRanks).toHaveText('4');
      await expect(climbIncrease).toBeDisabled();

      const diplomacyRanks = page.getByLabel(/Diplomacy\s+ranks|\u4ea4\u6d89\s+ranks/i);
      const diplomacyIncrease = page.getByRole('button', { name: labels.increaseDiplomacy });
      for (let i = 0; i < 8; i += 1) {
        if (await diplomacyIncrease.isDisabled()) break;
        await diplomacyIncrease.click();
      }
      await expect(diplomacyRanks).toHaveText('2');
      await expect(diplomacyIncrease).toBeDisabled();
    });

  });
}
