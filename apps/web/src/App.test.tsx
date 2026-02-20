import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import uiTextJson from './uiText.json';

const uiText = uiTextJson;
const en = uiText.en;
const zh = uiText.zh;

const playerNamePattern = new RegExp(`${en.playerTitle}|${zh.playerTitle}`, 'i');
const dmNamePattern = new RegExp(`${en.dmTitle}|${zh.dmTitle}`, 'i');
const nextPattern = new RegExp(`${en.next}|${zh.next}`, 'i');
const reviewPattern = new RegExp(`${en.review}|${zh.review}`, 'i');
const startWizardPattern = new RegExp(`${en.startWizard}|${zh.startWizard}`, 'i');
const rulesSetupTitlePattern = new RegExp(`${en.rulesSetupTitle}|${zh.rulesSetupTitle}`, 'i');
const fighterLabelPattern = /^(?:Fighter(?: \(Level 1\))?|战士(?:（1级）)?)$/i;

afterEach(() => {
  cleanup();
});

function withNavigatorLanguage(language: string, fn: () => Promise<void>) {
  const descriptor = Object.getOwnPropertyDescriptor(window.navigator, 'language');
  Object.defineProperty(window.navigator, 'language', { configurable: true, value: language });
  return fn().finally(() => {
    if (descriptor) {
      Object.defineProperty(window.navigator, 'language', descriptor);
    }
  });
}

describe('wizard e2e-ish happy path', () => {
  it('lets user complete flow and see final stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    expect(screen.getByText(rulesSetupTitlePattern)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText('Human'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    const strInput = screen.getByLabelText('STR');
    await user.clear(strInput);
    await user.type(strInput, '16');
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Power Attack'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Chainmail'));
    await user.click(screen.getByLabelText('Heavy Wooden Shield'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.type(screen.getByLabelText(new RegExp(`${en.nameLabel}|${zh.nameLabel}`, 'i')), 'Aric');
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByRole('heading', { name: reviewPattern })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'AC' })).toBeTruthy();
    expect(screen.getByText(fighterLabelPattern, { selector: 'strong' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewAbilityBreakdown })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewCombatBreakdown })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewPackInfo })).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: en.reviewBaseColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewAdjustmentsColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewFinalColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chainmail/i).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(en.reviewFingerprintLabel, 'i'))).toBeTruthy();
    expect(document.body.textContent).toMatch(/[a-f0-9]{64}/);
  });
});

describe('role and language behavior', () => {
  it('keeps user in role gate for DM and allows progression after switching to Player', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: dmNamePattern }));
    const dmMessage = screen.getByText(new RegExp(`${en.dmUnsupported}|${zh.dmUnsupported}`));
    expect(dmMessage.getAttribute('aria-live')).toBe('polite');

    expect(screen.queryByLabelText('STR')).toBeNull();

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    expect(screen.getByText(rulesSetupTitlePattern)).toBeTruthy();
  });

  it('defaults to zh when browser locale starts with zh and supports keyboard language switching', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      expect(screen.getByText(zh.roleQuestion)).toBeTruthy();

      const languageRadioGroup = screen.getByRole('radiogroup', { name: new RegExp(`${en.languageLabel}|${zh.languageLabel}`, 'i') });
      const englishRadio = within(languageRadioGroup).getByRole('radio', { name: en.english });
      englishRadio.focus();
      await user.keyboard(' ');

      expect(screen.getByText(en.roleQuestion)).toBeTruthy();
    });
  });

  it('localizes data-driven flow and entity labels in zh', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: new RegExp(zh.playerTitle) }));
      await user.click(screen.getByRole('button', { name: zh.startWizard }));
      expect(screen.getByRole('heading', { name: '种族' })).toBeTruthy();
      expect(screen.getByLabelText('人类')).toBeTruthy();

      await user.click(screen.getByLabelText('人类'));
      await user.click(screen.getByRole('button', { name: zh.next }));
      expect(screen.getByRole('heading', { name: '职业' })).toBeTruthy();
      expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();
    });
  });

  it('localizes ability score labels in zh', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: new RegExp(zh.playerTitle) }));
      await user.click(screen.getByRole('button', { name: zh.startWizard }));

      await user.click(screen.getByLabelText('人类'));
      await user.click(screen.getByRole('button', { name: zh.next }));

      await user.click(screen.getByLabelText(fighterLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.next }));

      expect(screen.getByLabelText('力量')).toBeTruthy();
      expect(screen.getByLabelText('敏捷')).toBeTruthy();
      expect(screen.getByLabelText('体质')).toBeTruthy();
      expect(screen.getByLabelText('智力')).toBeTruthy();
      expect(screen.getByLabelText('感知')).toBeTruthy();
      expect(screen.getByLabelText('魅力')).toBeTruthy();
    });
  });

  it('supports back navigation from rules setup and from first wizard step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    expect(screen.getByLabelText(/Human|人类/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: nextPattern }));
    expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.back}|${zh.back}`, 'i') }));
    expect(screen.getByLabelText(/Human|人类/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.back}|${zh.back}`, 'i') }));
    expect(screen.getByText(rulesSetupTitlePattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.back}|${zh.back}`, 'i') }));
    expect(screen.getByRole('button', { name: playerNamePattern })).toBeTruthy();
  });

  it('renders localized review labels in zh flow', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: playerNamePattern }));
      await user.click(screen.getByRole('button', { name: startWizardPattern }));
      await user.click(screen.getByLabelText(/Human|人类/));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.click(screen.getByLabelText(fighterLabelPattern));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      const featFieldset = screen.getByRole('group', { name: /Feat|专长/i });
      const featChoices = within(featFieldset).getAllByRole('checkbox');
      expect(featChoices.length).toBeGreaterThan(0);
      await user.click(featChoices[0]!);
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.click(screen.getByLabelText(/Chainmail|链甲/));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.type(screen.getByLabelText(new RegExp(`${en.nameLabel}|${zh.nameLabel}`, 'i')), '赵云');
      await user.click(screen.getByRole('button', { name: nextPattern }));

      expect(screen.getAllByRole('heading', { name: zh.reviewAbilityBreakdown }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: zh.reviewCombatBreakdown }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: zh.reviewPackInfo }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: zh.reviewBaseColumn }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: zh.reviewAdjustmentsColumn }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.reviewFingerprintLabel, { exact: false }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.str).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.dex).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.con).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.int).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.wis).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.abilityLabels.cha).length).toBeGreaterThan(0);
    });
  });
});
