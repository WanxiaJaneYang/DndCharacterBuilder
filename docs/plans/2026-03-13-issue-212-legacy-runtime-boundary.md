# Issue 212 Legacy Runtime Boundary Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move legacy wizard/state runtime implementation behind an explicit internal legacy module while keeping the public compute contract and `@dcb/engine/legacy` behavior unchanged.

**Architecture:** Treat the current `packages/engine/src/index.ts` implementation as the source for a new `legacyRuntime.ts` module, move `compute()` into a dedicated `compute.ts` core module, and replace `index.ts` with a narrow internal barrel. This keeps the package surface stable while making the implementation boundary explicit.

**Tech Stack:** TypeScript, Vitest, npm workspaces

---

### Task 1: Add a failing boundary test

**Files:**
- Modify: `packages/engine/src/engine.test.ts`

**Step 1: Write the failing test**

Add a source-structure test that expects:
- `packages/engine/src/compute.ts` to exist and contain `export function compute`
- `packages/engine/src/legacyRuntime.ts` to exist and contain `export function listChoices`
- `packages/engine/src/public.ts` to export from `./compute`
- `packages/engine/src/legacy.ts` to export from `./legacyRuntime`

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/engine run test -- src/engine.test.ts -t "moves legacy wizard/state runtime behind a dedicated legacy module"`

Expected: FAIL because `compute.ts` / `legacyRuntime.ts` do not exist yet and the shims still point at `./index`.

### Task 2: Create the explicit internal boundary

**Files:**
- Create: `packages/engine/src/compute.ts`
- Create: `packages/engine/src/legacyRuntime.ts`
- Modify: `packages/engine/src/index.ts`
- Modify: `packages/engine/src/public.ts`
- Modify: `packages/engine/src/legacy.ts`

**Step 1: Move the current implementation module**

Move the existing `packages/engine/src/index.ts` implementation body into `packages/engine/src/legacyRuntime.ts`.

**Step 2: Create compute core module**

Implement `packages/engine/src/compute.ts` with:
- `COMPUTE_RESULT_SCHEMA_VERSION`
- compute-contract types
- `compute()`
- compute-only helpers such as `sanitizeStateForComputeOutput` and step-to-spec path mapping

Import `buildCharacterSheetFromState` and `collectValidationErrorsFromState` from `legacyRuntime.ts`.

**Step 3: Narrow the internal barrel**

Replace `packages/engine/src/index.ts` with a narrow barrel that re-exports:
- compute-facing symbols from `./compute`
- legacy/runtime symbols from `./legacyRuntime`
- CharacterSpec normalization/validation helpers from `./characterSpec`

**Step 4: Retarget package entrypoints**

Update:
- `packages/engine/src/public.ts` to export compute-facing symbols from `./compute`
- `packages/engine/src/legacy.ts` to export legacy runtime symbols from `./legacyRuntime`

### Task 3: Verify green and boundary safety

**Files:**
- Modify if needed: `packages/engine/src/engine.test.ts`

**Step 1: Run focused engine test**

Run: `npm --workspace @dcb/engine run test -- src/engine.test.ts`

Expected: PASS

**Step 2: Run engine typecheck**

Run: `npm --workspace @dcb/engine run typecheck`

Expected: PASS

**Step 3: Run repo typecheck**

Run: `npm run typecheck`

Expected: PASS

### Task 4: Sync task/workflow records

**Files:**
- Modify: `.trellis/tasks/03-13-03-13-issue-212-legacy-runtime-boundary/task.json`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`
- Modify: `.codex/mr-flow-and-approvals.md`

**Step 1: Record the task boundary**

Update task/planning files so they reflect:
- issue `#212`
- base commit `67ab5c4`
- scope staying on `#162/#168`

**Step 2: Harden merge gate wording**

Add an explicit unresolved-`reviewThreads` merge gate to `.codex/mr-flow-and-approvals.md`.
