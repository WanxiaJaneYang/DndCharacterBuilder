# Ability Method Selector + Hover Hint Design

Date: 2026-02-23
Owner: UX + Frontend
Status: Approved
Scope: Ability step top controls only (generation selector + method guidance hint)

## 1. Objective

Improve method selection clarity without adding visual clutter by replacing the radio group with a dropdown and adding an on-demand explanation hint.

## 2. User Problem

- The existing method selector consumes too much vertical space.
- Method differences are not obvious for first-time users.
- Guidance should be available when needed, but not always visible.

## 3. Design Decision (Locked)

- Use a native `select` for ability generation mode.
- Add a hint trigger (`?`) beside the label.
- Show concise method explanations in a hover/focus/click popover.
- Keep current visual theme and spacing rhythm.

## 4. Interaction Model

### 4.1 Selector

- Label: `Ability Generation Method`.
- Control: native `<select>` populated from `abilitiesConfig.modes` in configured order.
- Default selection: `abilitiesConfig.defaultMode`.
- Option labels:
  - Point Buy
  - PHB Method
  - Roll 5 Sets

### 4.2 Hint Trigger

- Trigger element: icon-only button with visible `?` glyph.
- Placement: inline with label, before selector field.
- States: default, hover, focus-visible, active, disabled (config-error only).

### 4.3 Hint Content

- Point Buy: Spend points to raise scores within budget.
- PHB Method: Assign predefined values by PHB rules.
- Roll 5 Sets: Roll five arrays, pick one, then assign values. No manual adjustment.

### 4.4 Hint Behaviors

- Mouse: open on hover, close on pointer leave.
- Keyboard: open while trigger has focus; close on blur or `Escape`.
- Touch: toggle on tap, close on outside tap.
- Keep one hint panel instance only.

## 5. Information Architecture

- Default surface: selector only.
- Progressive disclosure: method rules appear on-demand via hint.
- No persistent helper paragraph below selector.

## 6. Accessibility Requirements (WCAG AA baseline)

- `label` explicitly bound to select (`htmlFor` + `id`).
- Hint trigger uses semantic `button` and clear `aria-label`.
- Trigger exposes `aria-expanded` and `aria-controls` when popover is toggleable.
- Hint panel content remains reachable via keyboard path (focus trigger).
- `Escape` closes hint and keeps focus on trigger.
- Color contrast for text and interactive states must pass AA.
- Hover-only behavior must have non-hover equivalent (click/tap + focus).

## 7. Visual Direction

- Preserve parchment/gold fantasy style.
- Selector width: comfortable for longest localized label.
- Hint panel: compact card, subtle border, soft shadow, high-contrast text.
- Keep spacing tight and aligned with existing form rows.

## 8. Copy Style

- One sentence per method.
- Plain-language and rules-correct.
- English and Chinese localization keys required.

## 9. Responsive Behavior

- Desktop/tablet: label + hint + select on one line when space allows.
- Mobile: wrap select below label row; keep hint trigger adjacent to label.
- Hint panel max width constrained to viewport with safe margins.

## 10. Out of Scope

- Custom combobox replacement.
- Rich media/tooltips with tables.
- Any change to roll-set drag/drop behavior in this slice.

## 11. Acceptance Criteria

- Dropdown replaces radio group for method selection.
- Hint content appears on hover/focus/click and is dismissible.
- Keyboard users can open/close hint without pointer.
- Touch users can open/close hint reliably.
- No regression in mode switching behavior.
- Localized copy available in EN and ZH.
