# UX Step 04 - Ability Scores

This document defines the Ability Scores step for a data-driven, edition-bound flow.

## Goal

Keep ability assignment clear for new players while preserving full ruleset flexibility.

The Ability Scores step now follows a lazy-loading pattern:
- Begin with an "ask first" hero block that names the three generation modes, explains the intent, and recommends `rollSets` for first-time players.
- After a method is chosen and confirmed, render its controls (point-buy cap + cost table, PHB ranges, or roll-set list) and scroll the view to the six-ability summary table.
- Point Buy includes a visible cost grid and remaining point readout; the ability rows only show manual controls when the method allows editing (i.e. not while roll-sets are pending a selection).
- The base-score input always keeps the increment/decrement buttons on the same side as the input, and those buttons are entirely hidden when the roll-set picker is active so players cannot mutate values after choosing that workflow.
- Modifiers keep the same summary table format as the review page, but hover/tap reveals the source attribution only when needed to prevent clutter.

- Support exactly three generation modes from data config:
  1. Point Buy
  2. PHB Method
  3. Roll Sets
- Show existing ability modifiers without tying UI logic to fixed source types (not race/class-only).
- Prevent confusion by showing concise totals first and detailed provenance on demand.

## UX Model

### Structure

- Top: mode selector, driven by `abilitiesConfig.modes`.
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
- Single tap/click adjusts by 1 step in MVP.
- Native number input keyboard behavior is supported in MVP; custom accelerated shortcuts are out of current scope.
- Disable stepper buttons when min/max or point-cap constraints would be violated.
- Keep spent/remaining points visible while stepping so users can adjust without scanning elsewhere.
- Provide subtle feedback for blocked actions (disabled state + brief reason text near row).

### Source Breakdown (MVP table)

- Group by dynamic `sourceType` values from active effects (for example: race, class, feat, template, rules module, extension content).
- Render only groups with non-zero net effect for that ability.
- Within each rendered group, show line items with source label and signed value.
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
