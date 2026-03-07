# ComputeResult Contract Design

**Date:** 2026-03-06
**Issue:** #166
**Parent:** #159

## Goal
Define the public output contract for `compute(spec, rulepack)` so later engine and UI work can depend on a stable, versioned result shape instead of wizard-driven engine internals.

## Recommended approach
Add the output contract in `packages/engine/src/index.ts` and keep `CharacterSpec` in `packages/engine/src/characterSpec.ts` from issue #165. Introduce a minimal bridge implementation of `compute()` that normalizes `CharacterSpec`, maps it into the existing legacy `CharacterState`, runs existing validation/finalization, and returns a versioned `ComputeResult`.

This keeps the public API stable now while deferring the deeper engine refactor from parent issue #159.

## Alternatives considered
1. Re-inline `CharacterSpec` and related types into `index.ts`.
Rejected because `origin/main` already split that concern into `characterSpec.ts` in issue #165.

2. Document the contract without exporting a runtime `compute()` bridge.
Rejected because issue #166 needs exact fields and concrete stability guarantees, which are better enforced by tests on a real exported API.

3. Delay versioning until the full compute pipeline refactor.
Rejected because the parent issue explicitly requires a versioned output contract now.

## Contract shape
`ComputeResult` will contain:
- `schemaVersion: string`
- `sheetViewModel: { schemaVersion: string; data: SheetViewModel }`
- `validationIssues: Array<{ code; severity; message; path?; relatedIds? }>`
- `unresolved: Array<{ code; message; path?; relatedIds?; suggestedNext? }>`
- `assumptions: Array<{ code; message; path?; defaultUsed }>`
- `provenance?: ProvenanceRecord[]`

## Stability guarantees
- `schemaVersion` and `sheetViewModel.schemaVersion` will both be emitted for every successful `compute()` call.
- For identical `CharacterSpec` and `RulepackInput`, `compute()` must return deeply equal output.
- Arrays are ordered deterministically:
  - `validationIssues`: CharacterSpec issues first in validation function order, then engine validation issues in `validateState()` order.
  - `unresolved`: preserves `sheet.unresolvedRules` order from engine finalization.
  - `sheetViewModel.data.combat.attacks` and `sheetViewModel.data.skills`: preserve existing `buildSheetViewModel()` ordering.
- Consumers may rely on field presence and array ordering, but not on object key enumeration order.

## Error handling
- CharacterSpec validation errors surface through `validationIssues` with `severity: "error"`.
- Engine validation issues are appended to the same channel.
- Normalization-driven defaults that change meaning, such as invalid class level being clamped to `1`, surface through `assumptions`.
- Unsupported or incomplete mechanics continue to surface through `unresolved`.

## Testing
Add engine tests that:
- assert the versioned `ComputeResult` shape for a canonical human fighter fixture;
- assert deterministic repeated output for the same spec and rulepack;
- preserve the existing CharacterSpec normalization/validation coverage from issue #165.

## Documentation
Add `docs/data/COMPUTE_RESULT_V1.md` and link it from `docs/data/README.md`.
