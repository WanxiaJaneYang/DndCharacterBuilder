# Ability Method Selector + Hover Hint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the ability-generation radio group with a dropdown and add an accessible hover/focus/click hint explaining each method.

**Architecture:** Keep all logic in `apps/web/src/App.tsx` to preserve current state/data flow and avoid creating a parallel form system. Use a native `<select>` for reliability and a lightweight tooltip/popover state model tied to the existing Ability step render path. Keep localization in `uiText.json`/`uiText.ts` and style in `styles.css`.

**Tech Stack:** React + TypeScript (Vite), RTL/Vitest, existing CSS.

---

### Task 1: Add localization keys for selector hint UI

**Files:**
- Modify: `apps/web/src/uiText.ts`
- Modify: `apps/web/src/uiText.json`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Add an assertion in ability-step test that checks hint trigger label and one hint line text exists (EN path).

```ts
expect(screen.getByRole('button', { name: /About ability generation methods/i })).toBeTruthy();
```

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx --runInBand`
Expected: FAIL (missing text key or trigger not rendered)

**Step 3: Write minimal implementation**

- Add new `UIText` keys:
  - `abilityMethodHelpLabel`
  - `abilityMethodHintPointBuy`
  - `abilityMethodHintPhb`
  - `abilityMethodHintRollSets`
- Populate EN + ZH values in JSON.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS for localization lookup path.

**Step 5: Commit**

```bash
git add apps/web/src/uiText.ts apps/web/src/uiText.json apps/web/src/App.test.tsx
git commit -m "feat(web): add localized copy for ability method selector hint"
```

### Task 2: Replace ability mode radio group with dropdown

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Update existing test to expect a combobox instead of radiogroup/radios.

```ts
expect(screen.getByRole('combobox', { name: /Ability Generation|生成方式/i })).toBeTruthy();
```

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx --runInBand`
Expected: FAIL (radio UI still present)

**Step 3: Write minimal implementation**

- Replace radio fieldset block with label + `<select>`.
- Keep existing mode-switch logic by routing selected value through current `applyAbilitySelection` flow.
- Preserve existing roll-sets initialization behavior when choosing `rollSets`.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS for selector rendering and mode switching tests.

**Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): use dropdown for ability generation mode"
```

### Task 3: Add accessible hint trigger + panel interactions

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests for:
- open on hover/focus/click
- close on `Escape`
- hint text renders all three method descriptions

```ts
await user.hover(screen.getByRole('button', { name: /About ability generation methods/i }));
expect(screen.getByText(/Spend points to raise scores within budget/i)).toBeTruthy();
```

**Step 2: Run test to verify it fails**

Run: `npm --workspace @dcb/web run test -- App.test.tsx --runInBand`
Expected: FAIL (hint UI absent)

**Step 3: Write minimal implementation**

- Add local UI state (`isAbilityMethodHintOpen`).
- Render hint trigger button near selector label.
- Render hint panel with localized method lines.
- Implement hover/focus/click open paths and `Escape` close behavior.
- Add `aria-label`, `aria-expanded`, `aria-controls`, and tooltip id wiring.

**Step 4: Run test to verify it passes**

Run same test command.
Expected: PASS for hint interaction tests.

**Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): add accessible ability method hint popover"
```

### Task 4: Style selector row and hint panel

**Files:**
- Modify: `apps/web/src/styles.css`
- Test: `tests/visual/wizard.visual.spec.ts` (if snapshots affected)

**Step 1: Write the failing test**

If visual regression is tracked for Ability step, add/update snapshot expectation path first.

**Step 2: Run test to verify it fails**

Run: `npm run test:visual -- --grep "ability"` (or project-equivalent visual command)
Expected: snapshot mismatch/fail.

**Step 3: Write minimal implementation**

- Add layout class for selector+hint row.
- Add accessible focus-visible styling for hint trigger.
- Add compact tooltip panel styling with responsive width constraints.
- Ensure mobile wrapping keeps label and hint together.

**Step 4: Run test to verify it passes**

Run visual test (or standard test suite if visual not configured for this step).
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/styles.css tests/visual/wizard.visual.spec.ts-snapshots
git commit -m "style(web): polish ability method selector row and hint panel"
```

### Task 5: Accessibility and regression verification

**Files:**
- Verify only (no required file edits)

**Step 1: Run targeted unit tests**

Run: `npm --workspace @dcb/web run test -- App.test.tsx --runInBand`
Expected: PASS

**Step 2: Run workspace checks**

Run: `npm -ws run typecheck`
Expected: PASS

**Step 3: Run full test suite (if feasible)**

Run: `npm test`
Expected: PASS or known unrelated failures documented.

**Step 4: Manual accessibility spot-check**

- Keyboard Tab order reaches selector then hint button.
- Enter/Space toggles hint.
- Escape closes hint.
- Hover behavior has click/focus fallback.

**Step 5: Commit verification note (optional docs update)**

```bash
git add docs/engineering/WORK_PLAN.md
git commit -m "docs: record ability selector hint verification status"
```
