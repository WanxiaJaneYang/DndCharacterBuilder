import uiTextJson from './uiText.json';

export type Language = 'en' | 'zh';
export type AbilityCode = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type UIText = (typeof uiTextJson)['en'];
export type AbilityLabels = UIText['ABILITY_LABELS'];

type UITextRecord = Record<Language, UIText>;

function parseUIText(input: unknown): UITextRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid uiText.json format: expected object with en/zh keys.');
  }

  const record = input as Partial<Record<Language, unknown>>;
  if (!record.en || !record.zh) {
    throw new Error('Invalid uiText.json format: expected complete UIText payload for en and zh.');
  }

  return input as UITextRecord;
}

export const uiText = parseUIText(uiTextJson);

export function detectDefaultLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}
