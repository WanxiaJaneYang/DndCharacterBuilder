import { expect, test, type Page } from '@playwright/test';

const labels = {
  player: /Player|\u73a9\u5bb6/i,
  next: /Next|\u4e0b\u4e00\u6b65/i,
  namePlaceholder: /Enter character name|\u8f93\u5165\u89d2\u8272\u59d3\u540d/i,
  abilityHeading: /Ability Scores|\u5c5e\u6027/i,
  raceHeading: /Race|\u79cd\u65cf/i,
  classHeading: /Class|\u804c\u4e1a/i,
  featHeading: /Feat|\u4e13\u957f/i,
  skillsHeading: /Skills|\u6280\u80fd/i,
  equipmentHeading: /Equipment|\u88c5\u5907/i,
  reviewHeading: /Review|\u603b\u89c8/i,
  english: /EN|English/i,
  chinese: /\u4e2d\u6587|Chinese/i,
};

type Locale = 'en' | 'zh';

async function chooseLanguage(page: Page, locale: Locale) {
  const radioName = locale === 'zh' ? labels.chinese : labels.english;
  await page.getByRole('radio', { name: radioName }).click();
}

async function enterPlayerFlow(page: Page) {
  const playerButton = page.getByRole('button', { name: labels.player });
  await expect(playerButton).toBeVisible();
  await playerButton.click();
}

async function goToHomePage(page: Page, locale: Locale) {
  await page.goto('/');
  await chooseLanguage(page, locale);
  await enterPlayerFlow(page);
}

async function goToListPage(page: Page, locale: Locale) {
  await goToHomePage(page, locale);
  await page.getByPlaceholder(labels.namePlaceholder).fill('Snapshot Hero');
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.abilityHeading })).toBeVisible();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.raceHeading })).toBeVisible();
}

async function goToDetailPage(page: Page, locale: Locale) {
  await goToListPage(page, locale);
  await page.getByLabel('Human').click();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.classHeading })).toBeVisible();
  await page.getByLabel('Fighter (Level 1)').click();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.featHeading })).toBeVisible();
  await page.getByLabel('Weapon Focus (Longsword)').click();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.skillsHeading })).toBeVisible();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.equipmentHeading })).toBeVisible();
  await page.getByRole('button', { name: labels.next }).click();
  await expect(page.getByRole('heading', { name: labels.reviewHeading })).toBeVisible();
}

async function waitForVisualStability(page: Page) {
  await page.waitForLoadState('networkidle');
}

// Small ratio threshold to tolerate platform anti-aliasing without hiding real regressions.
const screenshotOptions = { fullPage: true, maxDiffPixelRatio: 0.0005 };

test.describe('wizard visual regression', () => {
  test('step0 role selection (en)', async ({ page }) => {
    await page.goto('/');
    await chooseLanguage(page, 'en');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('step0-role-selection-en.png', screenshotOptions);
  });

  test('step0 role selection (zh)', async ({ page }) => {
    await page.goto('/');
    await chooseLanguage(page, 'zh');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('step0-role-selection-zh.png', screenshotOptions);
  });

  test('home page (en)', async ({ page }) => {
    await goToHomePage(page, 'en');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('home-en.png', screenshotOptions);
  });

  test('home page (zh)', async ({ page }) => {
    await goToHomePage(page, 'zh');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('home-zh.png', screenshotOptions);
  });

  test('list page (en)', async ({ page }) => {
    await goToListPage(page, 'en');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('list-en.png', screenshotOptions);
  });

  test('list page (zh)', async ({ page }) => {
    await goToListPage(page, 'zh');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('list-zh.png', screenshotOptions);
  });

  test('detail page (en)', async ({ page }) => {
    await goToDetailPage(page, 'en');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('detail-en.png', screenshotOptions);
  });

  test('detail page (zh)', async ({ page }) => {
    await goToDetailPage(page, 'zh');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('detail-zh.png', screenshotOptions);
  });
});
