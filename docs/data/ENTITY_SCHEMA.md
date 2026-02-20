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
- `deferredMechanics` (optional): list of race-linked rules tracked for later implementation:
  - `id`: stable deferred-rule identifier
  - `category`: grouping tag (for example `proficiency`, `spell-like`, `race-typing`, `situational-bonus`)
  - `description`: what is not implemented yet
  - `dependsOn`: required subsystem(s) before implementing this rule
  - `sourceRefs` (optional): authenticity/source references
  - `impactPaths` (optional): expected model/engine areas to update

## Notes

- Entity-level text metadata is required; image URL fields are optional and may be `null` when no asset exists.
- Race entries can still express engine-ready mechanics in `effects`.
- Rich metadata in `data` is intended for details modal + rules expansion.
- `deferredMechanics` is a lookup index for unfinished race mechanics so follow-up implementation can be done quickly and traceably.

## Class `data` model

For `entityType = "classes"`, `data` is validated with a strict class schema:

- `skillPointsPerLevel`: integer >= 0
- `classSkills`: string[]
- `hitDie`: positive integer
- `baseAttackProgression`: `full | threeQuarters | half`
- `baseSaveProgression`:
  - `fort`: `good | poor`
  - `ref`: `good | poor`
  - `will`: `good | poor`
- `sourceRefs` (optional): class source anchors used for authenticity traceability
- `alignmentConstraint` (optional):
  - `text`: source-aligned alignment requirement text
  - `allowedAlignments` (optional): explicit normalized alignment list
- `proficiencies` (optional):
  - `text`: source-aligned weapon/armor proficiency text
- `exClassRules` (optional): string[] of source-aligned ex-class consequences/restrictions
- `spellcasting` (optional):
  - `tradition`: `arcane | divine`
  - `castingModel`: `prepared | spontaneous`
  - `ability`: `str | dex | con | int | wis | cha`
  - `startsAtLevel`: integer >= 1
  - `notes` (optional): string[]
  - `spellsPerDayByLevel` (optional): list of `{ level, slots }`
- `deferredMechanics` (optional): list of not-yet-implemented class-linked rules that should be revisited when dependencies land:
  - `id`: stable identifier for the deferred rule/mechanic
  - `category`: grouping tag (e.g. `alignment`, `proficiency`, `starter-pack`, `spellcasting`)
  - `description`: clear rule statement and current limitation
  - `dependsOn`: one or more dependency ids/names (subsystems or features that must be implemented first)
  - `sourceRefs` (optional): source links/ids for authenticity traceability
  - `impactPaths` (optional): expected model/engine areas impacted when implemented
- `levelTable` (optional, descriptive metadata): list of
  - `{ level, bab, fort, ref, will, features?, specialLabel?, babDisplay?, spellSlots? }`
- `progression` (optional, engine-facing dynamic model):
  - `levelGains`: ordered list of level entries (`level` unique/ascending, must include level 1)
  - each level gain must include at least one of:
    - `effects`: list of engine `Effect` records applied when that level is active
    - `grants`: list of grant events (feature slots, unlocks, feature grants, etc.)

At least one of `levelTable` or `progression.levelGains` must be present.

Engine note:
- `progression.levelGains[*].effects` is the adaptive source of truth for dynamic sheet changes by level.
- `levelTable` remains useful as display/reference metadata.
- `deferredMechanics` is the backlog bridge: use it to quickly identify and complete class updates when dependent systems are added.

## Planned Extensions For Sheet Parity

To support a more complete SRD-style final character sheet, additional entity `data` fields should be added in future phases.

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
