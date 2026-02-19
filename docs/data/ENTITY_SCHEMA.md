# Entity Schema (Pack Entities)

This document describes shared entity fields and type-specific data models.

## Common fields (all entities)

- `id` (string): Stable kebab-case identifier.
- `name` (string): Display label.
- `entityType` (string): Bucket key (`races`, `classes`, `feats`, `items`, `skills`, `rules`).
- `summary` (string): Short description for list/card surfaces.
- `description` (string): Detailed description for modal/detail surfaces.
- `portraitUrl` (optional string or `null`): URL/path for a larger portrait/hero image when available.
- `iconUrl` (optional string or `null`): URL/path for a compact icon glyph when available.
- `constraints` (optional): Eligibility checks.
- `effects` (optional): Engine-applied modifiers.
- `data` (optional): Entity-specific metadata.

## Race `data` model

For `entityType = "races"`, `data` is validated with a strict race schema:

- `size`: `small | medium | large`
- `baseSpeed`: positive integer
- `abilityModifiers`: map of ability ids (`str|dex|con|int|wis|cha`) to integer bonuses/penalties
- `vision`:
  - `lowLight`: boolean
  - `darkvisionFeet`: integer >= 0
- `automaticLanguages`: string[]
- `bonusLanguages`: string[]
- `favoredClass`: string (`any` allowed)
- `racialTraits`:
  - `id`: string
  - `name`: string
  - `description`: string
- `skillBonuses` (optional): list of `{ skill, bonus, type?, when? }`
- `saveBonuses` (optional): list of `{ target, bonus, type?, when? }`
- `attackBonuses` (optional): list of `{ target, bonus, type?, when? }`
- `innateSpellLikeAbilities` (optional): list of `{ spell, frequency, casterLevel?, scope? }`

## Notes

- Entity-level text metadata is required; image URL fields are optional and may be `null` when no asset exists.
- Race entries can still express engine-ready mechanics in `effects`.
- Rich metadata in `data` is intended for details modal + rules expansion.

## Planned Extensions For Sheet Parity

To support a more complete SRD-style final character sheet, the following entity `data` fields should be added in future phases.

### Class `data` (planned additions)

- `hitDie`: number (example: `10` for Fighter d10)
- `baseAttackProgression`: enum (`full`, `threeQuarters`, `half`) or explicit table
- `baseSaveProgression`: object keyed by `fort`, `ref`, `will` with progression enum
- `levelTable`: list of `{ level, bab, fort, ref, will, features?, specialLabel? }`
- `classFeaturesByLevel`: list of `{ level, featureId }`
- `spellcasting` (optional): caster ability, spells-per-day table, known/prepared model

### Item `data` (planned additions)

- `slot` (optional): worn slot (`armor`, `shield`, `weapon`, etc.)
- `weight`: number
- `cost`: number + currency unit
- `armor` (optional): armor bonus, max dex, armor check penalty, arcane spell failure, speed impact
- `weapon` (optional): attack type, damage, crit profile, range increment

### Skill `data` (planned additions)

- `armorCheckPenaltyApplies`: boolean
- `trainedOnly`: boolean
- `synergyRules` (optional): list of conditional misc modifiers

These planned fields are intentionally data-driven so the engine can compute final-sheet values without hardcoded class or item logic.
