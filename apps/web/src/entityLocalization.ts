import type { Language } from './uiText';

const zhEntityNames: Record<string, string> = {
  human: '人类',
  dwarf: '矮人',
  elf: '精灵',
  gnome: '侏儒',
  'fighter-1': '战士（1级）',
  'power-attack': '强力攻击',
  'weapon-focus-longsword': '武器专攻（长剑）',
  spot: '侦察',
  listen: '聆听',
  climb: '攀爬',
  jump: '跳跃',
  diplomacy: '交涉',
  ride: '骑术',
  longsword: '长剑',
  chainmail: '锁子甲',
  'heavy-wooden-shield': '重木盾',
  'base-ac': '基础护甲等级',
  initiative: '先攻',
  fighter: '战士',
  wizard: '法师',
  any: '任意',
};

export function localizeEntityName(language: Language, id: string, fallback: string): string {
  if (language !== 'zh') return fallback;
  return zhEntityNames[id] ?? fallback;
}

