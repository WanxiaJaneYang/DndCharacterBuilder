# Engineering Work Plan

This living document tracks the engineering tasks required to implement the DnDCharacterBuilder MVP and future iterations. It serves as a roadmap for developers, with high-level milestones and granular tasks.

## Current Phase: MVP Implementation

### High-Level Milestones

1. **Core architecture and schemas**
   - [x] Define pack format and schemas (manifest, entities, flows, export).
   - [x] Implement pack loader and merge logic.
   - [x] Implement deterministic engine with provenance.
   - [x] Implement normalized MVP export/review contract aligned with `docs/sheet-spec.md`.

2. **Wizard UI and flow**
   - [x] Build the Rules Setup page with version and source selection.
   - [x] Implement race, class, ability, feat, skill, and equipment steps using the current picker and allocator UI.
   - [x] Implement review and export step with provenance display.
   - [x] Wire validation and gating for each step.
   - [x] Implement approved ability-step UI improvements from the 2026-02-23 design update.
   - [ ] Complete the generic step-runner refactor so `App.tsx` becomes thin and flow-driven.

3. **Data packs**
   - [x] Create minimal SRD 3.5 pack (human, fighter, basic feats, skills, items).
   - [x] Expand SRD race data to all core races with structured trait metadata (vision, ability modifiers, languages, favored class, racial traits).
   - [ ] Populate UI metadata (summary, description, images) for all entities.
   - [ ] Expand minimal SRD data until class-skill and item references resolve without gaps.
   - [ ] Write example flows and exports in `data/examples/`.

4. **Testing**
   - [x] Add unit tests for pack loader (datapack package).
   - [x] Add unit tests for engine (engine package).
   - [x] Add contract tests for the minimal SRD pack.
   - [x] Add wizard integration coverage (Vitest RTL) and initial visual regression coverage (Playwright).
   - [x] Add deeper E2E coverage for critical abilities and skills regressions.

### Future Phases (Beyond MVP)

1. **Content expansion**
   - Add more races, classes, feats, spells, and items to the SRD pack.
   - Support spells and spellcasting classes.
   - Support additional rule packs (for example 3.5 expansions or homebrew).

2. **Level-up and multiclass**
   - Implement level-up flow and beyond-level-1 progression.
   - Support multiclass progression and the remaining multiclass legality surfaces.

3. **Multi-edition support**
   - Introduce flows for 5e/5R and other editions.
   - Handle edition-specific steps such as background feats in 5R.

4. **AI assistance and hints**
   - Integrate AI models to provide contextual explanations and recommendations.
   - Ensure AI suggestions respect rule constraints and provenance.

## TODO

- Expand class, item, and skill data until minimal SRD references resolve without gaps.
- Finish engine-driven legality and error surfaces for the skills step so the UI never guesses missing metadata.
- Refactor the wizard into a generic step runner and split `packages/engine/src/index.ts` into modules.
- Add explicit sheet/export contract versioning and broaden sheet-spec contract coverage.
- Improve pack tooling and import/export UX once the contract surface is stable.

## Recent Progress

- Added a dedicated `skills` step to the character-creation flow and connected it to the UI.
- Updated engine decisions to consume race traits that change flow behavior:
  - `bonus-feat` now increases the feat selection limit.
  - `extra-skill-points` now increases level-1 skill budget.
- Added cross-class skill cost/rank validation and surfaced `favoredClass` XP-penalty metadata for future multiclass leveling logic.
- Added data-driven ability generation modes, extracted ability-step UI components, and covered them with web tests.
- Added review/export surfaces backed by `sheetViewModel`, including attack breakdowns, skill breakdowns, provenance display, and JSON export.
- Added pack contract fixtures for the minimal SRD pack, wired `npm run check:contract-fixtures` and `npm run contracts` into CI, and enforced ASCII/bidi safety for contract JSON.
- Added initial Playwright visual regression coverage alongside the existing Vitest wizard-flow integration tests.
- Merged PR #120 and PR #121 to add dedicated Playwright regression suites for the abilities and skills steps, including EN/ZH coverage and level-1 rank-cap assertions for skills.
- Added race-level `deferredMechanics` tracking in schema and `races.json` so PHB-linked but not-yet-implemented race rules are indexed for fast follow-up when dependent systems land.
- Recorded the approved deferred-mechanics normalization direction in docs so backlog metadata can migrate from engine-oriented path hints to stable concept IDs and capability IDs in a later implementation phase.
- Implemented deferred-mechanics normalization across schema validation, tests, docs, and SRD race/class/feat pack data.
- Merged PR #128 (issue #69) to add fail-fast pack reference integrity checks in contracts with deterministic diagnostics and pack-closure ID resolution for `races.data.favoredClass -> classes.id`.

## Deferred Mechanics Follow-up

- Documentation phase: completed.
- Planning phase: completed.
- Implementation phase: completed. `impactPaths` has been retired in favor of validated `impacts`, and `dependsOn` now accepts only canonical capability IDs.

## Backlog Triage

- Recommended implementation order and issue relationships are tracked in `docs/engineering/BACKLOG_TRIAGE.md`.
- Use that document before starting new issue work so duplicate or umbrella issues stay aligned with the repo's actual state.

## Checklist

- [x] Normalized MVP export/review contract implemented.
- [x] Rules Setup UI complete.
- [ ] All wizard steps implemented and fully flow-driven.
- [ ] Minimal pack fully populated with UI metadata.
- [x] Contract tests passing in CI.
- [ ] Work plan updated regularly.
