# PRD Alignment Checklist

This checklist maps high-level requirements from the Product Requirements Document to implementation status. It is not a wishlist; it should reflect what the repo already proves today and what still remains open.

## Version and Source Selection

- [x] Implement Rules Setup step for selecting edition and packs (see `/ux/steps/01_rules_setup.md`).
- [x] Display available packs and lock the base SRD pack (see `/product/DECISIONS.md`).
- [x] Validate selection and build context for engine (engine and UI).

## Race Selection

- [x] Render races as cards with summary and image (see `/ux/steps/02_race_selection.md`).
- [x] Load race data from packs; no hardcoded values.
- [ ] Enforce selection of exactly one race and show details modal.

## Class Selection

- [x] Render class selection as pack-driven cards (see `/ux/steps/03_class_selection.md`).
- [ ] Enforce exactly one class selection and handle class prerequisites.

## Ability Scores

- [x] Read method from flow config (see `/ux/steps/04_ability_scores.md`).
- [x] Implement point-buy logic and validation.
- [x] Show ability modifiers and update engine state.
- [x] Support PHB and roll-set generation modes from pack config.

## Feats

- [x] Display feats with summary and details (see `/ux/steps/05_feats.md`).
- [ ] Enforce prerequisites and final legality rules.
- [x] Update engine state and provenance.

## Skills

- [x] Add skills step to flow and implement the current skills allocator UI.
- [x] Enforce level-1 budget and max-rank rules in the engine.
- [x] Save allocations in engine state.
- [ ] Finish engine-driven legality/error surfaces so the UI no longer relies on fallback defaults.

## Equipment

- [x] Provide equipment selection page (see `/ux/steps/07_equipment.md`).
- [ ] Allow choosing starting equipment mode (kit vs gold) and persist choice.
- [x] Validate selections against current pack definitions.

## Review and Export

- [x] Show summary of selections and derived stats (see `/ux/steps/08_review_export.md`).
- [x] Display provenance breakdown for derived values.
- [x] Implement JSON export aligned with the current normalized MVP contract in `/docs/sheet-spec.md`.

## Validation and Error Handling

- [ ] Integrate a dedicated validation banner component.
- [x] Use `validateState` from the engine to determine errors per step.
- [x] Block progression on known validation errors.

## Edge Cases

- [ ] Implement reset and invalidation handling (see `/ux/edge_cases/reset_and_invalidation.md`).
- [ ] Implement pack conflict detection and resolution (see `/ux/edge_cases/pack_conflicts.md`).

## Testing

- [x] Write unit tests for pack loader and engine behavior.
- [x] Create contract tests for the minimal SRD pack.
- [x] Add integration coverage for the wizard flow.
- [x] Run contracts in CI.

## TODO

- Maintain this checklist as the PRD evolves.
- Link remaining open items to GitHub issues or backlog docs.
- Mark tasks complete only when the repo contains the implementation and verification evidence.

## Checklist

- [x] Checklist drafted.
- [x] Tasks mapped to PRD requirements.
- [x] Links to documentation included.
- [ ] Checklist reviewed and updated during development.
