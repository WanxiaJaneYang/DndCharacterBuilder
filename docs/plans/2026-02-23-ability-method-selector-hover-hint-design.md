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

## 12. Detailed Visual Design Guide

### 12.1 Component Composition

- Row structure: `Label` + `Hint Trigger` + `Select` as one semantic control cluster.
- Desktop order: label on left, `?` trigger immediately after label, select aligned right.
- Mobile order: label + trigger on first line, select on next line with full available width.
- Visual hierarchy:
  - Primary: current selected generation method.
  - Secondary: hint trigger.
  - Tertiary: explanatory popover text.

### 12.2 Layout and Spacing Spec

- Row top/bottom margin: `12px`.
- Gap between label and hint trigger: `8px`.
- Gap between hint trigger and select: `12px`.
- Minimum select width (desktop): `220px`.
- Preferred select width (desktop): `260px`.
- Select width (mobile): `100%`.
- Hint panel offset from trigger: `6px` below trigger.
- Hint panel internal padding: `12px 14px`.
- Hint paragraph spacing: `6px` between lines.

### 12.3 Typography Spec

- Label:
  - Family: same as current UI heading/form label family.
  - Size: `0.95rem`.
  - Weight: `700`.
  - Line-height: `1.2`.
- Select text:
  - Family: existing input/control family.
  - Size: `0.95rem`.
  - Weight: `500`.
  - Line-height: `1.2`.
- Hint panel text:
  - Family: existing body/control family.
  - Size: `0.88rem`.
  - Weight: `400`.
  - Line-height: `1.4`.

### 12.4 Color and Surface Spec

- Preserve existing parchment fantasy palette.
- Hint trigger default:
  - Surface: subtle parchment accent.
  - Border: medium-contrast gold-brown.
  - Text/icon: deep ink tone.
- Hint trigger hover:
  - Slight brightness increase or stronger border contrast.
- Hint trigger focus-visible:
  - High-contrast focus ring at least `2px` and visually distinct from border.
- Hint panel:
  - Surface: light parchment card.
  - Border: soft gold-brown.
  - Shadow: soft elevation only; avoid heavy blur.
- Text contrast target:
  - Body text: minimum WCAG AA (`4.5:1`) against panel background.
  - Interactive text/icon: minimum WCAG AA (`3:1` for large/icon states, `4.5:1` where applicable).

### 12.5 Select Control Styling Guidelines

- Keep native select behavior for accessibility and platform familiarity.
- Ensure visible affordance:
  - Border present in default state.
  - Clear hover/focus states.
  - Disabled state visually distinct but still readable.
- Do not hide the native dropdown indicator unless replaced accessibly.
- Keep tap target height at least `40px`.

### 12.6 Hint Trigger and Panel Styling

- Hint trigger shape: circular.
- Recommended size: `28px` to `32px` square.
- Icon glyph: `?`, centered both axes.
- Panel corner radius: `8px`.
- Panel max width:
  - Desktop: `320px`.
  - Mobile: `calc(100vw - 32px)`.
- Panel z-index: above local form controls, below modal layers.

### 12.7 Interaction and Motion Spec

- Open behavior:
  - Hover: immediate open (`0-80ms` delay max).
  - Focus: immediate open.
  - Tap/click: toggle open/close.
- Close behavior:
  - Pointer leave (when not pinned by click): immediate close.
  - `Escape`: immediate close.
  - Outside click/tap: close.
- Motion:
  - Use subtle fade/translate (`100-150ms`) if animations are enabled.
  - Respect `prefers-reduced-motion` by disabling non-essential transitions.

### 12.8 Localization and Content Fit Rules

- EN and ZH lines must be one sentence per method.
- Keep each line concise; avoid wrapping beyond 2 lines on desktop when possible.
- If translated strings are long, allow panel height growth before reducing font size.
- Never truncate method explanation text with ellipsis.

### 12.9 Accessibility and Usability QA Checklist

- Label is programmatically associated with select.
- Trigger has descriptive accessible name (`About ability generation methods` / `生成方式说明`).
- Trigger is reachable via keyboard in normal tab order.
- `Enter` and `Space` activate trigger.
- `Escape` closes panel and returns focus context to trigger.
- Hover-only interactions have keyboard and touch equivalents.
- Focus indicator remains visible at all times.
- Interactive hit areas are at least `40x40px`.

### 12.10 Visual Review Checklist

- Row alignment remains stable across EN and ZH.
- Hint panel does not clip at viewport edges.
- No overlap with point-cap controls below.
- Control spacing matches adjacent form sections.
- Visual weight of new row feels integrated with existing Ability-step UI.
