# Issue 63 Unresolved Rules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add deterministic `unresolvedRules` output to final character sheets and cover it with engine and contract tests.

**Architecture:** Extend engine finalization to collect deferred mechanics from selected entities, normalize them into a stable output record, and return the array on `CharacterSheet`. Keep the output field domain-oriented (`impacts`) while accepting current `impactPaths` data as input compatibility.

**Tech Stack:** TypeScript, Vitest, npm workspaces

---

### Task 1: Add failing engine test

**Files:**
- Modify: `packages/engine/src/engine.test.ts`

**Step 1: Write the failing test**

Add a test that selects entities with known `deferredMechanics` and expects `finalizeCharacter(...).unresolvedRules` to include deterministic entries with provenance.

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/engine run test -- --runInBand`

Expected: FAIL because `unresolvedRules` does not exist yet.

### Task 2: Add failing contract fixture

**Files:**
- Create: `packs/srd-35e-minimal/contracts/unresolved-rules.json`

**Step 1: Write the failing fixture**

Create a fixture that selects a known race/feat with deferred mechanics and expects `finalSheetSubset.unresolvedRules` to include at least one entry.

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/contracts run test -- --runInBand`

Expected: FAIL because the final sheet has no `unresolvedRules`.

### Task 3: Implement engine support

**Files:**
- Modify: `packages/engine/src/index.ts`

**Step 1: Add output types and helpers**

Define `UnresolvedRule` and parse deferred mechanics from selected entities.

**Step 2: Return normalized output**

Map current `impactPaths` or future `impacts` to output `impacts`, include provenance, derive stable IDs, sort deterministically, and include the array in `CharacterSheet`.

**Step 3: Run targeted tests**

Run:
- `npm --workspace @dcb/engine run test -- --runInBand`
- `npm --workspace @dcb/contracts run test -- --runInBand`

Expected: PASS

### Task 4: Verify workspace and deliver

**Files:**
- Modify: `packages/engine/src/index.ts`
- Modify: `packages/engine/src/engine.test.ts`
- Create: `packs/srd-35e-minimal/contracts/unresolved-rules.json`

**Step 1: Run full verification**

Run:
- `npm test`
- `npm run lint`

**Step 2: Commit**

Run:
- `git add docs/plans/2026-03-02-issue-63-unresolved-rules-design.md docs/plans/2026-03-02-issue-63-unresolved-rules-implementation.md packages/engine/src/index.ts packages/engine/src/engine.test.ts packs/srd-35e-minimal/contracts/unresolved-rules.json`
- `git commit -m "feat: expose unresolved rules in character sheets"`
