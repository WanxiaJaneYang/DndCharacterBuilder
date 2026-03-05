# Pack Reference Integrity Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add referential-integrity validation for pack entity references so CI fails with file/path diagnostics when IDs are missing.

**Architecture:** Implement a new contracts-layer module (`references.ts`) that loads pack entity JSON files, indexes IDs by entity type, and evaluates a curated list of reference extraction rules. Integrate the validator into `runContracts` for fail-fast behavior. Keep scope to explicit references already modeled in schema.

**Tech Stack:** TypeScript, Vitest, Node fs/path, existing `@dcb/contracts` package.

---

### Task 1: Add failing tests for missing references

**Files:**
- Modify: `packages/contracts/src/contracts.test.ts`

**Step 1: Write the failing test**
- Add a test that copies `packs/srd-35e-minimal` to a temp directory.
- Corrupt one known reference in `entities/races.json` (`favoredClass` to a missing class id).
- Assert `runContracts(tempRoot)` throws with `Pack reference integrity` and includes file/path/missing id text.

**Step 2: Run test to verify it fails**
Run: `npm --workspace @dcb/contracts run test -- contracts.test.ts`
Expected: FAIL because no referential-integrity check exists yet.

### Task 2: Implement referential-integrity validator

**Files:**
- Create: `packages/contracts/src/references.ts`
- Modify: `packages/contracts/src/index.ts`

**Step 1: Write minimal implementation**
- Add `assertPackReferenceIntegrity(packsRoot: string)`.
- Load each pack directory + entity files.
- Build pack-closure ID indexes by entity type (pack + declared dependencies), not global cross-pack indexes.
- Add initial curated rule:
  - races.data.favoredClass -> classes (`\"any\"` sentinel excluded)
- Collect missing references and throw one consolidated error.

**Step 2: Run targeted tests**
Run: `npm --workspace @dcb/contracts run test -- contracts.test.ts`
Expected: PASS including new test.

### Task 3: Verify broader contracts package behavior

**Files:**
- No additional file changes expected

**Step 1: Run full package tests**
Run: `npm --workspace @dcb/contracts run test`
Expected: PASS.

**Step 2: Run top-level contract script**
Run: `npm run contracts`
Expected: PASS.

### Task 4: Update planning docs if needed

**Files:**
- Optional Modify: `docs/engineering/WORK_PLAN.md`

**Step 1: Decide whether to add a progress bullet**
- If keeping progress log current in this branch, add one concise bullet under Recent Progress.
- If not, skip to keep issue-focused diff minimal.

### Task 5: Final verification and summary

**Files:**
- No additional file changes

**Step 1: Run status and summarize**
Run: `git status --short --branch`
Expected: only intended files changed.

**Step 2: Prepare completion note**
- Include what changed, exact validation commands executed, and remaining extension points.
