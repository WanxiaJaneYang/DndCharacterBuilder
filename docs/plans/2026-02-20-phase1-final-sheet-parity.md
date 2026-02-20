# Phase 1 Final Sheet Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver Phase 1 final character sheet parity for review/export by adding identity/progression, combat breakdown surfaces, and structured export blocks.

**Architecture:** Keep the existing deterministic engine output intact and add a backward-compatible structured `phase1` block on top of `CharacterSheet`. Update product and UX docs first to lock requirements, then redesign the review UI around the new block with provenance-friendly breakdown rows. Keep pack-driven behavior and avoid UI hardcoding of SRD rule text.

**Tech Stack:** TypeScript, React (Vite), `@dcb/engine`, JSON-driven pack data/docs.

---

### Task 1: Record Working Plan + Product Scope Lock

**Files:**
- Create: `docs/plans/2026-02-20-phase1-final-sheet-parity.md`
- Modify: `docs/product/PRD.md`

**Step 1: Define execution order**
- Document mandatory sequence: product doc -> UX/UI redesign -> implementation.

**Step 2: Add explicit Phase 1 delivery scope in PRD**
- Clarify MVP sprint acceptance for touch/flat-footed AC, initiative/grapple/save/HP breakdown, attack lines, and identity basics.

**Step 3: Add out-of-scope notes**
- Mark Phase 2/3 surfaces as deferred to avoid scope creep.

### Task 2: UX/UI Redesign Spec Update

**Files:**
- Modify: `docs/ux/steps/08_review_export.md`
- Modify: `docs/ui/UI_SPEC.md`

**Step 1: Redesign review information hierarchy**
- Add section order for Identity, Combat Headline, Breakdown Cards, Attack Lines, Saves/HP breakdown, existing ability/skills/provenance panels.

**Step 2: Add interaction details**
- Define what is expandable, what remains always visible, and how to keep provenance readable.

**Step 3: Add acceptance checklist for Phase 1**
- Add concrete checklist items tied to new fields and calculations.

### Task 3: Engine Phase 1 Data Surface

**Files:**
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/engine.test.ts`

**Step 1: Add failing tests for structured phase1 output**
- Assert new `phase1` identity/combat fields are present and deterministic for baseline fixture.

**Step 2: Implement minimal structured model**
- Add `phase1.identity` and `phase1.combat` in final output while preserving existing `stats` fields.

**Step 3: Wire calculations from existing deterministic data**
- Use current stats/abilities/provenance and selected entities to derive touch/flat-footed AC, initiative/save/HP breakdowns, grapple baseline, and attack line placeholders.

**Step 4: Run engine tests**
- Run targeted engine tests and fix regressions.

### Task 4: Web Review UI Phase 1 Redesign

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/uiText.ts`
- Modify: `apps/web/src/uiText.json`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Add failing UI tests**
- Assert new review sections/labels render for final step.

**Step 2: Implement redesigned Phase 1 sections**
- Add Identity/progression panel, AC touch/flat-footed cards, saves/HP breakdown rows, grapple + attack lines block.

**Step 3: Keep existing sections and actions stable**
- Preserve current ability/skills/provenance/pack info sections and JSON export action.

**Step 4: Update i18n keys and styles**
- Add text keys and minimal styling updates for readable layout.

**Step 5: Run web tests**
- Run targeted app tests and update expectations.

### Task 5: Verification and Notes

**Files:**
- Modify: `docs/ux/steps/08_review_export.md` (checklist status)
- Modify: `docs/plans/2026-02-20-phase1-final-sheet-parity.md` (validation notes)

**Step 1: Run relevant validation**
- `npm --workspace @dcb/engine test`
- `npm --workspace @dcb/web test`

**Step 2: Record outputs and residual risk**
- Note pass/fail and any known approximations in Phase 1 formulas.

## Validation Results

- `npm.cmd --workspace @dcb/engine test` -> PASS (18/18).
- `npm.cmd --workspace @dcb/web test` -> PASS (7/7).

## Known Phase 1 Approximations

- Attack lines currently use deterministic fallbacks when full weapon profile metadata is unavailable in selected item entities.
- AC and HP component breakdowns are deterministic and provenance-backed, but some channels (`natural`, `deflection`, equipment-specific weapon ranges) remain placeholders until richer pack data is added.

