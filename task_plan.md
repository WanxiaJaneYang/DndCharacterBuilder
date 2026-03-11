# Task Plan

## Goal

Restart the `#193/#195` web extraction so every authored `ts`/`tsx` module in the touched scope is at or under 200 lines, while moving the UI toward modular, extensible, config-friendly composition and reducing hardcoded rendering.

## Constraints

- Record the 200-line rule in PR/review standards.
- Treat the 200-line rule as a hard default for authored `ts`/`tsx` modules.
- Refactor the current branch in place instead of reopening from `main`.
- Keep modules split by responsibility, not arbitrary helper dumping.
- Preserve behavior and keep CI green.

## Phases

| Phase | Status | Notes |
| --- | --- | --- |
| Record the new standard in repo guidance | in_progress | Update MR flow + frontend component guidelines |
| Inventory oversized modules and decide ownership | pending | App, ReviewStep, appHelpers are currently oversized |
| Dispatch parallel agent team | pending | Use disjoint write scopes |
| Integrate worker changes and enforce <=200-line modules | pending | Rework until touched modules comply |
| Verify, review, and update PR state | pending | Tests, typecheck, visual, review loop |

## Ownership Plan

- Standards worker: `.codex/mr-flow-and-approvals.md`, `.trellis/spec/frontend/component-guidelines.md`
- Review worker: `apps/web/src/components/ReviewStep.tsx` and new review section components/tests
- App-shell worker: `apps/web/src/App.tsx` and any new app-shell composition modules
- Helper worker: `apps/web/src/appHelpers.ts`, `apps/web/src/wizardStepHelpers.ts`, plus new helper modules/tests

## Current Inventory

- `apps/web/src/App.tsx`: 1416 lines
- `apps/web/src/components/ReviewStep.tsx`: 580 lines
- `apps/web/src/appHelpers.ts`: 293 lines
- `apps/web/src/wizardStepHelpers.ts`: 98 lines

## Risks

- App-shell and review decomposition can overlap if ownership is not enforced.
- File-count can increase without real architecture improvement if splits are mechanical.
- Existing PR review state must be preserved while the branch is restarted.
