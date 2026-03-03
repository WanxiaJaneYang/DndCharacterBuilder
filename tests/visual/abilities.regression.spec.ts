import { expect, test, type Page } from '@playwright/test';

const labels = {
  player: /Player|玩家/i,
  next: /Next|下一步/i,
  startWizard: /Start Wizard|开始创建/i,
  raceHeading: /Race|种族/i,
  classHeading: /Class|职业/i,
  abilityHeading: /Ability Scores|属性/i,
  human: /Human|人类/i,
  fighter: /^(?:Fighter(?: \(Level 1\))?|战士(?:（1级）)?)$/i,
  abilityGeneration: /Ability Generation|生成方式/i,
  pointCap: /Point Cap|点数上限/i,
  pointsRemaining: /Points Remaining|剩余点数/i,
  showPointBuyTable: /Show Point Buy Table|展开点购表/i,
  pointBuyTable: /Point Buy Cost Table|点购花费表/i,
  str: /STR|力量/i,
  increaseStr: /Increase STR|提高 力量/i,
  decreaseStr: /Decrease STR|降低 力量/i,
  set1: /^(?:Set\s*1|第\s*1\s*组)$/i,
};

async function goToAbilitiesStep(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: labels.player }).click();
  await page.getByRole('button', { name: labels.startWizard }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.raceHeading })).toBeVisible();
  await page.getByLabel(labels.human).click();
  await page.getByRole('button', { name: labels.next }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.classHeading })).toBeVisible();
  await page.getByLabel(labels.fighter).click();
  await page.getByRole('button', { name: labels.next }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.abilityHeading })).toBeVisible();
}

test.describe('abilities step e2e regression', () => {
  test('point-buy defaults and STR stepping update remaining points correctly', async ({ page }) => {
    await goToAbilitiesStep(page);

    await expect(page.getByRole('combobox', { name: labels.abilityGeneration })).toHaveValue('pointBuy');
    await expect(page.getByRole('spinbutton', { name: labels.pointCap })).toHaveValue('32');
    await expect(page.getByText(/(?:Points Remaining|剩余点数):\s*32/i)).toBeVisible();

    const strInput = page.getByRole('spinbutton', { name: labels.str });
    await expect(strInput).toHaveValue('8');

    await page.getByRole('button', { name: labels.increaseStr }).click();
    await expect(strInput).toHaveValue('9');
    await expect(page.getByText(/(?:Points Remaining|剩余点数):\s*31/i)).toBeVisible();

    await page.getByRole('button', { name: labels.increaseStr }).click();
    await expect(strInput).toHaveValue('10');
    await expect(page.getByText(/(?:Points Remaining|剩余点数):\s*30/i)).toBeVisible();

    await page.getByRole('button', { name: labels.decreaseStr }).click();
    await expect(strInput).toHaveValue('9');
    await expect(page.getByText(/(?:Points Remaining|剩余点数):\s*31/i)).toBeVisible();
  });

  test('point-buy table is collapsed by default and toggles open', async ({ page }) => {
    await goToAbilitiesStep(page);

    await expect(page.getByRole('table', { name: labels.pointBuyTable })).toHaveCount(0);

    const toggle = page.getByRole('button', { name: labels.showPointBuyTable });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('table', { name: labels.pointBuyTable })).toBeVisible();
  });

  test('roll-sets mode disables ability input before set selection and enables after selection', async ({ page }) => {
    await goToAbilitiesStep(page);

    const generationSelect = page.getByRole('combobox', { name: labels.abilityGeneration });
    await generationSelect.selectOption('rollSets');

    const strInput = page.getByRole('spinbutton', { name: labels.str });
    await expect(strInput).toBeDisabled();

    await page.getByRole('radio', { name: labels.set1 }).click();

    await expect(strInput).toBeEnabled();
    await expect(strInput).not.toHaveValue('8');
  });
});
