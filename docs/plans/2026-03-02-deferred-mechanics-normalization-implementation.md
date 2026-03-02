# Deferred Mechanics Normalization Implementation Plan

**Goal:** Normalize deferred mechanics metadata from legacy engine-oriented `impactPaths` plus ad hoc dependency labels to stable `impacts` concept IDs and validated capability IDs across schema, tests, docs, and SRD pack data.

**Architecture:** Keep normalization centered in `@dcb/schema` so pack validation fails early and consistently for all consumers. Introduce one canonical capability registry plus shared ID validators, then migrate race/class/feat pack data and the documentation/test fixtures to the new contract without changing engine behavior or CharacterSheet output.

**Tech Stack:** TypeScript, Zod, Vitest, npm workspaces, JSON pack data, markdown docs.

---

## Scope And PR Boundary

- This plan is the deliverable for issue `#62`.
- The implementation PR for issue `#60` should stay scoped to schema validation, pack data migration, and supporting docs/tests.
- CharacterSheet already exposes unresolved rules via the follow-on work completed for issue `#63`; issue `#60` should only normalize and validate deferred-mechanics metadata so that output remains consistent.
- Prefer one implementation PR for `#60` with small reviewable commits inside the branch.

## Verification Commands

- Targeted schema test: `npm --workspace @dcb/schema test -- src/schema.test.ts`
- Targeted datapack test: `npm --workspace @dcb/datapack test -- src/datapack.test.ts`
- Full repo verification: `npm test`
- Full lint: `npm run lint`
- Full typecheck: `npm run typecheck`

## Task 1: Add Canonical Deferred-Mechanics Validation Helpers

**Files:**
- Create: `packages/schema/src/deferredMechanics.ts`
- Modify: `packages/schema/src/index.ts`
- Test: `packages/schema/src/schema.test.ts`
- Doc: `docs/data/DEFERRED_MECHANICS_VOCABULARY.md`

**Step 1: Write the failing tests**

Add schema tests that:
- accept `dependsOn` values using the documented `cap:*` format only when they exist in the canonical registry
- accept `impacts` values using colon-delimited concept IDs
- reject legacy-style `dependsOn` labels such as `alignment-validation-engine`
- reject malformed concept IDs and unknown capability IDs

**Step 2: Run the targeted schema test to verify it fails**

Run: `npm --workspace @dcb/schema test -- packages/schema/src/schema.test.ts`
Expected: FAIL because schema still accepts arbitrary strings for `dependsOn` and only knows `impactPaths`.

**Step 3: Write the minimal implementation**

Create `packages/schema/src/deferredMechanics.ts` with:
- a canonical `DEFERRED_MECHANIC_CAPABILITIES` registry that is defined in schema code and mirrored by `docs/data/DEFERRED_MECHANICS_VOCABULARY.md`
- a Zod schema for capability IDs that checks both `cap:` format and membership in the registry
- a Zod schema for rule concept IDs using the documented colon-delimited kebab-case format
- a shared deferred-mechanic object schema using `dependsOn` plus `impacts`

Update `packages/schema/src/index.ts` to import and reuse the shared deferred-mechanic schema for race, class, and feat data.

**Step 4: Run the targeted schema test to verify it passes**

Run: `npm --workspace @dcb/schema test -- src/schema.test.ts`
Expected: PASS for the new validator cases.

**Step 5: Commit**

```bash
git add packages/schema/src/deferredMechanics.ts packages/schema/src/index.ts packages/schema/src/schema.test.ts docs/data/DEFERRED_MECHANICS_VOCABULARY.md
git commit -m "feat: add deferred mechanics capability validation"
```

## Task 2: Migrate Schema Fixtures From `impactPaths` To `impacts`

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/schema.test.ts`

**Step 1: Write the failing tests**

Update the existing race/class/feat deferred-mechanics fixture tests so they:
- use `cap:*` dependency IDs
- use `impacts` instead of `impactPaths`
- assert that legacy `impactPaths` payloads are rejected

Add at least one test per entity type proving the normalized shape parses and one regression asserting the legacy field no longer satisfies the schema.

**Step 2: Run the targeted schema test to verify it fails**

Run: `npm --workspace @dcb/schema test -- src/schema.test.ts`
Expected: FAIL because current schema/examples still rely on `impactPaths`.

**Step 3: Write the minimal implementation**

Update the shared deferred-mechanic schema so:
- `impacts` is the supported affected-concepts field
- `impactPaths` is removed from the accepted object shape
- race, class, and feat schemas all consume the same normalized field contract

Keep the change narrow: no engine or UI behavior updates in this task.

**Step 4: Run the targeted schema test to verify it passes**

Run: `npm --workspace @dcb/schema test -- packages/schema/src/schema.test.ts`
Expected: PASS with normalized fixture data and legacy-field rejection coverage.

**Step 5: Commit**

```bash
git add packages/schema/src/index.ts packages/schema/src/schema.test.ts
git commit -m "feat: normalize deferred mechanics schema fields"
```

## Task 3: Migrate SRD Pack Data To Capability IDs And Concept IDs

**Files:**
- Modify: `packs/srd-35e-minimal/entities/races.json`
- Modify: `packs/srd-35e-minimal/entities/classes.json`
- Modify: `packs/srd-35e-minimal/entities/feats.json`
- Test: `packages/datapack/src/datapack.test.ts`

**Step 1: Write the failing datapack tests**

Extend datapack coverage to assert representative normalized entries after pack load, for example:
- a race deferred mechanic exposes `dependsOn: ["cap:..."]`
- a class deferred mechanic exposes `impacts: ["alignment:restriction"]`
- a feat deferred mechanic exposes migrated ranged/combat concept IDs

Use representative samples only; do not snapshot the full feat catalog.

**Step 2: Run the targeted datapack test to verify it fails**

Run: `npm --workspace @dcb/datapack test -- src/datapack.test.ts`
Expected: FAIL because pack JSON still uses legacy dependency labels and `impactPaths`.

**Step 3: Write the minimal implementation**

Migrate every deferred-mechanics entry in the SRD pack JSON files:
- replace legacy dependency names with approved capability IDs from the new registry
- replace `impactPaths` arrays with domain `impacts` arrays
- keep IDs, descriptions, and source references stable unless they must change for correctness

When a numeric modifier is already modeled elsewhere, preserve that existing effect modeling and use `impacts` only as backlog metadata.

**Step 4: Run the targeted datapack test to verify it passes**

Run: `npm --workspace @dcb/datapack test -- src/datapack.test.ts`
Expected: PASS with normalized representative assertions.

**Step 5: Commit**

```bash
git add packs/srd-35e-minimal/entities/races.json packs/srd-35e-minimal/entities/classes.json packs/srd-35e-minimal/entities/feats.json packages/datapack/src/datapack.test.ts
git commit -m "feat: migrate deferred mechanics pack metadata"
```

## Task 4: Update Documentation To Match The Enforced Contract

**Files:**
- Modify: `docs/data/ENTITY_SCHEMA.md`
- Modify: `docs/data/DEFERRED_MECHANICS_VOCABULARY.md`
- Modify: `docs/engineering/WORK_PLAN.md`

**Step 1: Write the failing documentation checklist**

Create a short checklist in the PR description or scratch notes that verifies docs no longer describe `impactPaths` as a live schema field and that the capability registry location is documented.

**Step 2: Run the docs consistency check manually**

Run: `rg -n "impactPaths|dependsOn|impacts" docs/data docs/engineering`
Expected: remaining `impactPaths` references are clearly marked as legacy history, not current schema guidance.

**Step 3: Write the minimal implementation**

Update docs so they:
- point schema readers at the canonical registry file location
- document `impacts` as the supported field
- describe `impactPaths` only as retired legacy vocabulary
- note in `WORK_PLAN.md` that deferred-mechanics normalization is implemented or completed

**Step 4: Re-run the docs consistency check**

Run: `rg -n "impactPaths|dependsOn|impacts" docs/data docs/engineering`
Expected: docs match the enforced schema contract and migration status.

**Step 5: Commit**

```bash
git add docs/data/ENTITY_SCHEMA.md docs/data/DEFERRED_MECHANICS_VOCABULARY.md docs/engineering/WORK_PLAN.md
git commit -m "docs: align deferred mechanics normalization references"
```

## Task 5: Run Full Verification And Prepare The Implementation PR

**Files:**
- Verify only: repository-wide checks

**Step 1: Run focused package tests**

Run:
- `npm --workspace @dcb/schema test -- src/schema.test.ts`
- `npm --workspace @dcb/datapack test -- src/datapack.test.ts`

Expected: PASS for both targeted suites.

**Step 2: Run full repository verification**

Run:
- `npm test`
- `npm run lint`
- `npm run typecheck`

Expected: PASS with zero test failures, lint errors, or type errors.

**Step 3: Review diff against issue scope**

Confirm the diff is limited to:
- `packages/schema`
- `packages/datapack` tests
- `packs/srd-35e-minimal/entities/*`
- relevant docs

Confirm there are no engine/output changes that belong to issue `#63`.

**Step 4: Create the PR**

Use:

```bash
gh pr create --base main --head feature/60/implementation --title "feat: normalize deferred mechanics metadata" --body "<body including Closes #60>"
```

PR body checklist:
- `Closes #60`
- summarizes schema validation changes
- summarizes pack-data migration coverage
- lists verification commands and results
- explicitly says CharacterSheet `unresolvedRules` remains deferred to `#63`

**Step 5: Stay for review**

After each push:
- run `gh pr checks <pr-number>` until checks settle
- inspect `gh pr view <pr-number> --json reviewDecision,comments,reviews`
- address comments before merging

Merge only after CI passes and review requirements are satisfied under `.codex/mr-flow-and-approvals.md`.
