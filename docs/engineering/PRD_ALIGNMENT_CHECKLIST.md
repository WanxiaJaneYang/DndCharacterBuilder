# PRD Alignment Checklist

This checklist maps high‑level requirements from the Product Requirements Document (PRD) to engineering tasks.  It helps ensure that all core product features are implemented and verified.  Each line links to the relevant documentation or code module.

## Version & Source Selection

- [ ] Implement Rules Setup step for selecting edition and packs (see `/ux/steps/00_rules_setup.md`).
- [ ] Display available packs and lock the base SRD pack (see `/product/DECISIONS.md`).
- [ ] Validate selection and build context for engine (engine & UI).

## Race Selection

- [ ] Render races as cards with summary and image (see `/ux/steps/01_race_selection.md`).
- [ ] Load race data from packs; no hardcoded values.
- [ ] Enforce selection of exactly one race and show details modal.

## Class Selection

- [ ] Similar card UI for classes (see `/ux/steps/02_class_selection.md`).
- [ ] Enforce exactly one class selection; handle class prerequisites.

## Ability Scores

- [ ] Read method from flow (manual or point buy; see `/ux/steps/03_ability_scores.md`).
- [ ] Implement point‑buy logic (32 points for MVP) and validation.
- [ ] Show ability modifiers and update engine state.

## Feats

- [ ] Display feats with summary and details (see `/ux/steps/04_feats.md`).
- [ ] Enforce prerequisites and limit number of feats (1 for MVP).
- [ ] Update engine state and provenance.

## Skills

- [ ] Add skills step to flow and implement SkillAllocator component (see `/ux/steps/05_skills.md` and `/ui/components/SkillAllocator.md`).
- [ ] Enforce budget and max ranks for level 1.
- [ ] Save allocations in engine state.

## Equipment

- [ ] Provide equipment selection page (see `/ux/steps/06_equipment.md`).
- [ ] Allow choosing starting equipment mode (kit vs gold) and persist choice.
- [ ] Validate selections against pack definitions and budget.

## Review & Export

- [ ] Show summary of all selections and derived stats (see `/ux/steps/07_review_export.md`).
- [ ] Display provenance breakdown for derived values.
- [ ] Implement JSON export conforming to `/data/EXPORT_SCHEMA.md`.

## Validation & Error Handling

- [ ] Integrate `ValidationBanner` component (see `/ui/components/ValidationBanner.md`).
- [ ] Use `validateState` from the engine to determine errors per step.
- [ ] Block progression on errors and guide user to fix them.

## Edge Cases

- [ ] Implement reset and invalidation handling (see `/ux/edge_cases/reset_and_invalidation.md`).
- [ ] Implement pack conflict detection and resolution (see `/ux/edge_cases/pack_conflicts.md`).

## Testing

- [ ] Write unit tests for each engine module and pack loader.
- [ ] Create contract tests for minimal SRD pack.
- [ ] Add integration tests for the wizard flow (optional for MVP).

## TODO

- Maintain this checklist as the PRD evolves.
- Link tasks to GitHub issues or user stories where appropriate.
- Mark tasks complete when implemented and tested.

## Checklist

- [ ] Checklist drafted.
- [ ] Tasks mapped to PRD requirements.
- [ ] Links to documentation included.
- [ ] Checklist reviewed and updated during development.