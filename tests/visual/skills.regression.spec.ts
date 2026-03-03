import { expect, test, type Page } from '@playwright/test';

const labels = {
  player: /Player|玩家/i,
  next: /Next|下一步/i,
  startWizard: /Start Wizard|开始创建/i,
  raceHeading: /Race|种族/i,
  classHeading: /Class|职业/i,
  abilityHeading: /Ability Scores|属性/i,
  featHeading: /Feat|专长/i,
  skillsHeading: /Skills|技能/i,
  human: /Human|人类/i,
  fighter: /^(?:Fighter(?: \(Level 1\))?|战士(?:（1级）)?)$/i,
  powerAttack: /Power Attack|强力攻击/i,
  climb: /Climb|攀爬/i,
  diplomacy: /Diplomacy|交涉/i,
  increaseClimb: /Increase Climb|提高 攀爬/i,
  increaseDiplomacy: /Increase Diplomacy|提高 交涉/i,
};

async function goToSkillsStep(page: Page) {
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
  await page.getByRole('button', { name: labels.next }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.featHeading })).toBeVisible();
  await page.getByLabel(labels.powerAttack).click();
  await page.getByRole('button', { name: labels.next }).click({ force: true });

  await expect(page.getByRole('heading', { name: labels.skillsHeading })).toBeVisible();
}

async function getRemainingSkillPoints(page: Page) {
  const summary = page.locator('.skill-points-summary');
  await expect(summary).toBeVisible();
  const text = (await summary.textContent()) ?? '';
  const match = text.match(/(?:Remaining|剩余):\s*(\d+(?:\.\d+)?)/i);
  expect(match, `Could not parse remaining points from: ${text}`).not.toBeNull();
  return Number(match?.[1]);
}

test.describe('skills step e2e regression', () => {
  test('skill point investment UI updates ranks and remaining points', async ({ page }) => {
    await goToSkillsStep(page);

    const climbRanks = page.getByLabel(/Climb\s+ranks|攀爬\s+ranks/i);
    await expect(climbRanks).toHaveText('0');

    const before = await getRemainingSkillPoints(page);
    await page.getByRole('button', { name: labels.increaseClimb }).click();

    await expect(climbRanks).toHaveText('1');
    await expect.poll(() => getRemainingSkillPoints(page)).toBe(before - 1);
  });

  test('class and cross-class skills spend points with expected rank increments', async ({ page }) => {
    await goToSkillsStep(page);

    const climbRow = page.getByRole('row', { name: labels.climb });
    const diplomacyRow = page.getByRole('row', { name: labels.diplomacy });

    await expect(climbRow).toContainText(/Class|本职/i);
    await expect(diplomacyRow).toContainText(/Cross|跨职/i);

    const climbRanks = page.getByLabel(/Climb\s+ranks|攀爬\s+ranks/i);
    const diplomacyRanks = page.getByLabel(/Diplomacy\s+ranks|交涉\s+ranks/i);

    const before = await getRemainingSkillPoints(page);

    await page.getByRole('button', { name: labels.increaseClimb }).click();
    await expect(climbRanks).toHaveText('1');
    await expect.poll(() => getRemainingSkillPoints(page)).toBe(before - 1);

    await page.getByRole('button', { name: labels.increaseDiplomacy }).click();
    await expect(diplomacyRanks).toHaveText('0.5');
    await expect.poll(() => getRemainingSkillPoints(page)).toBe(before - 2);
  });
});
