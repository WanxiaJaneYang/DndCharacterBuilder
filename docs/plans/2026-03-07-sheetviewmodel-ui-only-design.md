# SheetViewModel-Only UI Integration Design

Parent issue: #159  
Issue: #167

## Goal

Make the web UI consume engine output through `compute(spec, rulepack)` and render sheet/review totals from `ComputeResult.sheetViewModel`, removing React-side recompute paths for those totals.

## Scope

### In scope

- Replace the top-level web-engine integration path that currently calls `finalizeCharacter(state, context)` directly.
- Introduce a single `ComputeResult` value as the UI-facing engine output for review and skills surfaces.
- Render review combat and skills totals from `result.sheetViewModel`.
- Move review validation/unresolved/provenance reads to the `ComputeResult` shape where possible.
- Remove React-side recompute paths for sheet totals covered by the current review UI.
- Add tests that prove review rendering still works after the cutover.

### Out of scope

- Redesigning the wizard flow or changing selection semantics.
- Expanding the `SheetViewModel` contract beyond what `#167` strictly needs.
- Reworking non-review UI that does not currently render sheet totals.
- Solving unrelated engine-output gaps inside this branch. If a missing field blocks the migration and is not already part of `ComputeResult` / `SheetViewModel`, raise a new issue.

## Current State

`apps/web/src/App.tsx` still computes a full legacy `sheet` with:

```ts
const sheet = useMemo(() => finalizeCharacter(state, context), [context, state]);
```

The review page mixes `sheet.sheetViewModel` with legacy fields such as:

- `sheet.phase1` and `sheet.phase2` for combat, saves, HP, feats, traits, equipment, and movement
- `sheet.stats` for combat-breakdown final values
- `sheet.skills` and `sheet.decisions.skillPoints` for skills breakdown and budget summaries
- `sheet.metadata.name` and `sheet.provenance` for export/provenance display

That means the UI is not yet aligned with the parent issue's contract boundary. The engine now exposes `compute(spec, rulepack)` and `ComputeResult.sheetViewModel`, but the web app is still bound to the legacy `CharacterSheet` shape.

## Target Design

### Data flow

The web app should derive a `CharacterSpec` from the current wizard state, call `compute(spec, rulepack)`, and treat the returned `ComputeResult` as the single engine output for UI rendering.

The resulting layering should be:

1. Wizard state captures user selections.
2. UI maps wizard state to `CharacterSpec`.
3. UI calls `compute(spec, rulepack)`.
4. Review and skills surfaces render from `result.sheetViewModel` plus the other `ComputeResult` channels (`validationIssues`, `unresolved`, `assumptions`, `provenance`).

### Rendering rule

If a displayed number is a derived engine total, the UI must read it from `ComputeResult.sheetViewModel` instead of recomputing it or reading the legacy `CharacterSheet` shape.

This issue stays focused on removing UI recomputation, not on rebuilding every review section at once. If the current `SheetViewModel` lacks a value needed by the UI and that value cannot be rendered without falling back to legacy engine fields, that missing engine output is a follow-up issue, not silent scope creep for `#167`.

## Delivery Slices

### Slice 1: Cut over the top-level UI engine call

- Replace the top-level `finalizeCharacter(...)` memo in `App.tsx` with `compute(...)`.
- Keep the wizard state and existing selection controls unchanged.
- Introduce a local adapter layer only where the UI needs to bridge state into `CharacterSpec`.

### Slice 2: Migrate review combat + skills to `sheetViewModel`

- Update review combat cards, attack lines, and skills rows to read totals from `result.sheetViewModel`.
- Remove React-side derivation that depends on `sheet.stats`, `sheet.skills`, or other legacy totals for those sections.
- Keep localized labels and sorting behavior unless the data source itself changes.

### Slice 3: Remove remaining legacy review dependencies that belong to `#167`

- Remove direct review dependencies on legacy engine totals that are replaced by `ComputeResult`.
- Keep only compatibility reads that are not sheet-total recomputation, and document any remaining blockers.
- If a blocker is caused by a missing engine contract field, stop and open a follow-up issue.

## Testing Strategy

- Add or update UI tests in `apps/web/src/App.test.tsx`.
- Cover at least one end-to-end-ish review flow proving the review screen still renders expected AC / attack / skills output after the cutover.
- Add targeted tests for any helper that maps wizard state to `CharacterSpec` if that helper is extracted.
- Keep engine behavior tests in `packages/engine` untouched unless the migration reveals a genuine contract gap.

## Risks and Guardrails

- The main risk is accidental scope expansion into engine-contract work that belongs in a new issue.
- The second risk is keeping hidden fallback logic that still reads legacy totals after the cutover.

Guardrails:

- Treat `ComputeResult` as the source of truth for UI-rendered totals.
- Delete replaced UI recompute paths instead of keeping silent fallbacks.
- Raise a new issue if `SheetViewModel` is missing data required by the current review UI.
