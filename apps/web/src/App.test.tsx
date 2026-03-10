import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import uiTextJson from './uiText.json';

const uiText = uiTextJson;
const en = uiText.en;
const zh = uiText.zh;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localizedPattern(enLabel: string, zhLabel: string, flags = 'i') {
  return new RegExp(`${escapeRegExp(enLabel)}|${escapeRegExp(zhLabel)}`, flags);
}

function localizedExactPattern(enLabel: string, zhLabel: string, flags = 'i') {
  return new RegExp(`^(?:${escapeRegExp(enLabel)}|${escapeRegExp(zhLabel)})$`, flags);
}

function skillRanksPattern(enSkillName: string, zhSkillName: string) {
  return new RegExp(
    `${escapeRegExp(enSkillName)}\\s+ranks|${escapeRegExp(zhSkillName)}\\s+ranks`,
    'i',
  );
}

const playerNamePattern = new RegExp(`${en.PLAYER_TITLE}|${zh.PLAYER_TITLE}`, 'i');
const dmNamePattern = new RegExp(`${en.DM_TITLE}|${zh.DM_TITLE}`, 'i');
const nextPattern = new RegExp(`${en.NEXT}|${zh.NEXT}`, 'i');
const reviewPattern = new RegExp(`${en.REVIEW}|${zh.REVIEW}`, 'i');
const unresolvedPattern = new RegExp(`${en.REVIEW_UNRESOLVED_LABEL}|${zh.REVIEW_UNRESOLVED_LABEL}`, 'i');
const startWizardPattern = new RegExp(`${en.START_WIZARD}|${zh.START_WIZARD}`, 'i');
const rulesSetupTitlePattern = new RegExp(`${en.RULES_SETUP_TITLE}|${zh.RULES_SETUP_TITLE}`, 'i');
const fighterLabelPattern = /^(?:Fighter(?: \(Level 1\))?|\u6218\u58eb(?:\uff081\u7ea7\uff09)?)$/i;
const humanLabelPattern = /^(?:Human|\u4eba\u7c7b)$/;
const elfLabelPattern = /^(?:Elf|\u7cbe\u7075)$/;
const raceHeadingPattern = /^(?:Race|\u79cd\u65cf)$/;
const climbSkillPattern = /(?:Climb|\u6500\u722c)/i;
const jumpSkillPattern = /(?:Jump|\u8df3\u8dc3)/i;
const diplomacySkillPattern = /(?:Diplomacy|\u4ea4\u6d89)/i;
const listenSkillPattern = /(?:Listen|\u4fa6\u542c)/i;
const abilityGenerationPattern = localizedPattern(
  en.ABILITY_GENERATION_LABEL,
  zh.ABILITY_GENERATION_LABEL,
);
const pointBuyPattern = localizedExactPattern(
  en.ABILITY_MODE_POINT_BUY,
  zh.ABILITY_MODE_POINT_BUY,
);
const pointCapPattern = localizedPattern(en.POINT_CAP_LABEL, zh.POINT_CAP_LABEL);
const pointsRemainingPattern = localizedPattern(
  en.POINT_BUY_REMAINING_LABEL,
  zh.POINT_BUY_REMAINING_LABEL,
);
const showPointBuyTablePattern = localizedPattern(
  en.POINT_BUY_SHOW_TABLE_LABEL,
  zh.POINT_BUY_SHOW_TABLE_LABEL,
);
const hidePointBuyTablePattern = localizedPattern(
  en.POINT_BUY_HIDE_TABLE_LABEL,
  zh.POINT_BUY_HIDE_TABLE_LABEL,
);
const pointBuyTableCaptionPattern = localizedPattern(
  en.POINT_BUY_TABLE_CAPTION,
  zh.POINT_BUY_TABLE_CAPTION,
);
const aboutAbilityGenerationPattern = localizedPattern(
  en.ABILITY_METHOD_HELP_LABEL,
  zh.ABILITY_METHOD_HELP_LABEL,
);
const pointBuyHintPattern = localizedPattern(
  en.ABILITY_METHOD_HINT_POINT_BUY,
  zh.ABILITY_METHOD_HINT_POINT_BUY,
);
const rollSetsHintPattern = localizedPattern(
  en.ABILITY_METHOD_HINT_ROLL_SETS,
  zh.ABILITY_METHOD_HINT_ROLL_SETS,
);
const existingModifiersPattern = localizedPattern(
  en.ABILITY_EXISTING_MODIFIERS_LABEL,
  zh.ABILITY_EXISTING_MODIFIERS_LABEL,
);
const strInputPattern = localizedExactPattern(en.ABILITY_LABELS.STR, zh.ABILITY_LABELS.STR);
const dexInputPattern = localizedExactPattern(en.ABILITY_LABELS.DEX, zh.ABILITY_LABELS.DEX);
const conInputPattern = localizedExactPattern(en.ABILITY_LABELS.CON, zh.ABILITY_LABELS.CON);
const intInputPattern = localizedExactPattern(en.ABILITY_LABELS.INT, zh.ABILITY_LABELS.INT);
const chaInputPattern = localizedExactPattern(en.ABILITY_LABELS.CHA, zh.ABILITY_LABELS.CHA);
const climbRanksPattern = skillRanksPattern('Climb', '\u6500\u722c');
const diplomacyRanksPattern = skillRanksPattern('Diplomacy', '\u4ea4\u6d89');
const increaseStrPattern = localizedPattern(
  `${en.INCREASE_LABEL} ${en.ABILITY_LABELS.STR}`,
  `${zh.INCREASE_LABEL} ${zh.ABILITY_LABELS.STR}`,
);
const decreaseStrPattern = localizedPattern(
  `${en.DECREASE_LABEL} ${en.ABILITY_LABELS.STR}`,
  `${zh.DECREASE_LABEL} ${zh.ABILITY_LABELS.STR}`,
);
const rollSetOptionsPattern = localizedPattern(
  en.ROLL_SET_OPTIONS_ARIA_LABEL,
  zh.ROLL_SET_OPTIONS_ARIA_LABEL,
);

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

  const strInput = screen.getByRole('spinbutton', { name: strInputPattern });
  await user.clear(strInput);
  await user.type(strInput, '14');

  const dexInput = screen.getByRole('spinbutton', { name: dexInputPattern });
  await user.clear(dexInput);
  await user.type(dexInput, '12');

  const intInput = screen.getByLabelText(intInputPattern, { selector: '#ability-input-int' });
  await user.clear(intInput);
  await user.type(intInput, '10');

  const chaInput = screen.getByRole('spinbutton', { name: chaInputPattern });
  await user.clear(chaInput);
  await user.type(chaInput, '8');

  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByLabelText(/Power Attack|\u5f3a\u529b\u653b\u51fb/i));
  await user.click(screen.getByRole('button', { name: nextPattern }));
}

async function reachReviewStep(
  user: ReturnType<typeof userEvent.setup>,
  options?: {
    raceLabel?: RegExp;
    characterName?: string;
    equipmentLabels?: string[];
  },
) {
  await user.click(screen.getByRole('button', { name: playerNamePattern }));
  await user.click(screen.getByRole('button', { name: startWizardPattern }));
  await user.click(screen.getByLabelText(options?.raceLabel ?? humanLabelPattern));
  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByLabelText(fighterLabelPattern));
  await user.click(screen.getByRole('button', { name: nextPattern }));

  const strInput = screen.getByLabelText('STR');
  await user.clear(strInput);
  await user.type(strInput, '16');
  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByLabelText(/Power Attack|\u5f3a\u529b\u653b\u51fb/i));
  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.click(screen.getByRole('button', { name: nextPattern }));

  for (const equipmentLabel of options?.equipmentLabels ?? []) {
    await user.click(screen.getByLabelText(new RegExp(equipmentLabel, 'i')));
  }

  await user.click(screen.getByRole('button', { name: nextPattern }));
  await user.type(
    screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')),
    options?.characterName ?? 'Aric',
  );
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
    const combatArticle = screen
      .getByRole('heading', {
        name: localizedPattern(en.REVIEW_COMBAT_BREAKDOWN, zh.REVIEW_COMBAT_BREAKDOWN),
      })
      .closest('article');
    expect(combatArticle).toBeTruthy();
    expect(
      within(combatArticle!).getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_BAB_LABEL)}|${escapeRegExp(zh.REVIEW_BAB_LABEL)}`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_SAVE_HP_BREAKDOWN })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_ATTACK_LINES })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_FEAT_SUMMARY })).toBeTruthy();
    expect(screen.getByRole('heading', { name: en.REVIEW_TRAIT_SUMMARY })).toBeTruthy();
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
    expect(
      screen.getByRole('heading', {
        name: localizedPattern(en.REVIEW_EQUIPMENT_LOAD, zh.REVIEW_EQUIPMENT_LOAD),
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: localizedPattern(en.REVIEW_MOVEMENT_DETAIL, zh.REVIEW_MOVEMENT_DETAIL),
      }),
    ).toBeTruthy();
    const movementArticle = screen
      .getByRole('heading', {
        name: localizedPattern(en.REVIEW_MOVEMENT_DETAIL, zh.REVIEW_MOVEMENT_DETAIL),
      })
      .closest('article');
    expect(movementArticle).toBeTruthy();
    expect(
      within(movementArticle!).queryByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_BAB_LABEL)}:|${escapeRegExp(zh.REVIEW_BAB_LABEL)}:`,
          'i',
        ),
      ),
    ).toBeNull();
    expect(
      screen.getByRole('heading', {
        name: localizedPattern(en.REVIEW_RULES_DECISIONS, zh.REVIEW_RULES_DECISIONS),
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_LEVEL_LABEL)}:\\s*1|${escapeRegExp(zh.REVIEW_LEVEL_LABEL)}:\\s*1`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_XP_LABEL)}:\\s*0|${escapeRegExp(zh.REVIEW_XP_LABEL)}:\\s*0`,
          'i',
        ),
      ),
    ).toBeTruthy();
  });

  it('renders review skill rows with a closed ability label parenthesis', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachSkillsStep(user);

    const climbRow = screen.getByRole('row', { name: climbSkillPattern });
    await user.click(within(climbRow).getByRole('button', { name: /(?:Increase|\u63d0\u9ad8) (?:Climb|\u6500\u722c)/i }));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText(/(?:Longsword|\u957f\u5251)/i));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.type(screen.getByLabelText(new RegExp(`${en.NAME_LABEL}|${zh.NAME_LABEL}`, 'i')), 'Aric');
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByText(/\(\s*(?:STR|\u529b\u91cf)\s*\)/i)).toBeTruthy();
  });

  it('keeps racial-bonus-only skills visible on the review sheet', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachReviewStep(user, { raceLabel: elfLabelPattern, characterName: 'Elaith' });

    const listenRow = screen.getByRole('row', { name: listenSkillPattern });
    expect(within(listenRow).getByText(/Racial\s+\+2/i)).toBeTruthy();
  });

  it('preserves size and speed details in the identity and progression card', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachReviewStep(user, {
      characterName: 'Aric',
      equipmentLabels: ['Chainmail', 'Heavy Wooden Shield'],
    });

    const identityCard = screen
      .getByRole('heading', {
        name: localizedPattern(en.REVIEW_IDENTITY_PROGRESSION, zh.REVIEW_IDENTITY_PROGRESSION),
      })
      .closest('article');
    expect(identityCard).toBeTruthy();
    expect(
      within(identityCard!).getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_SIZE_LABEL)}:\\s*medium|${escapeRegExp(zh.REVIEW_SIZE_LABEL)}:\\s*medium`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(
      within(identityCard!).getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_SPEED_BASE_LABEL)}:\\s*30|${escapeRegExp(zh.REVIEW_SPEED_BASE_LABEL)}:\\s*30`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(
      within(identityCard!).getByText(
        new RegExp(
          `${escapeRegExp(en.REVIEW_SPEED_ADJUSTED_LABEL)}:\\s*20|${escapeRegExp(zh.REVIEW_SPEED_ADJUSTED_LABEL)}:\\s*20`,
          'i',
        ),
      ),
    ).toBeTruthy();
  });

  it('renders skills-step metadata for legal allocation controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachSkillsStep(user);

    const climbRow = screen.getByRole('row', { name: climbSkillPattern });
    expect(
      screen.getByText(
        new RegExp(
          `${escapeRegExp(en.SKILLS_BUDGET_LABEL)}:\\s*12|${escapeRegExp(zh.SKILLS_BUDGET_LABEL)}:\\s*12`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${escapeRegExp(en.SKILLS_SPENT_LABEL)}:\\s*0|${escapeRegExp(zh.SKILLS_SPENT_LABEL)}:\\s*0`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(
          `${escapeRegExp(en.SKILLS_REMAINING_LABEL)}:\\s*12|${escapeRegExp(zh.SKILLS_REMAINING_LABEL)}:\\s*12`,
          'i',
        ),
      ),
    ).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: en.SKILLS_TYPE_COLUMN })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: en.SKILLS_POINTS_COLUMN })).toBeTruthy();
    expect(within(climbRow).getByText(new RegExp(en.SKILLS_CLASS_LABEL, 'i'))).toBeTruthy();
    expect(within(climbRow).getByText(/1\/rank/i)).toBeTruthy();
    expect(within(climbRow).getByText(/Max\s+4/i)).toBeTruthy();
    expect(within(climbRow).getByText(/Racial\s+\+0/i)).toBeTruthy();
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
    try {
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

      await user.click(screen.getByRole('button', { name: /Export JSON|\u5bfc\u51fa JSON/i }));

      const exported = stringifySpy.mock.calls.at(-1)?.[0];

      expect(exported.schemaVersion).toBe('0.1');
      expect(exported.sheetViewModel).toBeTruthy();
      expect(exported.validationIssues).toEqual(expect.any(Array));
      expect(exported.unresolved).toEqual(expect.any(Array));
      expect(exported.assumptions).toEqual(expect.any(Array));
    } finally {
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
    }
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
      expect(screen.getByRole('heading', { name: /^(?:Class|\u804c\u4e1a)$/i })).toBeTruthy();
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

    expect(screen.getByRole('combobox', { name: abilityGenerationPattern })).toBeTruthy();
    expect(screen.getByRole('option', { name: pointBuyPattern })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: pointCapPattern })).toBeTruthy();
    expect(screen.getByText(pointsRemainingPattern)).toBeTruthy();
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

    expect((screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement).value).toBe('8');
    expect((screen.getByRole('spinbutton', { name: dexInputPattern }) as HTMLInputElement).value).toBe('8');
    expect((screen.getByRole('spinbutton', { name: conInputPattern }) as HTMLInputElement).value).toBe('8');
    expect(
      screen.getByText(new RegExp(`${escapeRegExp(en.POINT_BUY_REMAINING_LABEL)}:\\s*32|${escapeRegExp(zh.POINT_BUY_REMAINING_LABEL)}:\\s*32`, 'i')),
    ).toBeTruthy();
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

    const toggle = screen.getByRole('button', { name: showPointBuyTablePattern });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('table', { name: pointBuyTableCaptionPattern })).toBeNull();

    await user.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const pointBuyTable = screen.getByRole('table', { name: pointBuyTableCaptionPattern });
    expect(pointBuyTable).toBeTruthy();
    expect(within(pointBuyTable).getByRole('cell', { name: '0' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: hidePointBuyTablePattern }));

    expect(screen.queryByRole('table', { name: pointBuyTableCaptionPattern })).toBeNull();
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

    const methodSelect = screen.getByRole('combobox', { name: abilityGenerationPattern });
    const helpButton = screen.getByRole('button', { name: aboutAbilityGenerationPattern });

    expect(helpButton.getAttribute('aria-expanded')).toBe('false');
    expect(helpButton.getAttribute('aria-controls')).toBeNull();
    expect(helpButton.getAttribute('aria-describedby')).toBeNull();

    await user.hover(helpButton);
    expect(screen.getByText(pointBuyHintPattern)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.unhover(helpButton);
    expect(screen.queryByText(pointBuyHintPattern)).toBeNull();
    expect(helpButton.getAttribute('aria-expanded')).toBe('false');
    expect(helpButton.getAttribute('aria-controls')).toBeNull();
    expect(helpButton.getAttribute('aria-describedby')).toBeNull();

    for (let i = 0; i < 20 && document.activeElement !== helpButton; i += 1) {
      await user.tab();
    }
    expect(document.activeElement).toBe(helpButton);
    expect(screen.getByText(pointBuyHintPattern)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.selectOptions(methodSelect, 'rollSets');

    await user.click(helpButton);
    expect(screen.getByText(rollSetsHintPattern)).toBeTruthy();
    expect(helpButton.getAttribute('aria-expanded')).toBe('true');
    expect(helpButton.getAttribute('aria-controls')).toBe('ability-method-help-panel');
    expect(helpButton.getAttribute('aria-describedby')).toBe('ability-method-help-panel');

    await user.keyboard('{Escape}');
    expect(screen.queryByText(rollSetsHintPattern)).toBeNull();
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

    expect(screen.getAllByText(existingModifiersPattern).length).toBeGreaterThan(0);
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

    const strInput = screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement;
    const before = Number(strInput.value);

    await user.click(screen.getByRole('button', { name: increaseStrPattern }));
    expect(Number((screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement).value)).toBe(before + 1);

    await user.click(screen.getByRole('button', { name: decreaseStrPattern }));
    expect(Number((screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement).value)).toBe(before);
  });

  it('preserves legal fighter skill allocation semantics', async () => {
    const user = userEvent.setup();
    render(<App />);

    await reachSkillsStep(user);

    const climbRow = screen.getByRole('row', { name: climbSkillPattern });
    const diplomacyRow = screen.getByRole('row', { name: diplomacySkillPattern });
    const climbIncrease = within(climbRow).getByRole('button', { name: /(?:Increase|\u63d0\u9ad8) (?:Climb|\u6500\u722c)/i });
    const diplomacyIncrease = within(diplomacyRow).getByRole('button', { name: /(?:Increase|\u63d0\u9ad8) (?:Diplomacy|\u4ea4\u6d89)/i });

    for (let i = 0; i < 4; i += 1) {
      await user.click(climbIncrease);
    }
    await user.click(diplomacyIncrease);

    expect(within(climbRow).getByLabelText(climbRanksPattern).textContent).toBe('4');
    expect(within(climbRow).getByText(/4 \+ 2 \+ 0 - 0 = 6/i)).toBeTruthy();
    expect((climbIncrease as HTMLButtonElement).disabled).toBe(true);
    expect(within(diplomacyRow).getByLabelText(diplomacyRanksPattern).textContent).toBe('0.5');
    expect(within(diplomacyRow).getByText(/0\.5 \+ -1 \+ 0 - 0 = -0\.5/i)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/2\/(?:rank|\u7ea7)/i)).toBeTruthy();
    expect(within(diplomacyRow).getByText(/(?:Max|\u4e0a\u9650)\s+2/i)).toBeTruthy();

    await user.click(diplomacyIncrease);
    await user.click(diplomacyIncrease);
    await user.click(diplomacyIncrease);

    expect(within(diplomacyRow).getByLabelText(diplomacyRanksPattern).textContent).toBe('2');
    expect((diplomacyIncrease as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(new RegExp(`${escapeRegExp(en.SKILLS_SPENT_LABEL)}:\\s*8|${escapeRegExp(zh.SKILLS_SPENT_LABEL)}:\\s*8`, 'i')),
    ).toBeTruthy();
    expect(
      screen.getByText(new RegExp(`${escapeRegExp(en.SKILLS_REMAINING_LABEL)}:\\s*4|${escapeRegExp(zh.SKILLS_REMAINING_LABEL)}:\\s*4`, 'i')),
    ).toBeTruthy();
    expect(within(climbRow).getByText(/(?:ACP applies|\u53d7\u62a4\u7532\u68c0\u5b9a\u60e9\u7f5a\u5f71\u54cd)/i)).toBeTruthy();
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
      screen.getByRole('combobox', { name: abilityGenerationPattern }),
      'rollSets'
    );
    const rollSetOptions = within(
      screen.getByRole('radiogroup', { name: rollSetOptionsPattern }),
    ).getAllByRole('radio');
    expect(rollSetOptions).toHaveLength(5);

    await user.click(rollSetOptions[0]!);
    expect((screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement).value).toBe('3');
    expect((screen.getByRole('spinbutton', { name: dexInputPattern }) as HTMLInputElement).value).toBe('3');

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
      screen.getByRole('combobox', { name: abilityGenerationPattern }),
      'rollSets'
    );

    expect((screen.getByRole('spinbutton', { name: strInputPattern }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: increaseStrPattern }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: decreaseStrPattern }) as HTMLButtonElement).disabled).toBe(true);

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
    expect(screen.queryByText(localizedPattern('Fighter', '\u6218\u58eb'))).toBeNull();
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
      const featFieldset = screen.getByRole('group', { name: /(?:Feat|\u4e13\u957f)/i });
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
      expect(screen.getByText(new RegExp(`${escapeRegExp(zh.REVIEW_LOAD_CATEGORY_LABEL)}:\\s*${escapeRegExp(zh.REVIEW_LOAD_CATEGORY_MEDIUM)}`))).toBeTruthy();
      expect(
        screen.getByText(
          new RegExp(
            `${escapeRegExp(zh.REVIEW_SPEED_IMPACT_LABEL)}:\\s*${escapeRegExp(zh.REVIEW_SPEED_IMPACT_REDUCED.replace('{speed}', '20'))}`,
          ),
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          new RegExp(
            `${escapeRegExp(zh.REVIEW_FAVORED_CLASS_LABEL)}:\\s*${escapeRegExp(zh.REVIEW_FAVORED_CLASS_ANY)}`,
          ),
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          new RegExp(
            `${escapeRegExp(zh.REVIEW_MULTICLASS_XP_IGNORED_LABEL)}:\\s*${escapeRegExp(zh.REVIEW_YES)}`,
          ),
        ),
      ).toBeTruthy();
      const equipmentArticle = screen
        .getByRole('heading', { name: zh.REVIEW_EQUIPMENT_LOAD })
        .closest('article');
      expect(equipmentArticle).toBeTruthy();
      expect(within(equipmentArticle!).getByText(/\u94fe\u7532/)).toBeTruthy();
      expect(within(equipmentArticle!).queryByText(/^chainmail$/i)).toBeNull();
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
