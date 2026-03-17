# Issue 233 Engine Capability Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Codify the approved issue #233 engine architecture as schema-level contracts and documentation without widening current engine execution work beyond the existing `#232` boundary.

**Architecture:** Keep runtime-boundary code work separate from architecture-contract work. Add explicit schema contracts for `BundleStatement`, intent-driven `RuntimeRequest`, `ConditionExpr`, `InvokeSpec`, and `ConstraintSpec` in `@dcb/schema`, document the event-driven fixed-point propagation boundary in `docs/data/`, and keep engine execution changes blocked behind the approved issue chain `#232 -> #233 -> #235 -> #236 -> #122`.

**Tech Stack:** TypeScript, Zod, Vitest, npm workspaces, Markdown docs

---

### Task 1: Lock the bundle/request boundary with failing schema tests

**Files:**
- Modify: `packages/schema/src/schema.test.ts`

**Step 1: Write the failing tests**

Add a focused `describe("engine runtime architecture contracts")` block that asserts:
- bundle statements accept only `invoke`, `grant`, and `constraint`
- bundle statements reject request-side instructions such as `selection` and `acquire`
- runtime requests accept intent records rather than bucketed snapshot fields
- runtime requests reject direct `fact:*` injection in request input identifiers

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/schema run test -- src/schema.test.ts`
Expected: FAIL because the runtime architecture schemas do not exist yet.

**Step 3: Do not implement yet**

Leave the tests failing until the new schema module is added.

### Task 2: Add schema contracts for bundle statements and runtime requests

**Files:**
- Create: `packages/schema/src/engineRuntime.ts`
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/schema.test.ts`

**Step 1: Write minimal implementation**

Add Zod schemas and exported types for:
- `BundleStatementSchema`
- `RuntimeRequestSchema`
- `RuntimeIntentSchema`
- `RuntimeSelectionSchema`
- `RuntimeInputSchema`
- `AcquireIntentSchema`

Implementation requirements:
- bundle statements must not include request-side kinds
- request input IDs must use `input:*` rather than `fact:*`
- request selections and acquire intents must have stable identifier formats
- exported types must round-trip from the schemas

**Step 2: Run tests to verify they pass**

Run: `npm --workspace @dcb/schema run test -- src/schema.test.ts`
Expected: PASS on the new boundary tests.

**Step 3: Run typecheck**

Run: `npm --workspace @dcb/schema run typecheck`
Expected: PASS.

### Task 3: Add shared condition DSL and typed registry specs

**Files:**
- Modify: `packages/schema/src/engineRuntime.ts`
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/schema.test.ts`

**Step 1: Write the failing tests**

Add tests that assert:
- `ConditionExpr` supports typed operands such as constants, selection metrics, published facts, and resource amounts
- bare `min-level` style condition nodes are rejected
- invoke specs and constraint specs are validated as separate first-class registry entries
- constraint specs reject write-capable fields that belong only to invoke specs

**Step 2: Run tests to verify they fail**

Run: `npm --workspace @dcb/schema run test -- src/schema.test.ts`
Expected: FAIL because the condition DSL and registry spec schemas are still incomplete.

**Step 3: Write minimal implementation**

Extend `engineRuntime.ts` with:
- `ConditionExprSchema`
- typed operand schemas
- `InvokeSpecSchema`
- `ConstraintSpecSchema`
- shared identifier schemas for facts, inputs, entities, and resources where needed

Constraints:
- `ConstraintSpec` is registry-owned but must not allow generic runtime writes
- `InvokeSpec` must carry phase and idempotence metadata plus propagation surface declarations
- no engine execution behavior changes in this task

**Step 4: Run tests and typecheck**

Run:
- `npm --workspace @dcb/schema run test -- src/schema.test.ts`
- `npm --workspace @dcb/schema run typecheck`

Expected: PASS.

### Task 4: Document the approved runtime architecture contract

**Files:**
- Create: `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- Modify: `docs/data/README.md`
- Modify: `docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md`

**Step 1: Write the contract doc**

Document:
- authored source vs normalized IR vs compiled bundle vs runtime request
- bundle statement kinds
- request-side identifier namespaces
- typed registry split between invoke and constraint specs
- shared condition DSL rules
- fixed-point execution invariants
- imported-state restrictions

**Step 2: Link the contract doc**

Add the new architecture contract to `docs/data/README.md` near the existing public data contracts.

**Step 3: Verify docs remain concise and ASCII-safe**

Run: `npm run check:contract-fixtures`
Expected: PASS.

### Task 5: Cross-check repo alignment and handoff

**Files:**
- Modify: `docs/plans/2026-03-15-pack-compiler-migration-architecture.md`
- Modify: `docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md`
- Review only: `docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md`

**Step 1: Add short alignment notes**

Update the existing architecture docs so they reference the newly codified runtime contract and continue to enforce:
- `#232` owns the public `RuntimeRequest` adapter boundary
- `#233` owns architecture approval
- `#235/#236` own compiler scaffold and selection-schema compilation
- `#122` is the first native vertical slice

**Step 2: Run focused verification**

Run:
- `npm --workspace @dcb/schema run test -- src/schema.test.ts`
- `npm --workspace @dcb/schema run typecheck`

Expected: PASS.

**Step 3: Review the diff**

Run:
- `git diff --stat`
- `git diff -- packages/schema/src/engineRuntime.ts packages/schema/src/index.ts packages/schema/src/schema.test.ts docs/data/ENGINE_RUNTIME_ARCHITECTURE.md docs/data/README.md docs/plans/2026-03-15-pack-compiler-migration-architecture.md docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md`

**Step 4: Commit**

Run:
- `git add packages/schema/src/engineRuntime.ts packages/schema/src/index.ts packages/schema/src/schema.test.ts docs/data/ENGINE_RUNTIME_ARCHITECTURE.md docs/data/README.md docs/plans/2026-03-15-pack-compiler-migration-architecture.md docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md`
- `git commit -m "docs(schema): codify engine capability architecture contracts"`
