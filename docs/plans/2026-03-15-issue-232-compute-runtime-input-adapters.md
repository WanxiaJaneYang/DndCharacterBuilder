# Issue 232 Compute-Runtime Input Adapters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land the first honest child lane under `#205` by removing `CharacterState` materialization from the public `compute()` path while preserving the existing `ComputeResult` contract and legacy API compatibility.

**Architecture:** Introduce a generic `RuntimeRequest` / `RuntimeSelection` adapter boundary rather than a permanent D&D-shaped internal struct. Shared compute-path helpers should target that generic runtime model, while `CharacterSpec` and legacy `CharacterState` remain caller-facing/product-facing inputs that adapt into it.

**Tech Stack:** TypeScript, Vitest, `@dcb/engine`, Trellis task tracking, GitHub issue `#232`

---

### Task 1: Lock The Child-Lane Boundary With Failing Tests

**Files:**
- Modify: `packages/engine/src/computeContract.test.ts`
- Modify: `packages/engine/src/computeContractGoldenFixtures.test.ts`
- Test: `packages/engine/src/computeContract.test.ts`

**Step 1: Write the failing test**

Add or tighten tests so they prove the public compute path no longer imports or materializes `CharacterState`.

Expected assertions:
- `packages/engine/src/compute.ts` does not contain `CharacterState`
- `packages/engine/src/compute.ts` does not contain `buildComputeStateFromSpec(`
- `packages/engine/src/compute.ts` still exports `compute(`
- current canonical `ComputeResult` behavior stays locked

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/engine run test -- src/computeContract.test.ts`

Expected: FAIL because `compute.ts` still imports the state bridge today.

**Step 3: Write minimal implementation**

Do not change behavior yet. Only add the narrowest failing assertions that define the intended boundary.

**Step 4: Run test to verify it fails for the right reason**

Run: `npm --workspace @dcb/engine run test -- src/computeContract.test.ts`

Expected: FAIL specifically on the state-bridge assertions, not on unrelated fixture drift.

### Task 2: Introduce The Generic RuntimeRequest Model And Adapters

**Files:**
- Create: `packages/engine/src/computeRuntimeInput.ts`
- Modify: `packages/engine/src/compute.ts`
- Modify: `packages/engine/src/computeTypes.ts`
- Modify: `packages/engine/src/characterSpec.ts`
- Test: `packages/engine/src/computeContract.test.ts`

**Step 1: Write the failing test**

Add a focused test for the new adapter seam:
- `compute()` builds a compute-runtime input from normalized `CharacterSpec`
- legacy APIs still have an explicit adapter path from `CharacterState`

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/engine run test -- src/computeContract.test.ts`

Expected: FAIL because the runtime input module and adapter seam do not exist yet.

**Step 3: Write minimal implementation**

Implement:
- a generic `RuntimeRequest` model with:
  - generic scalar/attribute storage
  - `RuntimeSelection[]`
  - adapter-owned metadata only where needed for reporting/runtime execution
- a `RuntimeSelection` model that does not hardcode D&D-specific concepts like race/class/feat/equipment into engine core types
- one adapter from normalized `CharacterSpec`
- one adapter from legacy `CharacterState`
- indexing helpers needed so shared compute logic can consume runtime selections without depending on legacy state shape

Constraints:
- `compute.ts` must stop importing `CharacterState`
- `compute.ts` must stop importing `computeStateBridge.ts`
- legacy wrappers may keep using `CharacterState`, but only at the adapter edge
- do not replace the old state bridge with a new permanent internal struct that bakes in `raceId`, `classSelection`, `skillRanks`, `featIds`, and `equipmentIds`

**Step 4: Run test to verify it passes**

Run: `npm --workspace @dcb/engine run test -- src/computeContract.test.ts`

Expected: PASS on the new adapter-boundary assertions.

### Task 3: Route Shared Compute Helpers Through The Runtime Input

**Files:**
- Modify: `packages/engine/src/legacyRuntimeValidation.ts`
- Modify: `packages/engine/src/legacyRuntimeBuildCharacterSheet.ts`
- Modify: `packages/engine/src/legacyRuntimeSelectors.ts`
- Modify: `packages/engine/src/legacyRuntimeProgression.ts`
- Modify: `packages/engine/src/legacyRuntimeDecisions.ts`
- Modify: `packages/engine/src/legacyRuntimeRuleSurface.ts`
- Modify: `packages/engine/src/legacyRuntimeSelectedEntities.ts`
- Modify: `packages/engine/src/legacyRuntimeRaceData.ts`
- Modify: `packages/engine/src/legacyRuntimeSkillBonusMaps.ts`
- Modify: `packages/engine/src/legacyRuntimeTypes.ts`
- Test: `packages/engine/src/computeContract.test.ts`
- Test: `packages/engine/src/computeContractGoldenFixtures.test.ts`
- Test: `packages/engine/src/engineDeterminismCore.test.ts`

**Step 1: Write the failing test**

Add or tighten tests so the shared compute path now consumes the runtime input rather than state-shaped selectors.

Minimum proof:
- `compute()` no longer calls `collectValidationErrorsFromState()`
- `compute()` no longer calls `buildCharacterSheetFromState()`
- canonical/golden fixtures still pass unchanged

**Step 2: Run test to verify it fails**

Run:
- `npm --workspace @dcb/engine run test -- src/computeContract.test.ts`
- `npm --workspace @dcb/engine run test -- src/computeContractGoldenFixtures.test.ts`

Expected: FAIL because the shared helper entrypoints are still state-named and state-shaped.

**Step 3: Write minimal implementation**

Refactor the shared compute path:
- add adapter-neutral entrypoints such as `collectValidationErrorsForRuntimeInput()` and `buildCharacterSheetForRuntimeInput()`
- update compute-path selectors/progression/decision helpers to read from generic runtime selections and indexes rather than from `CharacterState`
- keep legacy exported wrappers by adapting `CharacterState` into the runtime input before calling the shared implementation

Constraints:
- do not try to remove flow-step-derived selection limit semantics in this task
- do not change the public `ComputeResult` shape
- do not widen into `#199`
- do not couple the runtime model to one ruleset's selection taxonomy

**Step 4: Run test to verify it passes**

Run:
- `npm --workspace @dcb/engine run test -- src/computeContract.test.ts src/computeContractGoldenFixtures.test.ts src/engineDeterminismCore.test.ts`

Expected: PASS with unchanged canonical outputs.

### Task 4: Re-verify Legacy Compatibility And Document Remaining `#205` Scope

**Files:**
- Modify: `packages/engine/src/legacyRuntimeChoices.test.ts`
- Modify: `packages/engine/src/characterSpec.test.ts`
- Modify: `docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md`
- Optional: `docs/data/COMPUTE_RESULT_V1.md`

**Step 1: Write the failing test**

Add or tighten compatibility coverage:
- legacy `validateState()` and `finalizeCharacter()` still behave the same via adapters
- `characterSpec` tests still cover the temporary compatibility mapping separately from the public compute path

**Step 2: Run test to verify it fails**

Run:
- `npm --workspace @dcb/engine run test -- src/legacyRuntimeChoices.test.ts src/characterSpec.test.ts`

Expected: FAIL only if the adapter path or assumptions drifted during the refactor.

**Step 3: Write minimal implementation**

Repair any compatibility gaps without reintroducing public compute-path dependence on `CharacterState`.

Then update this plan doc with a short completion note stating what still remains open on parent issue `#205`:
- flow-step-derived validation semantics still need a later child issue
- `#199` remains explicitly out of scope
- the longer-term capability architecture is approved separately under `#233`

**Step 4: Run tests to verify they pass**

Run:
- `npm --workspace @dcb/engine run test -- src/legacyRuntimeChoices.test.ts src/characterSpec.test.ts`

Expected: PASS.

### Task 5: Full Lane Verification

**Files:**
- No new files expected

**Step 1: Run the focused engine suite**

Run:
- `npm --workspace @dcb/engine run test -- src/computeContract.test.ts src/computeContractGoldenFixtures.test.ts src/engineDeterminismCore.test.ts src/legacyRuntimeChoices.test.ts src/characterSpec.test.ts`

Expected: PASS.

**Step 2: Run the broader engine package suite**

Run:
- `npm --workspace @dcb/engine run test`

Expected: PASS.

**Step 3: Run typecheck**

Run:
- `npm --workspace @dcb/engine run typecheck`

Expected: PASS.

**Step 4: Record remaining blocker**

Before PR creation, confirm the MR description and issue updates say exactly this:
- `#232` removes public compute-path `CharacterState` materialization by introducing generic `RuntimeRequest` adapters
- `#205` remains open until compute-path flow-step validation semantics are removed in a follow-up child

## Architecture Follow-on

The design-only child under `#199` is `#233`. It should approve:
- generic runtime request
- ruleset-owned selection schemas
- capability-owned pack data
- fact / derived model
- deterministic ordering
- migration rule: capabilities target `RuntimeRequest`, never `CharacterState`
- engine execution over compiled runtime bundles rather than raw authored entity fields

The contributor-facing contract for those approved runtime boundaries should be maintained in `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md` once the schema-level contract lands.

The downstream compiler lane is now explicit:
- `#234` pack compiler parent
- `#235` compiler scaffold
- `#236` runtime selection-schema compilation

Execution policy reminder:
- `#232` is still the active code lane for the runtime request boundary
- compiler work should proceed on the long-lived migration branch/worktree line, not as an excuse to widen `#232`

The first intended implementation child under `#199` after the ADR is approved is `cap:skills-core`.

**Step 5: Commit**

```bash
git add packages/engine/src docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md
git commit -m "refactor(engine): add compute-runtime input adapters"
```
