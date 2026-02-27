# Ability Method Selector + Hover Hint UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the ability-mode radio group with a localized dropdown and add an accessible dynamic method-help hint for the Ability step.

**Architecture:** Keep the change scoped to `apps/web/src/App.tsx` UI state and rendering logic, backed by existing pack-owned `abilityPresentation.modeUi` mapping and localized UI text keys. Implement interaction behavior with a single hint panel instance and explicit keyboard/mouse/touch handling. Cover behavior through focused RTL tests in `App.test.tsx`.

**Tech Stack:** React + TypeScript, Vitest + Testing Library, existing CSS.

---

### Task 1: Add failing tests for dropdown + hint behavior

**Files:**
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write failing tests**
- Add assertions for:
  - `combobox` mode selector on Ability step.
  - method-help trigger button with localized accessible name.
  - hint panel open/close on hover, focus, click, and `Escape`.
  - hint text updates to selected mode on change.

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: FAIL because current UI is radio-based and has no hint panel.

**Step 3: Commit**

```bash
git add apps/web/src/App.test.tsx
git commit -m "test(web): add failing ability selector hint interaction coverage"
```

### Task 2: Add UI text contract keys for method-help copy

**Files:**
- Modify: `apps/web/src/uiText.ts`
- Modify: `apps/web/src/uiText.json`

**Step 1: Write minimal implementation**
- Add required keys:
  - `abilityMethodHelpLabel`
  - `abilityMethodHintPointBuy`
  - `abilityMethodHintPhb`
  - `abilityMethodHintRollSets`
- Populate EN + ZH text.

**Step 2: Run test to verify compile/tests pass**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: still FAIL for UI behavior tests, but no missing key/type failures.

**Step 3: Commit**

```bash
git add apps/web/src/uiText.ts apps/web/src/uiText.json
git commit -m "feat(web): add localized ability method hint text keys"
```

### Task 3: Replace radio with select and render dynamic help hint

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write minimal implementation**
- Add `abilityPresentation.modeUi` typing and lookup helpers.
- Render label row + help trigger + native select.
- Render one help panel instance with selected mode hint fallback logic.
- Implement ARIA attributes and keyboard close (`Escape`).

**Step 2: Run tests**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: PASS for new selector/hint behavior tests.

**Step 3: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): use select and add accessible ability method help hint"
```

### Task 4: Style selector row and help panel

**Files:**
- Modify: `apps/web/src/styles.css`

**Step 1: Write minimal styling**
- Add row layout for label/help/select with responsive wrap.
- Add circular help trigger visual states and focus-visible ring.
- Add compact hint panel styling with viewport-safe width.

**Step 2: Run tests**

Run: `npm --workspace @dcb/web run test -- App.test.tsx`
Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "style(web): add ability method selector row and hint panel styles"
```

### Task 5: Final verification

**Step 1:** `npm --workspace @dcb/web run test -- App.test.tsx`

**Step 2:** `npm -ws run typecheck`

**Step 3:** Optional full suite: `npm test`
