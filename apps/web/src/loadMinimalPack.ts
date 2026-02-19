import type { Entity, Flow, Manifest } from '@dcb/schema';
import type { LoadedPack } from '@dcb/datapack';

import manifestJson from '../../../packs/srd-35e-minimal/manifest.json';
import racesJson from '../../../packs/srd-35e-minimal/entities/races.json';
import classesJson from '../../../packs/srd-35e-minimal/entities/classes.json';
import featsJson from '../../../packs/srd-35e-minimal/entities/feats.json';
import itemsJson from '../../../packs/srd-35e-minimal/entities/items.json';
import skillsJson from '../../../packs/srd-35e-minimal/entities/skills.json';
import rulesJson from '../../../packs/srd-35e-minimal/entities/rules.json';
import flowJson from '../../../packs/srd-35e-minimal/flows/character-creation.flow.json';
import zhLocaleJson from '../../../packs/srd-35e-minimal/locales/zh.json';
import type { PackLocale } from '@dcb/datapack';

export function loadMinimalPack(): LoadedPack {
  return {
    manifest: manifestJson as Manifest,
    entities: {
      races: racesJson as Entity[],
      classes: classesJson as Entity[],
      feats: featsJson as Entity[],
      items: itemsJson as Entity[],
      skills: skillsJson as Entity[],
      rules: rulesJson as Entity[]
    },
    flow: flowJson as Flow,
    patches: [],
    locales: {
      zh: zhLocaleJson as PackLocale,
    },
    packPath: 'packs/srd-35e-minimal'
  };
}
