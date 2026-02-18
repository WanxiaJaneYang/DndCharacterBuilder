import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import uiTextJson from './uiText.json';

type TestUIText = {
  playerTitle: string;
  dmTitle: string;
  next: string;
  nameLabel: string;
  review: string;
  dmUnsupported: string;
  roleQuestion: string;
  languageLabel: string;
  english: string;
};

const uiText = uiTextJson as Record<'en' | 'zh', TestUIText>;
const en = uiText.en;
const zh = uiText.zh;

const playerNamePattern = new RegExp(`${en.playerTitle}|${zh.playerTitle}`, 'i');
const dmNamePattern = new RegExp(`${en.dmTitle}|${zh.dmTitle}`, 'i');
const nextPattern = new RegExp(`${en.next}|${zh.next}`, 'i');
const nameLabelPattern = new RegExp(`${en.nameLabel}|${zh.nameLabel}`, 'i');
const reviewPattern = new RegExp(`${en.review}|${zh.review}`, 'i');

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
    await user.type(screen.getByLabelText(nameLabelPattern), 'Aric');
    await user.click(screen.getByRole('button', { name: nextPattern }));

    const strInput = screen.getByLabelText('STR');
    await user.clear(strInput);
    await user.type(strInput, '16');

    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Human'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Fighter (Level 1)'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Power Attack'));
    await user.click(screen.getByRole('button', { name: nextPattern }));
    await user.click(screen.getByLabelText('Chainmail'));
    await user.click(screen.getByLabelText('Heavy Wooden Shield'));
    await user.click(screen.getByRole('button', { name: nextPattern }));

    expect(screen.getByText(reviewPattern)).toBeTruthy();
    expect(screen.getByText(/AC:/).textContent).toContain('BAB: 1');
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
    expect(screen.getByLabelText(nameLabelPattern)).toBeTruthy();
  });

  it('defaults to zh when browser locale starts with zh and supports keyboard language switching', async () => {
    await withNavigatorLanguage('zh-CN', async () => {
      const user = userEvent.setup();
      render(<App />);

      expect(screen.getByText(zh.roleQuestion)).toBeTruthy();

      const languageRadioGroup = screen.getByRole('radiogroup', { name: new RegExp(`${en.languageLabel}|${zh.languageLabel}`, 'i') });
      const englishRadio = within(languageRadioGroup).getByRole('radio', { name: en.english });
      englishRadio.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText(en.roleQuestion)).toBeTruthy();
    });
  });
});
