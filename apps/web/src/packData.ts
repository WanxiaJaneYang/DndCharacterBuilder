import type { LoadedPack } from '@dcb/datapack';

export const minimalPack: LoadedPack = {
  manifest: {
    id: 'srd-35e-minimal',
    name: 'D&D 3.5e SRD Minimal Pack',
    version: '0.1.0',
    priority: 10,
    dependencies: [],
    compatibleEngineRange: '>=0.1.0'
  },
  entities: {
    races: [{ id: 'human', name: 'Human', entityType: 'races', effects: [{ kind: 'set', targetPath: 'stats.speed', value: { const: 30 } }] }],
    classes: [{ id: 'fighter-1', name: 'Fighter (Level 1)', entityType: 'classes', effects: [
      { kind: 'set', targetPath: 'stats.hp', value: { sum: [{ const: 10 }, { abilityMod: 'con' }] } },
      { kind: 'set', targetPath: 'stats.bab', value: { const: 1 } },
      { kind: 'set', targetPath: 'stats.fort', value: { const: 2 } },
      { kind: 'set', targetPath: 'stats.ref', value: { const: 0 } },
      { kind: 'set', targetPath: 'stats.will', value: { const: 0 } }
    ] }],
    feats: [
      { id: 'power-attack', name: 'Power Attack', entityType: 'feats', constraints: [{ kind: 'abilityMin', ability: 'str', score: 13 }, { kind: 'mutuallyExclusive', groupId: 'feat-slot-1' }], data: { exclusiveGroup: 'feat-slot-1' } },
      { id: 'weapon-focus-longsword', name: 'Weapon Focus (Longsword)', entityType: 'feats', effects: [{ kind: 'add', targetPath: 'stats.attackBonus', value: { const: 1 } }], constraints: [{ kind: 'mutuallyExclusive', groupId: 'feat-slot-1' }], data: { exclusiveGroup: 'feat-slot-1' } }
    ],
    items: [
      { id: 'longsword', name: 'Longsword', entityType: 'items', effects: [] },
      { id: 'chainmail', name: 'Chainmail', entityType: 'items', effects: [{ kind: 'add', targetPath: 'stats.ac', value: { const: 5 } }, { kind: 'set', targetPath: 'stats.speed', value: { const: 20 } }] },
      { id: 'heavy-wooden-shield', name: 'Heavy Wooden Shield', entityType: 'items', effects: [{ kind: 'add', targetPath: 'stats.ac', value: { const: 2 } }] }
    ],
    skills: [
      { id: 'spot', name: 'Spot', entityType: 'skills' },
      { id: 'listen', name: 'Listen', entityType: 'skills' },
      { id: 'climb', name: 'Climb', entityType: 'skills' },
      { id: 'jump', name: 'Jump', entityType: 'skills' },
      { id: 'diplomacy', name: 'Diplomacy', entityType: 'skills' }
    ],
    rules: [
      { id: 'base-ac', name: 'Base AC', entityType: 'rules', effects: [{ kind: 'set', targetPath: 'stats.ac', value: { sum: [{ const: 10 }, { abilityMod: 'dex' }] } }] },
      { id: 'initiative', name: 'Initiative', entityType: 'rules', effects: [{ kind: 'set', targetPath: 'stats.initiative', value: { abilityMod: 'dex' } }] }
    ]
  },
  flow: {
    steps: [
      { id: 'name', kind: 'metadata', label: 'Name', source: { type: 'manual' } },
      { id: 'abilities', kind: 'abilities', label: 'Ability Scores', source: { type: 'manual' } },
      { id: 'race', kind: 'race', label: 'Race', source: { type: 'entityType', entityType: 'races', limit: 1 } },
      { id: 'class', kind: 'class', label: 'Class', source: { type: 'entityType', entityType: 'classes', limit: 1 } },
      { id: 'feat', kind: 'feat', label: 'Feat', source: { type: 'entityType', entityType: 'feats', limit: 1 } },
      { id: 'equipment', kind: 'equipment', label: 'Equipment', source: { type: 'entityType', entityType: 'items', limit: 10 } }
    ]
  },
  patches: [],
  packPath: 'in-memory'
};
