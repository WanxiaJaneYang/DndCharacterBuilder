# AbilityAllocator Component

The Ability step allocator collects ability scores for STR/DEX/CON/INT/WIS/CHA. Behavior is fully driven by flow and presentation data and must remain edition-agnostic.

## Purpose

- Provide a clear interface for assigning base scores via configured generation modes.
- Enforce selected mode rules (point buy, PHB, roll sets) from pack config.
- Show final outcomes clearly: base score, existing modifiers, final score, final modifier.
- Show provenance of existing modifiers without hardcoding source categories.

## Inputs

- `abilitiesConfig`: Pack-owned generation config (`modes`, `defaultMode`, mode-specific parameters).
- `abilityPresentation`: Pack-owned presentation config for modifier visibility and grouping.
- `initialScores?: Record<AbilityKey, number>`: Optional initial base scores.
- `abilityEffects?: Record<AbilityKey, AbilityEffect[]>`: Active pre-ability effects resolved by engine.
- `abilityMeta?`: Mode-specific state (for example point cap, PHB assignment state, roll-sets selection).
- `onChange`: Callback for score/mode state updates.

Suggested effect shape:
- `AbilityEffect`:
  - `ability: AbilityKey`
  - `value: number`
  - `sourceType: string`
  - `sourceId: string`
  - `sourceLabel: string`

## Behavior

### Mode Workspace

- Render enabled modes from `abilitiesConfig.modes` only.
- Use a single dropdown (`select`) control for mode switching.
- Use `abilitiesConfig.defaultMode` as initial mode.
- Do not apply code-side fallback mode defaults when config is missing.

### Ability Summary Rows

- Render one row per ability in fixed ability order.
- For each row show: Base, Existing, Final, Derived Modifier.
- Existing is computed from active `abilityEffects` for that ability.

### Score Controls (Usability Requirements)

- For editable score fields, render adjacent `-` and `+` steppers with large hit areas (minimum 40x40).
- Keep both steppers on the same side of the numeric field.
- Click/tap changes by one step; press-and-hold performs repeat stepping for quick adjustments.
- Keyboard parity:
  - `ArrowUp` / `ArrowDown` adjust by one step.
  - Optional accelerated stepping (for example `Shift` + arrow) when consistent with active mode constraints.
- Buttons must be disabled when constraints would be violated (min/max score, point cap, mode rules).
- Expose immediate feedback for blocked increments/decrements (disabled affordance + short inline reason).

### Roll Sets Assignment (Usability Requirements)

- In `rollSets` mode, do not expose direct score steppers/number-editing controls.
- Show rolled values as draggable tokens/chips.
- Show one drop target per ability and enforce one-time assignment per rolled value.
- Until all six assignments are complete, keep validation state incomplete.

### Dynamic Source Groups

- Group row details by `sourceType` (or configured grouping key).
- Render only groups whose net value for that ability is non-zero.
- Default table view shows concise totals only; line-level sources are revealed via hover/focus tooltip/popover.
- Hide groups with no impact to reduce noise.
- If no effects apply to an ability, show `No current modifiers` in collapsed detail state.

### Point Buy Rules Reference

- Point Buy workspace includes an inline collapsible section showing the active score-cost table.
- Optional external rules link may be shown when provided by pack presentation metadata.

### Ruleset and Extension Awareness

- `abilityEffects` must already be filtered to the active ruleset and selected extensions.
- UI does not assume which step/entity produced the effect.
- UI remains generic across race/class/feat/template/module/custom sources.

## Validation Boundaries

- UI: immediate constraints, empty-state warnings, and mode-specific input guardrails.
- Engine: authoritative mode validation and config integrity checks.
- If required config is missing/invalid, surface explicit configuration errors and block progression.

## Responsive Guidelines

- Desktop/tablet: table-like rows with expandable detail sections.
- Mobile: card rows with accordion detail panel per ability.
- Keep headline numbers readable without requiring detail expansion.
- Keep score steppers directly adjacent to the score value at every breakpoint.

## Checklist

- [x] Supports point buy / PHB / roll-set modes from `abilitiesConfig`.
- [x] No hardcoded source-type list in modifier rendering.
- [x] Renders only non-zero impacting source groups.
- [x] Keeps one-row-per-ability summary and expandable provenance details.
- [x] Handles ruleset/extension-driven effect changes without UI code branching.
