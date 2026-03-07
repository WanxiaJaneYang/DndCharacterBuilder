import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import uiTextJson from './uiText.json';

const uiText = uiTextJson;
const en = uiText.en;
const zh = uiText.zh;

const playerNamePattern = new RegExp(`${en.PLAYER_TITLE}|${zh.PLAYER_TITLE}`, 'i');
const dmNamePattern = new RegExp(`${en.DM_TITLE}|${zh.DM_TITLE}`, 'i');
const nextPattern = new RegExp(`${en.NEXT}|${zh.NEXT}`, 'i');
const reviewPattern = new RegExp(`${en.REVIEW}|${zh.REVIEW}`, 'i');
const unresolvedPattern = new RegExp(`${en.REVIEW_UNRESOLVED_LABEL}|${zh.REVIEW_UNRESOLVED_LABEL}`, 'i');
const startWizardPattern = new RegExp(`${en.START_WIZARD}|${zh.START_WIZARD}`, 'i');
const rulesSetupTitlePattern = new RegExp(`${en.RULES_SETUP_TITLE}|${zh.RULES_SETUP_TITLE}`, 'i');
const fighterLabelPattern = /^(?:Fighter(?: \(Level 1\))?|战士(?:（1级）)?)$/i;
const humanLabelPattern = /^(?:Human|人类)$/;
const elfLabelPattern = /^(?:Elf|精灵)$/;
const raceHeadingPattern = /^(?:Race|种族)$/;
const climbSkillPattern = /(?:Climb|攀爬)/i;
const jumpSkillPattern = /(?:Jump|跳跃)/i;
const diplomacySkillPattern = /(?:Diplomacy|交涉)/i;

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

async function reachSkillsStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: playerNamePattern }));
  await user.click(screen.getByRole('button', { name: startWizardPattern }));
  await user.click(screen.getByLabelText(humanLabelPattern));
  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByLabelText(fighterLabelPattern));
  await user.click(screen.getByRole('button', { name: nextPattern }));

  const strInput = screen.getByRole('spinbutton', { name: /STR|力量/i });
  await user.clear(strInput);
  await user.type(strInput, '14');

  const dexInput = screen.getByRole('spinbutton', { name: /DEX|敏捷/i });
  await user.clear(dexInput);
  await user.type(dexInput, '12');

  const intInput = screen.getByLabelText(/INT|智力/i, { selector: '#ability-input-int' });
  await user.clear(intInput);
  await user.type(intInput, '10');

  const chaInput = screen.getByRole('spinbutton', { name: /CHA|魅力/i });
  await user.clear(chaInput);
  await user.type(chaInput, '8');

  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByLabelText(/Power Attack|强力攻击/i));
  await user.click(screen.getByRole('button', { name: nextPattern }));
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
    await user.type(screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')), 'Aric');
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByRole('heading', { name: reviewPattern })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'AC' })).toBeTruthy();
    expect(screen.getByText(fighterLabelPattern, { selector: 'strong' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_ABILITY_BREAKDOWN })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_COMBAT_BREAKDOWN })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_SAVE_HP_BREAKDOWN })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_ATTACK_LINES })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_FEAT_SUMMARY })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_TRAIT_SUMMARY })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_EQUIPMENT_LOAD })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_MOVEMENT_DETAIL })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_AC_TOUCH_LABEL })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_AC_FLAT_FOOTED_LABEL })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_PACK_INFO })).toBeTruthy();
    expect(screen.getAllByRole('columnheader', { name: en.REVIEW_BASE_COLUMN }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.REVIEW_ADJUSTMENTS_COLUMN }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.REVIEW_FINAL_COLUMN }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.REVIEW_MISC_COLUMN }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader', { name: en.REVIEW_ACP_COLUMN }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chainmail/i).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(en.REVIEW_FINGERPRINT_LABEL, 'i'))).toBeTruthy();
    expect(document.body.textContent).toMatch(/[a-f0-9]{64}/);
  });

  it('renders review skill rows with a closed ability label parenthesis', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachSkillsStep(user);

    const climbRow = screen.getByRole('row', { name: climbSkillPattern });
    await user.click(within(climbRow).getByRole('button', { name: /Increase|鎻愰珮/i }));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(/Longsword|闀垮墤/i));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.type(screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')), 'Aric');
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByText(/\(\s*(?:STR|鍔涢噺)\s*\)/i)).toBeTruthy();
  });
  it('exports ComputeResult JSON from review', async () => {
    const user = userEvent.setup();
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => 'blob:test');
    const revokeObjectUrl = vi.fn();
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    await user.click(screen.getByLabelText(humanLabelPattern));
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
    await user.type(
      screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')),
      'Aric',
    );
    await user.click(screen.getByRole('button', { name: nextPattern }));

    await user.click(screen.getByRole('button', { name: /Export JSON|瀵煎嚭 JSON/i }));

    const exported = stringifySpy.mock.calls.at(-1)?.[0];

    expect(exported.schemaVersion).toBe('0.1');
    expect(exported.sheetViewModel).toBeTruthy();
    expect(exported.validationIssues).toEqual(expect.any(Array));
    expect(exported.unresolved).toEqual(expect.any(Array));
    expect(exported.assumptions).toEqual(expect.any(Array));

    clickSpy.mockRestore();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectUrl,
    });
    stringifySpy.mockRestore();
  });
});

describe('role and language behavior', () => {
  it('keeps user in role gate for DM and allows progression after switching to Player', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: dmNamePattern }));
    const dmMessage = screen.getByText(new RegExp(`${en.DM_UNSUPPORTED}|${zh.DM_UNSUPPORTED}`));
    expect(dmMessage.getAttribute('aria-live')).toBe('polite');

    expect(screen.queryByLabelText('STR')).toBeNull();

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    expect(screen.getByText(rulesSetupTitlePattern)).toBeTruthy();
  });

  it('defaults to zh when browser locale starts with zh and supports keyboard language switching', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      expect(screen.getByText(zh.ROLE_QUESTION)).toBeTruthy();

      const languageRadioGroup = screen.getByRole('radiogroup', { name: new RegExp(`${en.LANGUAGE_LABEL}|${zh.LANGUAGE_LABEL}`, 'i') });
      const englishRadio = within(languageRadioGroup).getByRole('radio', { name: en.ENGLISH });
      englishRadio.focus();
      await user.keyboard(' ');

      expect(screen.getByText(en.ROLE_QUESTION)).toBeTruthy();
    });
  });

  it('localizes data-driven flow and entity labels in zh', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: new RegExp(zh.PLAYER_TITLE) }));
      await user.click(screen.getByRole('button', { name: zh.START_WIZARD }));
      expect(screen.getByRole('heading', { name: raceHeadingPattern })).toBeTruthy();
      expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

      await user.click(screen.getByLabelText(humanLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.NEXT }));
      expect(screen.getByRole('heading', { name: /^(?:Class|职业)$/i })).toBeTruthy();
      expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();
    });
  });

  it('localizes ability score labels in zh', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: new RegExp(zh.PLAYER_TITLE) }));
      await user.click(screen.getByRole('button', { name: zh.START_WIZARD }));

      await user.click(screen.getByLabelText(humanLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.NEXT }));

      await user.click(screen.getByLabelText(fighterLabelPattern));
      await user.click(screen.getByRole('button', { name: zh.NEXT }));

      expect(screen.getByLabelText(zh.ABILITY_LABELS.STR)).toBeTruthy();
      expect(screen.getByLabelText(zh.ABILITY_LABELS.DEX)).toBeTruthy();
      expect(screen.getByLabelText(zh.ABILITY_LABELS.CON)).toBeTruthy();
      expect(screen.getByLabelText(zh.ABILITY_LABELS.INT)).toBeTruthy();
      expect(screen.getByLabelText(zh.ABILITY_LABELS.WIS)).toBeTruthy();
      expect(screen.getByLabelText(zh.ABILITY_LABELS.CHA)).toBeTruthy();
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

  it('shows a legal fighter skill allocation with remaining points and per-skill breakdowns', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachSkillsStep(user);

    expect(screen.getByText(/(?:Budget|总点数):\s*12/i)).toBeTruthy();
    expect(screen.getByText(/(?:Remaining|剩余):\s*12/i)).toBeTruthy();

    const climbRow = screen.getByRole('row', { name: climbSkillPattern });
    const jumpRow = screen.getByRole('row', { name: jumpSkillPattern });
    const diplomacyRow = screen.getByRole('row', { name: diplomacySkillPattern });

    await user.click(within(climbRow).getByRole('button', { name: /(?:Increase|提高) (?:Climb|攀爬)/i }));
    await user.click(within(climbRow).getByRole('button', { name: /(?:Increase|提高) (?:Climb|攀爬)/i }));
    await user.click(within(climbRow).getByRole('button', { name: /(?:Increase|提高) (?:Climb|攀爬)/i }));
    await user.click(within(climbRow).getByRole('button', { name: /(?:Increase|提高) (?:Climb|攀爬)/i }));
    await user.click(within(jumpRow).getByRole('button', { name: /(?:Increase|提高) (?:Jump|跳跃)/i }));
    await user.click(within(jumpRow).getByRole('button', { name: /(?:Increase|提高) (?:Jump|跳跃)/i }));
    await user.click(within(jumpRow).getByRole('button', { name: /(?:Increase|提高) (?:Jump|跳跃)/i }));
    await user.click(within(diplomacyRow).getByRole('button', { name: /(?:Increase|提高) (?:Diplomacy|交涉)/i }));

    expect(screen.getByText(/(?:Spent|已花费):\s*8/i)).toBeTruthy();
    expect(screen.getByText(/(?:Remaining|剩余):\s*4/i)).toBeTruthy();
    expect(within(climbRow).getByText(/^4$/)).toBeTruthy();
    expect(within(climbRow).getByText(/4 \+ 2 \+ 0 - 0 = 6/i)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/^0\.5$/)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/0\.5 \+ -1 \+ 0 - 0 = -0\.5/i)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/2\/(?:rank|级)/i)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/(?:max|上限) 2/i)).toBeTruthy();
    expect(within(climbRow).getByText(/(?:ACP applies|受护甲检定惩罚影响)/i)).toBeTruthy();
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

  it('shows unresolved placeholders on review when metadata selections are missing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));

    const nextButton = screen.getByRole('button', { name: nextPattern });
    for (let i = 0; i < 16; i += 1) {
      if ((nextButton as HTMLButtonElement).disabled) break;
      await user.click(nextButton);
    }

    expect(screen.getByRole('heading', { name: reviewPattern })).toBeTruthy();
    expect(screen.getAllByText(unresolvedPattern).length).toBeGreaterThanOrEqual(2);
  });

  it('supports back navigation from rules setup and from first wizard step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: playerNamePattern }));
    await user.click(screen.getByRole('button', { name: startWizardPattern }));
    expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: nextPattern }));
    expect(screen.getByLabelText(fighterLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.BACK}|${zh.BACK}`, 'i') }));
    expect(screen.getByLabelText(humanLabelPattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.BACK}|${zh.BACK}`, 'i') }));
    expect(screen.getByText(rulesSetupTitlePattern)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: new RegExp(`${en.BACK}|${zh.BACK}`, 'i') }));
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
      await user.type(screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')), '\u8D75\u4E91');
      await user.click(screen.getByRole('button', { name: nextPattern }));

      expect(screen.getAllByRole('heading', { name: zh.REVIEW_ABILITY_BREAKDOWN }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: zh.REVIEW_COMBAT_BREAKDOWN }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: zh.REVIEW_PACK_INFO }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: zh.REVIEW_BASE_COLUMN }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: zh.REVIEW_ADJUSTMENTS_COLUMN }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.REVIEW_FINGERPRINT_LABEL, { exact: false }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.STR).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.DEX).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.CON).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.INT).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.WIS).length).toBeGreaterThan(0);
      expect(screen.getAllByText(zh.ABILITY_LABELS.CHA).length).toBeGreaterThan(0);
    });
  });
});



