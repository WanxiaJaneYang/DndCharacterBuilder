import uiTextJson from './uiText.json';

export type Language = 'en' | 'zh';

export type UIText = {
  appTitle: string;
  appSubtitle: string;
  stepCounter: string;
  back: string;
  next: string;
  review: string;
  exportJson: string;
  toggleProvenance: string;
  printableSheet: string;
  nameLabel: string;
  raceLabel: string;
  classLabel: string;
  metadataPlaceholder: string;
  abilitiesSuffix: string;
  roleAria: string;
  roleQuestion: string;
  roleIntro: string;
  dmTitle: string;
  dmSubtitle: string;
  playerTitle: string;
  playerSubtitle: string;
  dmUnsupported: string;
  rulesSetupTitle: string;
  editionLabel: string;
  sourcesLabel: string;
  baseSourceLockedLabel: string;
  startWizard: string;
  languageLabel: string;
  english: string;
  chinese: string;
};

const uiTextKeys: Array<keyof UIText> = [
  'appTitle',
  'appSubtitle',
  'stepCounter',
  'back',
  'next',
  'review',
  'exportJson',
  'toggleProvenance',
  'printableSheet',
  'nameLabel',
  'raceLabel',
  'classLabel',
  'metadataPlaceholder',
  'abilitiesSuffix',
  'roleAria',
  'roleQuestion',
  'roleIntro',
  'dmTitle',
  'dmSubtitle',
  'playerTitle',
  'playerSubtitle',
  'dmUnsupported',
  'rulesSetupTitle',
  'editionLabel',
  'sourcesLabel',
  'baseSourceLockedLabel',
  'startWizard',
  'languageLabel',
  'english',
  'chinese',
];

function isUIText(value: unknown): value is UIText {
  if (!value || typeof value !== 'object') return false;
  return uiTextKeys.every((key) => typeof (value as Record<string, unknown>)[key] === 'string');
}

function parseUIText(input: unknown): Record<Language, UIText> {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid uiText.json format: expected object with en/zh keys.');
  }
  const record = input as Record<string, unknown>;
  if (!isUIText(record.en) || !isUIText(record.zh)) {
    throw new Error('Invalid uiText.json format: expected complete UIText payload for en and zh.');
  }
  return { en: record.en, zh: record.zh };
}

export const uiText = parseUIText(uiTextJson);

export function detectDefaultLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

