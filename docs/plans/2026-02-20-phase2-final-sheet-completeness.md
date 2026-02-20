# Phase 2 Final Sheet Completeness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver Phase 2 non-caster sheet completeness for final review/export: feats/traits visibility, skill misc+ACP channel visibility, and equipment/load + movement detail.

**Architecture:** Extend the engine with a backward-compatible `phase2` block while preserving existing behavior. Update product and UX/UI documentation first, then implement deterministic derivations from pack data and user selections. Keep fallbacks explicit where pack metadata remains incomplete.

**Tech Stack:** TypeScript, React (Vite), `@dcb/engine`, JSON-driven entities/flow.

---

### Task 1: Record Phase 2 Plan and Scope

**Files:**
- Create: `docs/plans/2026-02-20-phase2-final-sheet-completeness.md`
- Modify: `docs/product/PRD.md`

**Step 1: Add Phase 2 execution note**
- Lock sequence for this sprint: product doc -> UX/UI docs -> implementation.

**Step 2: Clarify Phase 2 acceptance details**
- Explicitly require feats/traits summary visibility, skill misc/ACP channel visibility, equipment/load summary, movement base vs adjusted.

### Task 2: UX/UI Redesign Docs for Phase 2

**Files:**
- Modify: `docs/ux/steps/08_review_export.md`
- Modify: `docs/ui/UI_SPEC.md`
- Modify: `docs/data/EXPORT_SCHEMA.md`

**Step 1: Define review sections for Phase 2**
- Add Feats summary panel, Traits panel, Equipment/Load panel, Movement detail panel, Skills misc/ACP columns.

**Step 2: Define export schema Phase 2 shape concretely**
- Add or tighten expected keys for `traits`, `feats`, skill `misc`/`acp`, `equipment`, `movement`.

### Task 3: Engine Phase 2 Data Surface

**Files:**
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/engine.test.ts`

**Step 1: Add failing tests**
- Validate `phase2` surfaces exist and are deterministic.

**Step 2: Implement `phase2` block**
- Include selected feats with summary text.
- Include racial traits/senses/resistance summary channels.
- Include per-skill misc/acp channels in structured output.
- Include equipment/load and movement detail fields.

### Task 4: Web Review UI for Phase 2

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/uiText.ts`
- Modify: `apps/web/src/uiText.json`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Add failing UI tests**
- Assert new Phase 2 panels/columns render.

**Step 2: Implement new review panels**
- Feats, Traits, Equipment/Load, Movement detail.
- Skills table includes misc/acp visibility columns/chips.

### Task 5: Verify and Record

**Files:**
- Modify: `docs/ux/steps/08_review_export.md` checklist
- Modify: `docs/plans/2026-02-20-phase2-final-sheet-completeness.md`

**Step 1: Run tests**
- `npm.cmd --workspace @dcb/engine test`
- `npm.cmd --workspace @dcb/web test`

**Step 2: Record residual gaps**
- Note any Phase 2 data limitations due current pack metadata.

## Validation Results

- `npm.cmd --workspace @dcb/engine test` -> PASS (18/18).
- `npm.cmd --workspace @dcb/web test` -> PASS (7/7).

## Known Phase 2 Approximations

- Item weight and ACP channels currently use deterministic fallbacks for MVP sample items because pack item entities do not yet provide complete weight/ACP metadata.
- Skill misc channel is present and visible but currently defaults to `0` until rule-pack data exposes explicit misc modifiers.
