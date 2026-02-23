# Ability Method Selector + Hover Hint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the ability-generation radio group with a dropdown and add an accessible hover/focus/click hint that is dynamic per configured mode and localization data.

**Architecture:** Keep all logic in `apps/web/src/App.tsx` to preserve current state/data flow. Use a native `<select>` for reliability and a lightweight tooltip/popover model. Mode labels and hint text must come from pack-owned presentation config + localization keys (no hardcoded mode-copy mapping).

**Tech Stack:** React + TypeScript (Vite), RTL/Vitest, existing CSS.

---

### Task 1: Add data-driven mode UI contract and localization keys

**Files:**
- Modify: `apps/web/src/uiText.ts`
- Modify: `apps/web/src/uiText.json`
- Modify: pack flow/presentation config files (ability step)
- Test: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Add an assertion in ability-step test that checks hint trigger label and dynamic hint text lookup for active mode.

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: FAIL (missing data-driven lookup path)

**Step 3: Write minimal implementation**

- Add generic UI key: `abilityMethodHelpLabel`.
- Add pack-owned map (example): `abilityPresentation.modeUi[modeId]` with:
  - `labelKey`
  - `hintKey`
- Add localization entries for each enabled mode label + hint.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS for data-driven localization lookup.

**Step 5: Commit**

```bash
git add apps/web/src/uiText.ts apps/web/src/uiText.json packs/** apps/web/src/App.test.tsx
git commit -m "feat(web): add data-driven mode label/hint localization contract"
```

### Task 2: Replace ability mode radio group with dropdown

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Expect `combobox` instead of `radiogroup/radio`.

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

- Replace radio block with label + `<select>`.
- Keep existing mode-switch logic and roll-sets initialization path.
- Mode option labels must resolve from config/localization mapping.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): use dropdown for ability generation mode"
```

### Task 3: Add accessible dynamic hint trigger + panel

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests for:
- open on hover/focus/click
- close on `Escape`
- hint text resolves for selected mode and focused/browsed option

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add hint open/pinned state.
- Render trigger near selector label.
- Render hint panel content by mode id -> `hintKey` lookup.
- During dropdown browsing, update hint to focused option where possible; fallback to selected mode.
- Add required ARIA attributes.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): add accessible dynamic ability method hint"
```

### Task 4: Style selector row and hint panel

**Files:**
- Modify: `apps/web/src/styles.css`
- Optional visual snapshots: `tests/visual/**`

**Step 1: Write failing visual/assertion test**

Add/update visual expectation for Ability step control row.

**Step 2: Run test to verify it fails**

Run visual suite command.
Expected: FAIL/mismatch.

**Step 3: Write minimal implementation**

- Add layout classes for label + trigger + select.
- Add focus-visible states.
- Add compact panel styling and responsive behavior.

**Step 4: Run tests to verify it passes**

Run visual and unit tests.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/styles.css tests/visual/**
git commit -m "style(web): polish ability selector and dynamic hint panel"
```

### Task 5: Verification

**Step 1:** `npm --workspace @dcb/web run test -- App.test.tsx`

**Step 2:** `npm -ws run typecheck`

**Step 3:** optional `npm test`

**Step 4:** manual a11y check (tab order, enter/space, escape, touch fallback)
