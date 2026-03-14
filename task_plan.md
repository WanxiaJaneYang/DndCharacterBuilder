# Task Plan

## Goal
Finish issue `#212` / PR `#213` by keeping the compute-native engine surface separate from the legacy wizard/runtime surface, closing review blockers, and leaving the MR ready to merge.

## Phases
- [completed] Boundary split from `packages/engine/src/index.ts` into `compute.ts`, `legacyRuntime.ts`, and focused `legacyRuntime*.ts` modules
- [completed] Red/green regression for `levelMin` constraints with `src/legacyRuntimeChoices.test.ts`
- [completed] Align issue-212 plan and Trellis task records with the actual worktree/PR state
- [pending] Run verification, commit/push the follow-up, resolve PR review threads, and re-poll checks/review state

## Key Decisions
- Keep `@dcb/engine` exporting compute-facing APIs from `packages/engine/src/public.ts`.
- Keep `@dcb/engine/legacy` as the only public wizard/state runtime surface.
- Enforce the repo limit of `<=200` lines for authored TypeScript modules by splitting legacy-runtime responsibilities into focused files instead of helper dumping.
- Limit scope to issue `#212` under `#162/#168`; do not pull `#160` or `#199` work into this MR.

## Risks
- Legacy constraint evaluation can drift from the shared progression helpers if duplicated instead of reused.
- The large pre-existing `packages/engine/src/engine.test.ts` file remains architecture debt outside this PR's boundary, so new coverage should stay in focused test files.
- PR readiness depends on both CI and unresolved GitHub review threads, not only local tests.

## Errors Encountered
- The generated Trellis task defaulted its base branch to the current feature branch and had to be corrected back to `main`.
