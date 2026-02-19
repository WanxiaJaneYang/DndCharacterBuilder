# Core 3.5e Class Data Implementation Plan

> **Contributor note:** Work through the tasks step-by-step and keep this plan updated as progress is made.

**Goal:** Add level-1 entities for all core D&D 3.5 SRD base classes to `packs/srd-35e-minimal/entities/classes.json`, extend the class `data` model as per the design doc, and validate behaviour via existing and new contracts.

**Architecture:** Changes include pack data updates (`packs/srd-35e-minimal`), schema validation updates, and engine interpretation updates for class progression gains. UI flow remains unchanged. Class rules are expressed via class `data`, especially `data.progression.levelGains`, consumed through the existing flow and engine.

**Scope clarification:** This plan includes engine updates in `packages/engine/src/index.ts` to interpret class progression gains and derive dynamic feature-slot limits from class grants. It is not data-only.

**Tech Stack:** Node/TypeScript monorepo, JSON packs. Validation via `npm test`, `npm run contracts`, and relevant typechecks.

---

### Task 1: Inspect Existing Class and Skill Data

**Files:**
- Read: `packs/srd-35e-minimal/entities/classes.json`
- Read: `packs/srd-35e-minimal/entities/skills.json`

**Step 1: Review current Fighter class entity**
- Open `packs/srd-35e-minimal/entities/classes.json`.
- Confirm current structure for `fighter-1` (fields, effects, and any existing `data` fields).

**Step 2: Review skill IDs**
- Open `packs/srd-35e-minimal/entities/skills.json`.
- Note the canonical skill ids and names (e.g. `climb`, `listen`, `spot`, `jump`, `diplomacy`, `ride`, etc.).
- Map SRD class skill lists to these ids for each core class.
- Document any SRD skills that are not yet present in `skills.json` as an explicit phase limitation (instead of adding ad-hoc fields in class entities).

---

### Task 2: Extend Fighter Class Data Model

**Files:**
- Modify: `packs/srd-35e-minimal/entities/classes.json`

**Step 1: Add structural class data to `fighter-1`**
- Add a `data.hitDie` field with value `10`.
- Add `data.baseAttackProgression: "full"`.
- Add `data.baseSaveProgression` with `{ fort: "good", ref: "poor", will: "poor" }`.
- Add a `data.levelTable` array containing a single entry for level 1 with:
  - `level: 1`
  - `bab: 1`
  - `fort: 2`
  - `ref: 0`
  - `will: 0`
  - `features`: at least a minimal list (e.g. `"bonus-feat"`, `"bonus-fighter-feat"`) or an empty list if not yet modeled.
  - `specialLabel`: short summary string (e.g. `"Bonus feat"`).

**Step 2: Define progression effects as the single source of truth**
- Add `data.progression.levelGains` for level 1.
- Put level-1 class stat mechanics (`hp`, `bab`, `fort`, `ref`, `will`) in `data.progression.levelGains[0].effects`.
- Do not duplicate the same mechanics in both `data.progression.levelGains[*].effects` and top-level `effects` for the same class entity.

**Step 3: Run tests**
- Run: `npm test`.
- Run: `npm run contracts`.
- Verify all tests and contracts continue to pass.

---

### Task 3: Add Level-1 Entities for All Core Classes

**Files:**
- Modify: `packs/srd-35e-minimal/entities/classes.json`

**Step 1: Draft class entries**
- For each of: Barbarian, Bard, Cleric, Druid, Monk, Paladin, Ranger, Rogue, Sorcerer, Wizard:
  - Add a new entity object with:
    - `id`: `<class-id>-1` (e.g. `barbarian-1`).
    - `name`: `<Class Name> (Level 1)`.
    - `entityType`: `"classes"`.
    - `summary`: SRD/OGL-safe one-line summary.
    - `description`: short paraphrased description focused on level-1.
    - `portraitUrl`, `iconUrl`: `null`.
  - Add `data` fields:
    - `skillPointsPerLevel`: canonical per-class base.
    - `classSkills`: list of skill ids mapped from SRD class skills to `skills.json` ids.
    - `hitDie`: numeric size of class hit die.
    - `baseAttackProgression`: `"full" | "threeQuarters" | "half"`.
    - `baseSaveProgression`: `{ fort, ref, will }` with `"good" | "poor"`.
    - `levelTable`: a single level-1 entry with correct BAB and saves:
      - `bab`: 1 for `baseAttackProgression: "full"`, 0 for `"threeQuarters"` and `"half"` at level 1.
      - `fort/ref/will`: +2 for good saves, +0 for poor saves at level 1.
  - Add `data.progression.levelGains[*].effects`:
    - `stats.hp`: set to `max(hitDie) + Con modifier`.
    - `stats.bab`: set to level-1 BAB.
    - `stats.fort`, `stats.ref`, `stats.will`: set to level-1 base saves.

**Step 2: Validate JSON**
- Ensure JSON syntax is valid (commas, arrays, objects).
- Keep array ordering simple: Fighter first, then other classes in a consistent order (alphabetical or PHB order).

**Step 3: Run tests**
- Run: `npm test`.
- Run: `npm run contracts`.
- Confirm the existing `happy-path.json` still passes.

---

### Task 4: Add a New Contract for a Non-Fighter Class

**Files:**
- Add: `packs/srd-35e-minimal/contracts/<class>-happy-path.json` (e.g. `rogue-happy-path.json` or `cleric-happy-path.json`)

**Step 1: Choose a representative class**
- Prefer a class with a different save profile and non-full BAB, such as:
  - Rogue (good Reflex, poor Fort/Will), or
  - Cleric (good Fort and Will, poor Reflex).

**Step 2: Create contract fixture**
- Create a new contract file mirroring the structure of `happy-path.json`:
  - `enabledPacks`: `["srd-35e-minimal"]`.
  - `initialState`: `{}`.
  - `actions`:
    - Choose a simple name.
    - Provide a reasonable ability array.
    - `race`: `human` (or another existing race).
    - `class`: the new class id (e.g. `"rogue-1"`).
    - `feat`: pick an existing feat that makes sense but is already in `feats.json`.
    - `equipment`: choose a few existing items.
  - `expected`:
    - `availableChoicesContains` includes the new class id and at least one related item/feat.
    - `validationErrorCodes`: `[]`.
    - `finalSheetSubset.stats` checks:
      - Correct level-1 BAB.
      - Correct base saves for that class profile (e.g. `ref` 2 for Rogue).

**Step 3: Run contracts**
- Run: `npm run contracts`.
- Make adjustments to class data or contract expectations if necessary until the new contract passes.

---

### Task 5: Final Verification and Cleanup

**Files:**
- Read: `packs/srd-35e-minimal/entities/classes.json`
- Read: `packs/srd-35e-minimal/contracts/*.json`

**Step 1: Sanity-check entities**
- Skim all class entities to ensure:
  - Ids are consistent and kebab-case.
  - Hit dice, BAB progressions, and save profiles match canonical 3.5e SRD.
  - `classSkills` lists are aligned with `skills.json`.
  - `levelTable` entries for level 1 are correct.

**Step 2: Run full validation suite**
- Run: `npm test`.
- Run: `npm run contracts`.
- Optionally run: `npm run typecheck`, `npm run build`.

**Step 3: Summarize outcomes**
- Note any remaining risks:
  - Known approximations in class skills vs SRD wording.
  - Missing advanced features/spellcasting that are intentionally out of scope.

---

## Status and Next Steps

**Status (current):**
- Design doc for core 3.5e class data is written: `docs/plans/2026-02-19-class-data-design.md`.
- Implementation plan (this file) is drafted.
- `fighter-1` in `packs/srd-35e-minimal/entities/classes.json` has been extended with:
  - `hitDie`, `baseAttackProgression`, `baseSaveProgression`.
  - A level-1 `levelTable` entry that matches existing effects.

**Next Steps (for follow-up work):**
- Implement Task 3: add level-1 class entities for all remaining core classes with correct skill points, class skills, hit die, BAB progression, and saves.
- Implement Task 4: add at least one new contract (e.g. Human Rogue 1 or Cleric 1) to validate a non-fighter class path.
- Run the full validation suite (`npm test`, `npm run contracts`, and optionally `npm run typecheck` / `npm run build`) and update this section with final outcomes.

