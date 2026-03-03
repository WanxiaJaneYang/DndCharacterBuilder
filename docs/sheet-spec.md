# Character Sheet Spec (3.5 SRD MVP)

Issue: `#80`

This document defines the minimum final character-sheet export for the 3.5 SRD MVP.

Goal:
- match the structure players expect from a typical D&D 3.5 character sheet
- stay grounded in the current engine output surface
- make empty or unresolved areas explicit instead of omitting them

## Sources Consulted

- Engine type and derivation code: `packages/engine/src/index.ts`
- Engine tests: `packages/engine/src/engine.test.ts`
- Contract fixtures: `packs/srd-35e-minimal/contracts/happy-path.json`, `packs/srd-35e-minimal/contracts/unresolved-rules.json`
- Existing export docs: `docs/data/EXPORT_SCHEMA.md`, `docs/ux/steps/08_review_export.md`
- 3.5 SRD references:
  - Combat statistics: <https://www.d20srd.org/srd/combat/combatStatistics>
  - Skills summary: <https://www.d20srd.org/srd/skills/skillsSummary.htm>
  - Skills usage: <https://www.d20srd.org/srd/skills/usingSkills.htm>
  - Armor: <https://www.d20srd.org/srd/equipment/armor.htm>

## Design Principles

- Every build export MUST include the same top-level sections, even when some sections are empty.
- Every derived number SHOULD expose a breakdown when the engine can compute one deterministically.
- Empty arrays/objects are preferred over omitted keys.
- Unknown, deferred, or not-yet-implemented mechanics MUST be represented in `unresolved`.
- Generic carryover fields from the current engine (`stats`, `selections`, `phase1`, `phase2`) may continue to exist for compatibility, but the normalized MVP sheet contract is the structure below.

## Required Top-Level Sections

Every build export MUST include these top-level sections:

- `metadata`
- `identity`
- `abilities`
- `combat`
- `skills`
- `feats`
- `rules`
- `unresolved`

Recommended compatibility sections that may remain while the engine transitions:

- `stats`
- `selections`
- `decisions`
- `phase1`
- `phase2`
- `provenance`
- `packSetFingerprint`

## Required Shape

```ts
type CharacterSheetMvp = {
  metadata: {
    name: string;
  };
  identity: {
    raceId: string | null;
    classId: string | null;
    level: number;
    xp: number;
    size: string;
    speed: {
      base: number;
      adjusted: number;
    };
  };
  abilities: Record<
    "str" | "dex" | "con" | "int" | "wis" | "cha",
    {
      score: number;
      mod: number;
    }
  >;
  combat: {
    ac: {
      total: number;
      touch: number;
      flatFooted: number;
      breakdown: {
        armor: number;
        shield: number;
        dex: number;
        size: number;
        natural: number;
        deflection: number;
        misc: number;
      };
    };
    initiative: {
      total: number;
      dex: number;
      misc: number;
    };
    grapple: {
      total: number;
      bab: number;
      str: number;
      size: number;
      misc: number;
    };
    attacks: {
      melee: AttackLine[];
      ranged: AttackLine[];
    };
    saves: {
      fort: SaveBreakdown;
      ref: SaveBreakdown;
      will: SaveBreakdown;
    };
    hp: {
      total: number;
      breakdown: {
        hitDie: number;
        con: number;
        misc: number;
      };
    };
  };
  skills: SkillLine[];
  feats: FeatLine[];
  rules: {
    decisions: {
      featSelectionLimit: number;
      favoredClass: string | null;
      ignoresMulticlassXpPenalty: boolean;
      classSkills: string[];
      ancestryTags: string[];
      sizeModifiers: {
        ac: number;
        attack: number;
        hide: number;
        carryingCapacityMultiplier: number;
      };
      movementOverrides: {
        ignoreArmorSpeedReduction: boolean;
      };
      racialSaveBonuses: ConditionalModifier[];
      racialAttackBonuses: ConditionalModifier[];
      racialAcBonuses: ConditionalModifier[];
      racialSpellDcBonuses: SpellDcModifier[];
      racialInnateSpellLikeAbilities: InnateSpellLikeAbility[];
      skillPoints: {
        basePerLevel: number;
        racialBonusAtLevel1: number;
        racialBonusPerLevel: number;
        firstLevelMultiplier: number;
        total: number;
        spent: number;
        remaining: number;
      };
    };
    provenance: ProvenanceEntry[];
    packSetFingerprint: string;
  };
  unresolved: UnresolvedEntry[];
};

type AttackLine = {
  itemId: string;
  name: string;
  attackBonus: number;
  damage: string;
  crit: string;
  range?: string;
};

type SaveBreakdown = {
  total: number;
  base: number;
  ability: number;
  misc: number;
};

type SkillLine = {
  id: string;
  name: string;
  ability: "str" | "dex" | "con" | "int" | "wis" | "cha";
  classSkill: boolean;
  ranks: number;
  maxRanks: number;
  costPerRank: number;
  costSpent: number;
  breakdown: {
    abilityMod: number;
    racial: number;
    misc: number;
    acp: number;
  };
  total: number;
};

type FeatLine = {
  id: string;
  name: string;
  summary: string;
};

type ConditionalModifier = {
  target: string;
  bonus: number;
  type?: string;
  when?: string;
};

type SpellDcModifier = {
  school: string;
  bonus: number;
  type?: string;
  when?: string;
};

type InnateSpellLikeAbility = {
  spell: string;
  frequency: string;
  casterLevel?: string;
  scope?: string;
};

type ProvenanceEntry = {
  targetPath: string;
  delta?: number;
  setValue?: number;
  source: {
    packId: string;
    entityId: string;
    choiceStepId?: string;
  };
};

type UnresolvedEntry = {
  id: string;
  category: string;
  description: string;
  dependsOn: string[];
  impacts?: string[];
  source: {
    entityType: string;
    entityId: string;
    packId: string;
    sourceRefs?: string[];
  };
};
```

## Section Definitions

### `metadata`

- `name: string`
- MVP keeps this minimal. Empty string is allowed during intermediate draft state, but final export SHOULD contain the validated character name.

### `identity`

- `raceId: string | null`
- `classId: string | null`
- `level: number`
- `xp: number`
- `size: string`
- `speed.base: number`
- `speed.adjusted: number`

Notes:
- `level` is currently derived from the selected class ID / class progression in the engine.
- `xp` is explicit even when fixed to `0` in MVP.
- `speed.adjusted` reflects armor/load effects if applied.

### `abilities`

Required ability keys:

- `str`
- `dex`
- `con`
- `int`
- `wis`
- `cha`

Each ability value includes:

- `score: number`
- `mod: number`

Formula:

- `mod = floor((score - 10) / 2)`

### `combat`

#### Armor Class

Fields:

- `ac.total`
- `ac.touch`
- `ac.flatFooted`
- `ac.breakdown.armor`
- `ac.breakdown.shield`
- `ac.breakdown.dex`
- `ac.breakdown.size`
- `ac.breakdown.natural`
- `ac.breakdown.deflection`
- `ac.breakdown.misc`

Primary formula:

- `ac.total = 10 + armor + shield + dex + size + natural + deflection + misc`

Derived formulas:

- `ac.touch = 10 + dex + size + deflection + misc`
- `ac.flatFooted = 10 + armor + shield + size + natural + deflection + misc + min(dex, 0)`

Engine note:

- Current code infers `touch` as `total - armor - shield - natural`.
- Current code infers `flatFooted` as `total - max(dex, 0)`.
- Those are equivalent when the breakdown is complete.

#### Initiative

Fields:

- `initiative.total`
- `initiative.dex`
- `initiative.misc`

Formula:

- `initiative.total = dex + misc`

#### Grapple

Fields:

- `grapple.total`
- `grapple.bab`
- `grapple.str`
- `grapple.size`
- `grapple.misc`

Formula:

- `grapple.total = bab + str + size + misc`

Use the 3.5 grapple size modifier scale:

- `fine -16`
- `diminutive -12`
- `tiny -8`
- `small -4`
- `medium 0`
- `large +4`
- `huge +8`
- `gargantuan +12`
- `colossal +16`

#### Attacks

Required fields:

- `attacks.melee: AttackLine[]`
- `attacks.ranged: AttackLine[]`

Each `AttackLine` includes:

- `itemId: string`
- `name: string`
- `attackBonus: number`
- `damage: string`
- `crit: string`
- `range?: string`

Baseline formulas:

- `melee attack bonus = bab + str mod + size mod + misc`
- `ranged attack bonus = bab + dex mod + size mod + misc`

MVP notes:

- Situational modifiers such as range increment penalties are not encoded in the base exported number.
- If no equipped weapon produces an attack line, export MUST still include a fallback unarmed strike line.

#### Saves

Required fields:

- `saves.fort`
- `saves.ref`
- `saves.will`

Each save uses:

- `total`
- `base`
- `ability`
- `misc`

Formulas:

- `fort.total = base + con mod + misc`
- `ref.total = base + dex mod + misc`
- `will.total = base + wis mod + misc`

#### Hit Points

Required fields:

- `hp.total`
- `hp.breakdown.hitDie`
- `hp.breakdown.con`
- `hp.breakdown.misc`

Formula:

- `hp.total = hitDie + con + misc`

MVP note:

- The current engine infers a deterministic `hitDie` component from selected class hit die and level, then assigns any remainder to `misc`.

### `skills`

`skills` MUST be a list, not an omitted section, even when empty.

Each skill row includes:

- `id: string`
- `name: string`
- `ability: ability key`
- `classSkill: boolean`
- `ranks: number`
- `maxRanks: number`
- `costPerRank: number`
- `costSpent: number`
- `breakdown.abilityMod: number`
- `breakdown.racial: number`
- `breakdown.misc: number`
- `breakdown.acp: number`
- `total: number`

Formula:

- `total = ranks + abilityMod + racial + misc + acp`

3.5 rules reference:

- class skill ranks cost `1` point per rank
- cross-class ranks cost `2` points per rank
- max class skill ranks at level 1: `level + 3 = 4`
- max cross-class ranks at level 1: half of class-skill maximum

MVP note:

- Current engine stores a generic `skills` record and a `phase2.skills[]` list.
- This spec standardizes on a list with an explicit breakdown, because export consumers need stable ordering and visible channels.
- `acp` should be `0` for unaffected skills, not omitted.

### `feats`

`feats` MUST be present even when no feats are selected.

Each feat includes:

- `id: string`
- `name: string`
- `summary: string`

MVP note:

- Short effect text is sufficient.
- Full rules text can remain outside the export payload.

### `rules`

The `rules` section collects deterministic rule context that explains or reproduces the sheet.

Required fields:

- `decisions`
- `provenance`
- `packSetFingerprint`

#### `rules.decisions`

Carry through the current engine decision summary:

- feat-slot limits
- favored class
- multiclass XP exception flags
- class-skill list
- ancestry tags
- size modifiers
- movement overrides
- racial conditional save / attack / AC modifiers
- racial spell DC modifiers
- innate spell-like abilities
- skill-point budget and spent/remaining totals

This section is the closest current engine surface to a "rules block" on a paper sheet.

#### `rules.provenance`

`provenance` is a flat array of derivation records.

Each entry includes:

- `targetPath`
- `delta?`
- `setValue?`
- `source.packId`
- `source.entityId`
- `source.choiceStepId?`

This is the authoritative audit trail for derived stats.

#### `rules.packSetFingerprint`

- `packSetFingerprint: string`

This allows exported sheets to be reproduced against the exact enabled pack set.

### `unresolved`

`unresolved` MUST always be present.

If there are no unresolved mechanics, export:

```json
{
  "unresolved": []
}
```

Each unresolved item includes:

- `id: string`
- `category: string`
- `description: string`
- `dependsOn: string[]`
- `impacts?: string[]`
- `source.entityType: string`
- `source.entityId: string`
- `source.packId: string`
- `source.sourceRefs?: string[]`

Use `unresolved` for:

- deferred feat automation
- conditional racial bonuses not modeled in the engine
- proficiency gaps
- spellcasting or subsystem gaps outside MVP
- any required section content that cannot yet be derived deterministically

## Explicit Empty / Placeholder Behavior

The exporter MUST prefer explicit empty sections over missing keys.

Examples:

```json
{
  "feats": [],
  "skills": [],
  "unresolved": [],
  "combat": {
    "attacks": {
      "melee": [],
      "ranged": []
    }
  }
}
```

For known-but-unresolved content:

- keep the section present
- fill computable values
- add an `unresolved` entry for anything missing or deferred

Example:

```json
{
  "feats": [
    {
      "id": "acrobatic",
      "name": "Acrobatic",
      "summary": "General feat selected."
    }
  ],
  "unresolved": [
    {
      "id": "srd-35e-minimal:feats:acrobatic:acrobatic-benefit",
      "category": "feat-benefit",
      "description": "Feat benefit text is known but not fully enforced.",
      "dependsOn": ["cap:feat-effect-runtime"],
      "impacts": ["skills:jump", "skills:tumble"],
      "source": {
        "entityType": "feats",
        "entityId": "acrobatic",
        "packId": "srd-35e-minimal"
      }
    }
  ]
}
```

## Mapping to Current Engine Output

Current engine fields map to the normalized MVP contract as follows:

- `metadata` -> `metadata`
- `phase1.identity` -> `identity`
- `abilities` -> `abilities`
- `phase1.combat` -> `combat`
- `phase2.feats` -> `feats`
- `phase2.skills` + `skills` -> `skills`
- `decisions` + `provenance` + `packSetFingerprint` -> `rules`
- `unresolvedRules` -> `unresolved`

Compatibility notes:

- `stats` remains useful as a legacy flat summary but is not sufficient as the normative export contract.
- `selections` remains useful for replay/debugging but is not a substitute for resolved sheet sections.
- `phase2.traits`, `phase2.equipment`, and `phase2.movement` are still useful and SHOULD either stay as compatibility fields or be folded into future spec revisions. They are not listed as required top-level sections for this issue because the acceptance criteria explicitly names `abilities`, `combat`, `skills`, `feats`, `rules`, and `unresolved`.

## Minimum Acceptance Checklist

Every build export passes this spec only if:

- all required top-level sections are present
- required sections are present even when empty
- all six abilities are present with `score` and `mod`
- combat includes AC, initiative, grapple, attacks, saves, and HP
- skills include explicit breakdown channels
- feats are always an array
- rules includes decisions, provenance, and pack fingerprint
- unresolved is always an array
- formulas remain explainable by the exported breakdowns and/or provenance
