# Findings

## Repository state
- Root workspace is dirty with uncommitted draft work related to issues #165/#166; implementation is isolated in `.worktrees/issue-166-compute-result-contract`.
- `origin/main` at `2a73261` already includes issue #165 via PR #170.

## Relevant files
- `packages/engine/src/characterSpec.ts`: owns `CharacterSpec`, normalization, validation, and temporary legacy state mapping.
- `packages/engine/src/index.ts`: owns `SheetViewModel`, engine internals, and is the right place for output contract types and `compute()`.
- `packages/engine/src/engine.test.ts`: already has CharacterSpec coverage from #165 and is the right place for compute contract tests.
- `docs/data/README.md`: lists data contract docs.

## Draft assessment
- Reusable: compute contract shape, basic canonical fixture test idea, initial ComputeResult doc draft.
- Not reusable verbatim: inlining CharacterSpec types back into `index.ts`, replacing existing #165 tests, weak ordering guarantees in docs.

## Baseline verification
- `npm install` succeeded in worktree.
- `npm test` passed in worktree before any issue #166 changes.
