# Core 3.5e Class Data Design

**Goal:** Represent core D&D 3.5e SRD base classes at level 1 in the `srd-35e-minimal` pack, in a way that is correct for level-1 creation today and structurally ready for future leveling work, without overcommitting to unused 2–20 data.

**Architecture:** Class rules remain fully data-driven in pack entities under `packs/srd-35e-minimal/entities/classes.json`. The engine consumes class entities via existing flow steps and entity-type loading (no engine or UI hard-coding). We extend the `classes` entity `data` block with a small, focused class schema that encodes hit die and level-1 progression details, plus a minimal `levelTable` that can be extended to 2–20 later. Engine-facing mechanics for level-1 HP, BAB, and base saves are expressed via `effects`, derived from the same class data.

**Tech Stack:** JSON packs validated by `@dcb/schema` entity schemas, interpreted by `@dcb/engine` via flow/pack resolution in `@dcb/datapack`.

---

## 1. Scope and Constraints

- Edition: D&D 3.5 SRD (PHB used only as a clarifying reference; pack text is OGL-safe paraphrase).
- Characters: Level 1 only (per product docs), but class data should be future-proof for leveling.
- Classes: All core PHB base classes at level 1:
  - Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Wizard.
- Pack: Reuse `packs/srd-35e-minimal` (no new pack), updating `entities/classes.json`.
- UI & engine:
  - Flow already has a `class` step sourcing from `entityType: "classes"`.
  - The engine already:
    - Applies `effects` to derive stats (HP, BAB, saves).
    - Uses `data.skillPointsPerLevel` and `data.classSkills` for skills budgeting/validation.
  - No UI or engine code changes for this phase; all work is within pack data and contracts.

Non-goals for this phase:

- Implementing full leveling UX or multi-level engine logic.
- Encoding full spellcasting tables or 2–20 class level tables.
- Encoding every class feature as DSL effects; text description in `data` is sufficient for now.

---

## 2. Class Entity Shape

Class entities stay within the existing `EntitySchema` shape and extend the planned class data model in `ENTITY_SCHEMA.md`.

### 2.1 Common entity fields

For each class we define:

- `id`: stable kebab-case identifier.
  - Pattern: `<class-id>-1`, e.g. `barbarian-1`, `bard-1`, `cleric-1`, ..., `wizard-1`.
- `name`: human-readable label, e.g. `"Barbarian (Level 1)"`.
- `entityType`: `"classes"`.
- `summary`: short SRD/OGL-safe summary suitable for list cards.
- `description`: slightly longer paraphrased description focused on what level-1 of this class provides.
- `portraitUrl`, `iconUrl`: `null` for now (no assets).

These follow the common entity rules from `ENTITY_SCHEMA.md` and `PACK_FORMAT.md`.

### 2.2 `data` block

We add a focused `data` model for classes, grounded in the “planned additions” section of `ENTITY_SCHEMA.md` but intentionally minimal for this phase:

Required fields used by the current engine:

- `skillPointsPerLevel`: number
  - The canonical per-level base skill points for the class, before Int modifier.
  - Examples:
    - Barbarian: 4
    - Bard: 6
    - Cleric: 2
    - Druid: 4
    - Fighter: 2
    - Monk: 4
    - Paladin: 2
    - Ranger: 6
    - Rogue: 8
    - Sorcerer: 2
    - Wizard: 2
- `classSkills`: string[]
  - List of skill ids (from `entities/skills.json`) treated as class skills.
  - We map SRD class skill lists to existing skill ids; where a skill name doesn’t currently exist, we either:
    - Re-use an obviously equivalent existing id (e.g. `gather-information`).
    - Defer adding new skills to a separate task if the gap is non-trivial.

Structural / future-proof fields (minimal but extensible):

- `hitDie`: number
  - The size of the class’s hit die, storing the numeric value (e.g. `12` for d12).
  - Examples:
    - Barbarian: 12
    - Fighter, Paladin, Ranger: 10
    - Cleric, Druid, Monk, Rogue, Bard: 8
    - Sorcerer, Wizard: 4
- `baseAttackProgression`: `"full" | "threeQuarters" | "half"`
  - Encodes the standard 3.5 BAB progressions:
    - Barbarian, Fighter, Paladin, Ranger: `"full"`.
    - Bard, Cleric, Druid, Monk, Rogue: `"threeQuarters"`.
    - Sorcerer, Wizard: `"half"`.
- `baseSaveProgression`: object
  - `{ "fort": "good" | "poor", "ref": "good" | "poor", "will": "good" | "poor" }`
  - Examples:
    - Barbarian: `{ fort: "good", ref: "poor", will: "poor" }`
    - Rogue: `{ fort: "poor", ref: "good", will: "poor" }`
    - Cleric: `{ fort: "good", ref: "poor", will: "good" }`
- `levelTable`: array of level entries
  - For this phase we define at least the level-1 row per class:
  - Example shape:
    - `{ "level": 1, "bab": 1, "fort": 2, "ref": 0, "will": 0, "features": ["fast-movement", "rage-1-day"], "specialLabel": "Rage 1/day, fast movement" }`
  - Rules:
    - `level` is a positive integer.
    - `bab`, `fort`, `ref`, `will` are the canonical base values for that level.
    - `features` lists ids for class features; the features themselves are documented textually elsewhere (e.g. in class docs or as future `rules` entities).
    - `specialLabel` is a short, human-facing summary used for UI/debugging.
  - We deliberately do **not** fill levels 2–20 in this phase; those can be added later when leveling is in scope.

The `data` block is intentionally descriptive and forward-looking; the engine will not depend on `levelTable` yet, but its presence makes later leveling work purely data-focused.

### 2.3 `effects` block (engine-facing mechanics)

For each class we define deterministic effects for the stats the engine and contracts currently assert:

- HP at level 1:
  - `stats.hp` is set to `max(hitDie) + Con modifier` for that class.
  - Example for Fighter (existing pattern, generalized):
    - Sum of `{ const: 10 }` + `{ abilityMod: "con" }`.
  - For other classes we follow the same pattern, replacing the constant with the class’s hit die value:
    - Barbarian: 12
    - Cleric/Rogue/Bard/etc.: 8
    - Sorcerer/Wizard: 4
- Base attack bonus at level 1:
  - `stats.bab` set to the level-1 BAB derived from `baseAttackProgression`.
  - In 3.5e, level-1 BAB is:
    - `1` for `"full"`, `0` for `"threeQuarters"` and `"half"`.
- Base saves at level 1:
  - `stats.fort`, `stats.ref`, `stats.will` set to the canonical level-1 base saves.
  - For `good` saves: +2; for `poor` saves: +0 at level 1.

We continue to use the existing DSL (`kind: "set"`, `targetPath`, `value`) so that the engine remains unchanged and all behaviour is visible in pack data.

We do not, in this phase, encode:

- Class weapon/armor proficiencies as mechanical effects.
- Per-day counts or detailed behaviour of class features like “smite evil”, “bardic music”, or “wild shape”.

Those can be modelled later as the engine’s DSL and sheet-completeness phases evolve.

---

## 3. Integration With Existing Flow and Contracts

### 3.1 Flow

The existing `packs/srd-35e-minimal/flows/character-creation.flow.json` already defines a `class` step:

- `kind: "class"`
- `source.type: "entityType"`
- `source.entityType: "classes"`

No changes are required to the flow:

- Adding more class entities automatically populates the class step options.
- Level-1-only scope remains consistent with the product docs.

### 3.2 Engine behaviour

- Engine already:
  - Pulls `skillPointsPerLevel` and `classSkills` from the selected class entity to determine skill budgets/validation.
  - Applies `effects` to derive final `stats.*` used in the review/export.
- By standardizing the class `data` model, we avoid new engine code while making future engine changes (e.g. reading `levelTable` for leveling) straightforward and deterministic.

### 3.3 Contracts

We extend pack contracts under `packs/srd-35e-minimal/contracts/`:

- Retain existing `happy-path.json`:
  - Human Fighter 1, asserting:
    - Correct availability of `human`, `fighter-1`, `power-attack`, `chainmail`.
    - Correct AC and BAB subset in the final sheet.
- Add at least one additional contract fixture for another class (e.g. Human Rogue 1 or Human Cleric 1):
  - Actions:
    - Choose abilities, race (`human`), class (`rogue-1` or `cleric-1`), a simple feat, and starting gear.
  - Expectations:
    - `availableChoicesContains` includes the new class id.
    - `validationErrorCodes` is empty.
    - `finalSheetSubset.stats` reflects the correct level-1 BAB and primary good save (e.g. `ref` 2 for Rogue, `fort` 2 and `will` 2 for Cleric).

These fixtures give us quick regression coverage that the new class data is wired correctly without over-specifying full sheet parity.

---

## 4. Trade-offs and Future Work

### 4.1 Chosen trade-offs

- **YAGNI for 2–20 levels:**
  - We add only level-1 rows to `levelTable` today.
  - This minimizes error surface while still documenting the intended structure for future leveling.
- **Text-first class features:**
  - Class features are referenced by id and summarized in `specialLabel`, but not mechanically encoded in DSL yet.
  - This keeps the engine simple until we have clear product requirements for how features must impact the sheet.
- **Current skill catalog limits class-skill completeness:**
  - Some SRD class skills are not yet present in `entities/skills.json`.
  - Class skill lists in this phase map only to currently available skill ids; missing SRD skills are tracked as follow-up data work.
- **SRD / OGL-safe text:**
  - Descriptions and special labels are written as paraphrases, not PHB verbatim text, to stay within SRD/OGL constraints.

### 4.2 Future extensions (out of scope for this phase)

- Fill out full 2–20 `levelTable` entries per class when:
  - Leveling UX is in scope.
  - Engine support for multiple levels and progression is ready.
- Add `spellcasting` sub-objects in `data` for casters:
  - Spells-per-day tables, known vs prepared models, caster ability, etc.
- Encode more class features as `rules` entities and/or class `effects`:
  - E.g. automatic proficiencies, conditional attack/save bonuses, rage usage, smite damage, etc.
- Expand pack contracts to cover a wider range of class/race/feat combinations and verify more of the final sheet.

---

## 5. Acceptance Criteria

- All core PHB base classes have a level-1 class entity in `packs/srd-35e-minimal/entities/classes.json` with:
  - Correct `id`, `name`, `entityType`, `summary`, and `description`.
  - `data` including:
    - `skillPointsPerLevel`
    - `classSkills` aligned to `entities/skills.json`
    - `hitDie`, `baseAttackProgression`, `baseSaveProgression`
    - A `levelTable` entry for level 1 with correct BAB and base saves.
  - `effects` correctly setting:
    - `stats.hp` to max hit die + Con modifier.
    - `stats.bab` to correct level-1 BAB.
    - `stats.fort`, `stats.ref`, `stats.will` to correct level-1 base saves.
- The character creation flow and engine run without errors using the updated pack.
- Existing `happy-path.json` contract continues to pass.
- New contract(s) for at least one additional class pass and assert correct BAB/save values.

