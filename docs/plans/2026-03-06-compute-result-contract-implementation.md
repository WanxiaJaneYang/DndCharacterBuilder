# ComputeResult Contract Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the versioned `ComputeResult` contract and `compute()` bridge for issue #166 without regressing the CharacterSpec structure from issue #165.

**Architecture:** Keep input contract logic in `packages/engine/src/characterSpec.ts`. Add output contract types and `compute()` to `packages/engine/src/index.ts`, backed by the existing `validateState()` and `finalizeCharacter()` pipeline. Lock the public behavior with targeted engine tests and a contract doc.

**Tech Stack:** TypeScript, Vitest, npm workspaces, GitHub CLI.

---

### Task 1: Red test coverage for the output contract

**Files:**
- Modify: `packages/engine/src/engine.test.ts`

**Step 1: Write the failing tests**
Add a `describe("compute() contract")` block that imports `compute` and asserts:
- returned top-level and nested schema versions are `"0.1"`;
- canonical AC total is preserved for a known fixture;
- repeated calls with identical input return identical output;
- deterministic snapshot covers selected contract slices.

**Step 2: Run test to verify it fails**
Run: `npm --workspace @dcb/engine run test -- --runInBand`
Expected: FAIL because `compute` is not exported yet.

**Step 3: Commit**
Do not commit yet; continue once the test failure is confirmed.

### Task 2: Green implementation for exported contract and bridge

**Files:**
- Modify: `packages/engine/src/index.ts`
- Reuse: `packages/engine/src/characterSpec.ts`

**Step 1: Write minimal implementation**
Add:
- `ComputeResultValidationIssue`
- `ComputeResultUnresolvedEntry`
- `ComputeResultAssumptionEntry`
- `VersionedSheetViewModel`
- `ComputeResult`
- `RulepackInput`
- `compute(spec, rulepack)`

Implementation requirements:
- normalize via `normalizeCharacterSpec()`;
- validate with `validateCharacterSpec()` and map to `validationIssues`;
- bridge to legacy state via `characterSpecToState()`;
- call `validateState()` and `finalizeCharacter()`;
- map unresolved rules into the public `unresolved` contract;
- populate assumptions for normalization-driven class-level clamping.

**Step 2: Run engine tests to verify they pass**
Run: `npm --workspace @dcb/engine run test -- --runInBand`
Expected: PASS with the new contract tests included.

**Step 3: Refactor only if needed**
If code is repetitive, extract a local schema version constant and keep ordering explicit.

### Task 3: Documentation for the public contract

**Files:**
- Create: `docs/data/COMPUTE_RESULT_V1.md`
- Modify: `docs/data/README.md`

**Step 1: Write the contract doc**
Document exact fields, versioning, determinism, array ordering guarantees, and migration note linking the bridge implementation back to parent issue #159.

**Step 2: Add README entry**
Link the new doc from `docs/data/README.md` near the CharacterSpec contract.

**Step 3: Verify docs are ASCII and concise**
Run: `npm run check:contract-fixtures`
Expected: PASS or no relevant doc-related changes required.

### Task 4: Full verification and branch handoff

**Files:**
- Review only

**Step 1: Run focused verification**
Run:
- `npm --workspace @dcb/engine run test -- --runInBand`
- `npm test`
- `npm run typecheck`

**Step 2: Review diff**
Run: `git diff --stat` and `git diff -- packages/engine/src/index.ts packages/engine/src/engine.test.ts docs/data/COMPUTE_RESULT_V1.md docs/data/README.md`

**Step 3: Commit**
Run:
- `git add packages/engine/src/index.ts packages/engine/src/engine.test.ts docs/data/COMPUTE_RESULT_V1.md docs/data/README.md docs/plans/2026-03-06-compute-result-contract-design.md docs/plans/2026-03-06-compute-result-contract-implementation.md task_plan.md findings.md progress.md`
- `git commit -m "feat(engine): define compute result contract"`

**Step 4: Push and create MR**
Run:
- `git push -u origin feat/issue-166-compute-result-contract`
- `gh pr create --title "[P0] Define ComputeResult contract (issue #166)" --body-file <prepared-body-file>`
