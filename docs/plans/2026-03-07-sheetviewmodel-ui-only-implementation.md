# SheetViewModel-Only UI Integration Implementation Plan

> **Implementation checklist:** Work through the tasks in this document step-by-step, running the indicated commands and tests at each stage.

**Goal:** Cut the web UI over to `compute(spec, rulepack)` for sheet/review totals so React stops deriving those totals from the legacy `CharacterSheet` shape.

**Architecture:** Keep the wizard state and flow runner unchanged. Add a small adapter in the web app that converts the current `CharacterState` + edition metadata into `CharacterSpec`, then call `compute()` in `App.tsx`. Migrate total-bearing review and skills UI reads to `ComputeResult.sheetViewModel`, while treating any missing engine-output fields as a separate issue instead of widening `#167`.

**Tech Stack:** React, TypeScript, Vitest, npm workspaces, GitHub CLI.

---

### Task 1: Add failing tests for the new UI-engine integration boundary

**Files:**
- Create: `apps/web/src/characterSpecFromState.test.ts`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing adapter test**

Add a new unit test file for a helper named `characterSpecFromState` that asserts:

- `meta.name` comes from `state.metadata.name`
- `meta.rulesetId` comes from the selected edition id
- `meta.sourceIds` comes from the enabled pack ids
- `raceId`, `class.classId`, `class.level`, `skillRanks`, `featIds`, and `equipmentIds` map from the wizard state

Use a concrete fixture similar to:

```ts
it("maps wizard state and edition metadata into CharacterSpec", () => {
  const spec = characterSpecFromState({
    state: {
      metadata: { name: "Aric" },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      selections: {
        race: "human",
        class: "fighter",
        skills: { climb: 4, jump: 3, diplomacy: 0.5 },
        feats: ["power-attack"],
        equipment: ["longsword", "chainmail", "heavy-wooden-shield"],
      },
    },
    rulesetId: "dnd-3.5-srd",
    sourceIds: ["srd-35e-minimal"],
  });

  expect(spec).toEqual({
    meta: {
      name: "Aric",
      rulesetId: "dnd-3.5-srd",
      sourceIds: ["srd-35e-minimal"],
    },
    raceId: "human",
    class: { classId: "fighter", level: 1 },
    abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
    skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
    featIds: ["power-attack"],
    equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"],
  });
});
```

**Step 2: Run the adapter test to verify it fails**

Run: `npm --workspace @dcb/web run test -- src/characterSpecFromState.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Add a failing review/export integration test**

In `apps/web/src/App.test.tsx`, add a focused review-flow test that clicks `Export JSON`, intercepts the blob payload, and asserts the exported JSON has:

- top-level `schemaVersion`
- nested `sheetViewModel`
- `validationIssues`, `unresolved`, and `assumptions`

Expected failure: the current app exports the legacy `CharacterSheet` JSON instead.

**Step 4: Run the focused App test to verify it fails**

Run: `npm --workspace @dcb/web run test -- src/App.test.tsx -t "exports ComputeResult JSON from review"`
Expected: FAIL because export still serializes the legacy `sheet` object.

**Step 5: Commit**

Do not commit yet.

### Task 2: Add the CharacterState -> CharacterSpec adapter

**Files:**
- Create: `apps/web/src/characterSpecFromState.ts`
- Test: `apps/web/src/characterSpecFromState.test.ts`

**Step 1: Write the minimal helper**

Create `characterSpecFromState` that accepts:

```ts
type CharacterSpecFromStateInput = {
  state: CharacterState;
  rulesetId: string;
  sourceIds: string[];
};
```

Return a `CharacterSpec` using:

- `state.metadata.name`
- `state.abilities`
- `state.selections.race`
- `state.selections.class` mapped to `{ classId, level: 1 }` for the current single-class flow
- `state.selections.skills`
- `state.selections.feats`
- `state.selections.equipment`

Normalize only what the web app already knows structurally; do not duplicate engine normalization rules.

**Step 2: Run the adapter test to verify it passes**

Run: `npm --workspace @dcb/web run test -- src/characterSpecFromState.test.ts`
Expected: PASS

**Step 3: Refactor only if needed**

If duplicated selection extraction appears in `App.tsx`, move that extraction into this helper rather than keeping parallel mapping logic.

### Task 3: Switch App.tsx to compute() for UI-facing engine output

**Files:**
- Modify: `apps/web/src/App.tsx`
- Reuse: `apps/web/src/characterSpecFromState.ts`

**Step 1: Update imports**

Replace the direct `finalizeCharacter` import with `compute` and the `CharacterSpec` adapter import.

**Step 2: Add the ComputeResult memo**

Create:

```ts
const spec = useMemo(
  () =>
    characterSpecFromState({
      state,
      rulesetId: selectedEdition.id,
      sourceIds: enabledPackIds,
    }),
  [enabledPackIds, selectedEdition.id, state],
);

const computeResult = useMemo(
  () => compute(spec, { resolvedData, enabledPackIds }),
  [enabledPackIds, resolvedData, spec],
);
```

**Step 3: Move export/provenance reads to ComputeResult**

Update:

- `exportJson()` to serialize `computeResult`
- provenance maps to read from `computeResult.provenance ?? []`

**Step 4: Run the focused export test**

Run: `npm --workspace @dcb/web run test -- src/App.test.tsx -t "exports ComputeResult JSON from review"`
Expected: PASS

### Task 4: Migrate sheet-total UI reads to sheetViewModel

**Files:**
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Replace skills-step totals**

In the skills step, read per-skill totals, ability mods, ACP, and misc from `computeResult.sheetViewModel.skills`.

Keep only non-total compatibility reads that are still required for:

- rank-step controls
- cost-per-rank
- class-vs-cross-class labels
- max-rank limits

These compatibility reads may stay on the legacy selection-side data path if they are not React-side recomputed totals.

**Step 2: Replace review totals and attacks**

In the review screen, use `computeResult.sheetViewModel` for:

- AC cards
- attack lines
- review skill totals

Do not read those totals back from `sheet.stats`, `sheet.skills`, or other legacy totals.

**Step 3: Keep a strict stop condition**

If a review section still requires legacy engine-only data that is not present in `ComputeResult` / `SheetViewModel`, do one of the following:

- leave the section on its existing compatibility path if it is not a sheet-total recompute path, or
- stop and open a new issue if satisfying `#167` would require expanding the engine output contract

Do not silently grow this branch into new engine-contract work.

**Step 4: Update focused UI tests**

Adjust existing review/skills tests only where output shape changes. Keep the current happy-path assertions for:

- AC heading/card values
- attack lines
- skills review table rows

**Step 5: Run focused web tests**

Run: `npm --workspace @dcb/web run test -- src/App.test.tsx`
Expected: PASS

### Task 5: Full verification and branch handoff

**Files:**
- Review only

**Step 1: Run relevant verification**

Run:

- `npm --workspace @dcb/web run test`
- `npm --workspace @dcb/web run typecheck`
- `npm run typecheck`
- `npm run build`

**Step 2: Review the diff**

Run:

- `git diff --stat`
- `git diff -- apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/src/characterSpecFromState.ts apps/web/src/characterSpecFromState.test.ts docs/plans/2026-03-07-sheetviewmodel-ui-only-design.md docs/plans/2026-03-07-sheetviewmodel-ui-only-implementation.md`

**Step 3: Commit**

Run:

- `git add apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/src/characterSpecFromState.ts apps/web/src/characterSpecFromState.test.ts docs/plans/2026-03-07-sheetviewmodel-ui-only-design.md docs/plans/2026-03-07-sheetviewmodel-ui-only-implementation.md`
- `git commit -m "feat(web): integrate review totals with compute result"`

**Step 4: Push and open PR**

Run:

- `git push -u origin feat/issue-167-sheetviewmodel-ui`
- `gh pr create --title "[P0] Render UI from SheetViewModel only (issue #167)" --body-file <prepared-body-file>`
