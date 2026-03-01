import { afterEach, describe, expect, it, vi } from 'vitest';
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
const humanLabelPattern = /^(?:Human|人类)$/;
const elfLabelPattern = /^(?:Elf|精灵)$/;
const raceHeadingPattern = /^(?:Race|种族)$/;

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
    expect(screen.getByRole('heading', { name: en.reviewSaveHpBreakdown })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewAttackLines })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewFeatSummary })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewTraitSummary })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewEquipmentLoad })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewMovementDetail })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewAcTouchLabel })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewAcFlatFootedLabel })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.reviewPackInfo })).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: en.reviewBaseColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewAdjustmentsColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewFinalColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewMiscColumn }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.reviewAcpColumn }).length).toBeGreaterThan(0);
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
      expect(screen.getByRole('heading', { name: raceHeadingPattern })).toBeTruthy();
      expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

      await user.click(screen.getByLabelText(humanLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.next }));
      expect(screen.getByRole('heading', { name: /^(?:Class|职业)$/i })).toBeTruthy();
      expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();
    });
  });

  it('localizes ability score labels in zh', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: new RegExp(zh.playerTitle) }));
      await user.click(screen.getByRole('button', { name: zh.startWizard }));

      await user.click(screen.getByLabelText(humanLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.next }));

      await user.click(screen.getByLabelText(fighterLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.next }));

      expect(screen.getByLabelText(zh.abilityLabels.str)).toBeTruthy();
      expect(screen.getByLabelText(zh.abilityLabels.dex)).toBeTruthy();
      expect(screen.getByLabelText(zh.abilityLabels.con)).toBeTruthy();
      expect(screen.getByLabelText(zh.abilityLabels.int)).toBeTruthy();
      expect(screen.getByLabelText(zh.abilityLabels.wis)).toBeTruthy();
      expect(screen.getByLabelText(zh.abilityLabels.cha)).toBeTruthy();
    });
  });

  it('renders ability mode selector and point-buy cap controls from flow config', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByRole('combobox', { name: /Ability Generation|生成方式/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Point Buy|点购/i })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: /Point Cap|点数上限/i })).toBeTruthy();
    expect(screen.getByText(/Points Remaining|剩余点数/i)).toBeTruthy();
  });

  it('starts point-buy abilities at the zero-cost score from config', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect((screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement).value).toBe('8');
    expect((screen.getByRole('spinbutton', { name: /DEX|敏捷/i }) as HTMLInputElement).value).toBe('8');
    expect((screen.getByRole('spinbutton', { name: /CON|体质/i }) as HTMLInputElement).value).toBe('8');
    expect(screen.getByText(/Points Remaining:\s*32|剩余点数:\s*32/i)).toBeTruthy();
  });

  it('keeps the point-buy table collapsed by default and toggles it with a custom button', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    const toggle = screen.getByRole('button', { name: /Show Point Buy Table|展开点购表/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('table', { name: /Point Buy Cost Table|点购花费表/i })).toBeNull();

    await user.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const pointBuyTable = screen.getByRole('table', { name: /Point Buy Cost Table|点购花费表/i });
    expect(pointBuyTable).toBeTruthy();
    expect(within(pointBuyTable).getByRole('cell', { name: '0' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Hide Point Buy Table|收起点购表/i }));

    expect(screen.queryByRole('table', { name: /Point Buy Cost Table|点购花费表/i })).toBeNull();
  });

  it('shows dynamic ability method hint and supports hover, focus, click, and escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    const methodSelect = screen.getByRole('combobox', { name: /Ability Generation|生成方式/i });
    const helpButton = screen.getByRole('button', { name: /About ability generation methods|生成方式说明/i });
    const pointBuyHint = /Spend points from a configurable budget|在可配置点数上限内分配六项属性值/i;
    const rollSetsHint = /Roll multiple sets and pick one before assignment|掷出多组属性值，先选择一组再分配/i;

    expect(helpButton.getAttribute('aria-expanded')).toBe('false');
    expect(helpButton.getAttribute('aria-controls')).toBeNull();
    expect(helpButton.getAttribute('aria-describedby')).toBeNull();

    await user.hover(helpButton);
    expect(screen.getByText(pointBuyHint)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.unhover(helpButton);
    expect(screen.queryByText(pointBuyHint)).toBeNull();
    expect(helpButton.getAttribute('aria-expanded')).toBe('false');
    expect(helpButton.getAttribute('aria-controls')).toBeNull();
    expect(helpButton.getAttribute('aria-describedby')).toBeNull();

    for (let i = 0; i < 20 && document.activeElement !== helpButton; i += 1) {
      await user.tab();
    }
    expect(document.activeElement).toBe(helpButton);
    expect(screen.getByText(pointBuyHint)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.selectOptions(methodSelect, 'rollSets');

    await user.click(helpButton);
    expect(screen.getByText(rollSetsHint)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.keyboard('{Escape}');
    expect(screen.queryByText(rollSetsHint)).toBeNull();
    expect(helpButton.getAttribute('aria-expanded')).toBe('false');
    expect(helpButton.getAttribute('aria-controls')).toBeNull();
    expect(helpButton.getAttribute('aria-describedby')).toBeNull();
  });

  it('shows existing ability modifiers on the ability step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(elfLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getAllByText(/Existing Modifiers|现有调整/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+2/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-2/).length).toBeGreaterThan(0);
  });

  it('supports plus and minus score steppers for ability inputs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    const strInput = screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement;
    const before = Number(strInput.value);

    await user.click(screen.getByRole('button', { name: /Increase STR|提高 力量/i }));
    expect(Number((screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement).value)).toBe(before + 1);

    await user.click(screen.getByRole('button', { name: /Decrease STR|降低 力量/i }));
    expect(Number((screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement).value)).toBe(before);
  });

  it('supports roll-sets mode by generating 5 sets and applying the selected set', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Ability Generation|生成方式/i }),
      'rollSets'
    );
    expect(screen.getAllByRole('radio', { name: /^(?:Set\s*\d+|第\s*\d+\s*组)/i }).length).toBe(5);

    await user.click(screen.getByRole('radio', { name: /^(?:Set\s*1|第\s*1\s*组)/i }));
    expect((screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement).value).toBe('3');
    expect((screen.getByRole('spinbutton', { name: /DEX|敏捷/i }) as HTMLInputElement).value).toBe('3');

    randomSpy.mockRestore();
  });

  it('disables ability score editing in roll-sets mode until a set is selected', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Ability Generation|生成方式/i }),
      'rollSets'
    );

    expect((screen.getByRole('spinbutton', { name: /STR|力量/i }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Increase STR|提高 力量/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Decrease STR|降低 力量/i }) as HTMLButtonElement).disabled).toBe(true);

    randomSpy.mockRestore();
  });

  it('shows modifier source attribution groups and hides non-impacting source types', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(elfLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(fighterLabelPattern));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getAllByText(elfLabelPattern).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Race/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Fighter|战士/i)).toBeNull();
  });

  it('supports back navigation from rules setup and from first wizard step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: nextPattern }));
    expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.back}|${zh.back}`, 'i') }));
    expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

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
      await user.click(screen.getByLabelText(humanLabelPattern));
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
      await user.click(screen.getByLabelText(/Chainmail|\u94FE\u7532/));
      await user.click(screen.getByRole('button', { name: nextPattern }));
      await user.type(screen.getByLabelText(new RegExp(`${en.nameLabel}|${zh.nameLabel}`, 'i')), '\u8D75\u4E91');
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



