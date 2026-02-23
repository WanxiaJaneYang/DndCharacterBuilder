# UX Step 04 - Ability Scores

This document defines the Ability Scores step for a data-driven, edition-bound flow.

## Goal

Keep ability assignment clear for new players while preserving full ruleset flexibility.

- Support exactly three generation modes from data config:
  1. Point Buy
  2. PHB Method
  3. Roll Sets
- Show existing ability modifiers without tying UI logic to fixed source types (not race/class-only).
- Prevent confusion by showing concise totals first and detailed provenance on demand.

## UX Model

### Structure

- Top: mode selector dropdown (`select`), driven by `abilitiesConfig.modes`.
- Main area: mode-specific controls (Point Buy, PHB, Roll Sets).
- Summary area: six ability rows (STR/DEX/CON/INT/WIS/CHA), one row per ability.

### Ability Row (always visible)

Each ability row displays:
- Ability label
- Base score (from current generation mode)
- Existing modifier total (sum of active prior effects for that ability)
- Final score
- Final derived modifier
- Existing modifier source summary

### Score Stepper Ergonomics (Point Buy / Range Inputs)

- Use prominent `-` and `+` steppers beside each score input with a minimum 40x40 hit target (mobile-first).
- Keep both steppers on the same side of the score input (stacked or grouped vertically) to reduce left-right scanning.
- Single tap/click adjusts by 1 step in MVP.
- Native number input keyboard behavior is supported in MVP; custom accelerated shortcuts are out of current scope.
- Disable stepper buttons when min/max or point-cap constraints would be violated.
- Keep spent/remaining points visible while stepping so users can adjust without scanning elsewhere.
- Provide subtle feedback for blocked actions (disabled state + brief reason text near row).

### Roll Sets Assignment UX (MVP)

- Roll Sets mode uses pick-and-assign interaction, not free score editing.
- After set generation and chosen set selection, users assign values to abilities via drag/drop chips into ability slots.
- Standard point-buy/range steppers are not shown in this mode.
- Once mode is `rollSets`, base values come only from selected rolled values (no direct number-input adjustments).

### Source Breakdown (MVP table)

- Group by dynamic `sourceType` values from active effects (for example: race, class, feat, template, rules module, extension content).
- Render only groups with non-zero net effect for that ability.
- Show source details on hover/focus affordance (tooltip/popover) rather than expanded nested lists in default table view.
- If no active effects impact the ability, show `No current modifiers` and no empty groups.

This keeps the default view simple while preserving explainability.

## Data Contract (UI Design Level)

Ability generation behavior is pack-owned:
- `abilitiesConfig.modes`
- `abilitiesConfig.defaultMode`
- `abilitiesConfig.pointBuy`
- `abilitiesConfig.phb`
- `abilitiesConfig.rollSets`

Modifier display behavior is also data-driven:
- `abilityPresentation.showExistingModifiers`
- `abilityPresentation.groupBy` (MVP: `sourceType`)
- `abilityPresentation.hideZeroEffectGroups` (MVP: `true`)
- `abilityPresentation.sourceTypeLabels` (optional localized label mapping)

No UI hardcoded defaults for mode rules or modifier source categories.

## Ruleset/Extension Filtering

- Modifier rows must reflect only effects that are active in the current resolved ruleset plus selected content set.
- If a user enables or disables extensions, the displayed source groups update accordingly.
- Non-selected, disabled, or non-applicable sources are not rendered.

## Validation and Gating

- Next is enabled only when engine validation for the selected mode passes.
- UI provides immediate guardrails and error messages, but engine remains source of truth.
- Missing required mode config is surfaced as a configuration error (no silent fallback mode/values).
- For roll-sets mode, validation requires complete assignment of all rolled values to all ability slots.

## Point Buy Reference

- Point Buy mode includes an inline collapsible rules reference that shows the score-to-cost table from `abilitiesConfig.pointBuy.costTable`.
- If desired by pack presentation, the same section may also provide an external rules link.

## Responsive Behavior

- Desktop/tablet: six-row table layout with expandable detail rows.
- Mobile: stacked row cards (still one card per ability) with details in an accordion panel.
- Keep key numbers (Base, Existing, Final, Modifier) visible without opening details.
- Keep `-` and `+` controls pinned next to the editable score on all breakpoints.

## Acceptance Criteria

- Ability step renders 3 generation modes from config only.
- Ability summary always shows one row per ability with Base/Existing/Final/Modifier.
- Breakdown groups are dynamic by source type and render only non-zero impacting groups.
- Modifier display updates when ruleset/extension selection changes.
- No hardcoded source-type assumptions (for example, race/class-only logic) in UI behavior.
