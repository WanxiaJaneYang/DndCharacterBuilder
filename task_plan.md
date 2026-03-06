# Task Plan

## Goal
Implement issue #166 on a clean worktree by defining the public `ComputeResult` output contract, versioned `SheetViewModel` wrapper, explicit stability/ordering guarantees, tests, docs, and an MR.

## Phases
- [in_progress] Design and planning docs
- [pending] Red: add failing compute() contract tests
- [pending] Green: implement exported output contract + `compute()` bridge
- [pending] Docs: add ComputeResult contract doc and data README entry
- [pending] Verify: run relevant test/type/build commands
- [pending] Git: commit, push, create MR

## Key Decisions
- Keep `CharacterSpec` ownership in `packages/engine/src/characterSpec.ts` from issue #165.
- Add `ComputeResult`/`VersionedSheetViewModel`/`RulepackInput` in `packages/engine/src/index.ts` because they depend on `SheetViewModel` and engine internals.
- Use the uncommitted draft only as reference; do not transplant its structural regressions.
- Document array ordering guarantees explicitly; do not promise object key enumeration order.

## Risks
- `compute()` can accidentally normalize away validation scenarios if it only inspects normalized values.
- Contract tests must extend existing #165 coverage instead of replacing it.
- The bridge must stay deterministic and not mutate `CharacterSpec` input.

## Errors Encountered
- None yet.
