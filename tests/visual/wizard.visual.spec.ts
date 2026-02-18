import { expect, test, type Page } from '@playwright/test';

const playerTabName = /Player|玩家/i;
const nextButtonName = /Next|下一步/i;
const namePlaceholder = /Enter character name|输入角色姓名/i;

async function enterPlayerFlow(page: Page) {
  const playerButton = page.getByRole('button', { name: playerTabName });
  if (await playerButton.isVisible()) {
    await playerButton.click();
  }
}

async function goToListPage(page: Page) {
  await page.goto('/');
  await enterPlayerFlow(page);
  await page.getByPlaceholder(namePlaceholder).fill('Snapshot Hero');
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByRole('heading', { name: /Ability Scores|属性/i })).toBeVisible();
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByRole('heading', { name: /Race|种族/i })).toBeVisible();
}

async function goToDetailPage(page: Page) {
  await goToListPage(page);
  await page.getByLabel('Human').click();
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByRole('heading', { name: /Class|职业/i })).toBeVisible();
  await page.getByLabel('Fighter (Level 1)').click();
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByRole('heading', { name: /Feat|专长/i })).toBeVisible();
  await page.getByLabel('Weapon Focus (Longsword)').click();
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByText(/Equipment|装备/, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: nextButtonName }).click();
  await expect(page.getByRole('heading', { name: /Review|总览/i })).toBeVisible();
}

async function waitForVisualStability(page: Page) {
  await page.waitForLoadState('networkidle');
}

test.describe('wizard visual regression', () => {
  test('home page', async ({ page }) => {
    await page.goto('/');
    await enterPlayerFlow(page);
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('list page', async ({ page }) => {
    await goToListPage(page);
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('list.png', { fullPage: true });
  });

  test('detail page', async ({ page }) => {
    await goToDetailPage(page);
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('detail.png', { fullPage: true });
  });
});
