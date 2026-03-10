import type { Entity, Flow, Manifest } from '@dcb/schema';
import type { Page } from '@dcb/schema';
import type { LoadedPack } from '@dcb/datapack';

import manifestJson from '../../../packs/srd-35e-minimal/manifest.json';
import racesJson from '../../../packs/srd-35e-minimal/entities/races.json';
import classesJson from '../../../packs/srd-35e-minimal/entities/classes.json';
import featsJson from '../../../packs/srd-35e-minimal/entities/feats.json';
import itemsJson from '../../../packs/srd-35e-minimal/entities/items.json';
import skillsJson from '../../../packs/srd-35e-minimal/entities/skills.json';
import rulesJson from '../../../packs/srd-35e-minimal/entities/rules.json';
import flowJson from '../../../packs/srd-35e-minimal/flows/character-creation.flow.json';
import racePageJson from '../../../packs/srd-35e-minimal/ui/pages/character.race.page.json';
import classPageJson from '../../../packs/srd-35e-minimal/ui/pages/character.class.page.json';
import namePageJson from '../../../packs/srd-35e-minimal/ui/pages/character.name.page.json';
import reviewPageJson from '../../../packs/srd-35e-minimal/ui/pages/character.review.page.json';
import enLocaleJson from '../../../packs/srd-35e-minimal/locales/en.json';
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
    pageSchemas: {
      [racePageJson.id]: racePageJson as Page,
      [classPageJson.id]: classPageJson as Page,
      [namePageJson.id]: namePageJson as Page,
      [reviewPageJson.id]: reviewPageJson as Page,
    },
    patches: [],
    locales: {
      en: enLocaleJson as PackLocale,
      zh: zhLocaleJson as PackLocale,
    },
    packPath: 'packs/srd-35e-minimal'
  };
}
