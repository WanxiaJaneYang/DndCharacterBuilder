# Ability Score Page Product Design (Data-Driven, Edition-Bound)

Date: 2026-02-20  
Owner: Product Design + Engineering  
Status: Approved for planning (updated with 2026-02-23 UX direction)

## 1) Problem Statement

The current Ability Score page is incomplete for production use:
- UX is not easy to use for new and returning players.
- Existing ability modifiers (from race/class/rules/selected features) are not clearly surfaced during ability assignment.
- Generation methods are incomplete and not edition-aware.

The product direction is strictly data-driven. Rule behavior must not be hardcoded in frontend logic.

## 2) Goals and Scope

MVP goals:
- Support 3 ability generation modes in the Ability step:
  1. Point Buy
  2. PHB Method (edition-defined)
  3. Roll Sets (generate 5 full sets, choose 1, then assign)
- Bind defaults and constraints to selected edition/ruleset.
- Show existing modifiers directly on the Ability step.
- Add point-buy cap customization (using edition-configured table and bounds).

Non-MVP:
- Full custom point-buy table authoring + persistence/editing UI.

## 3) Product Decisions (Locked)

- No hardcoded edition rules in app logic.
- Edition packs define generation behavior and defaults.
- MVP must expose all 3 generation modes.
- 3e and 5e may have different point-buy tables and PHB defaults.
- Point-buy cap is customizable in MVP within configured bounds.
- Full custom table authoring is deferred to later version.

Additional locked UX decisions (2026-02-23):
- Ability generation method selection uses a dropdown (`select`) rather than radio controls.
- Roll Sets uses drag/drop assignment of rolled values to abilities; direct manual score edits are disabled in this mode.
- Point Buy includes an inline collapsible score-cost reference (and optional external link).
- Point Buy steppers must be on the same side of the numeric input.
- Modifier source details are shown on hover/focus, while default table view remains concise.

## 4) Data-Driven Configuration Design

Add structured config for the `abilities` flow step (pack-owned).

Conceptual shape:
- `abilitiesConfig.modes`: ordered enabled modes, e.g. `["pointBuy", "phb", "rollSets"]`
- `abilitiesConfig.defaultMode`: default selected mode
- `abilitiesConfig.pointBuy`:
  - `costTable`: score-to-cost mapping
  - `defaultPointCap`
  - `minPointCap`, `maxPointCap`, `pointCapStep`
  - `minScore`, `maxScore`
- `abilitiesConfig.phb`:
  - `methodType`: `standardArray` or `manualRange`
  - `standardArray` (if applicable)
  - `manualRange` (if applicable)
- `abilitiesConfig.rollSets`:
  - `setsCount` (MVP default can be 5 via data)
  - `rollFormula` (e.g., `4d6_drop_lowest`)
  - `scoresPerSet` (6)
  - `assignmentPolicy` (`assign_after_pick`)

Presentation config:
- `abilityPresentation.showExistingModifiers`
- `abilityPresentation.groupBy` (`sourceType` for grouped modifier summaries)
- `abilityPresentation.hideZeroEffectGroups`
- `abilityPresentation.sourceTypeLabels` for localized source-group labels
- `abilityPresentation.modeUi`:
  - `labelKey` per mode id (e.g. `pointBuy`, `phb`, `rollSets`) for selector labels
  - `hintKey` per mode id for the helper tooltip content shown beside the selector

## 5) UX Interaction Model

Ability step layout:
- Top: generation mode selector (driven by `abilitiesConfig.modes`).
- Main left: mode workspace (controls change by selected mode).
- Main right: live ability summary table for STR/DEX/CON/INT/WIS/CHA.

Per-ability summary columns:
- Base
- Existing Modifiers
- Final
- Derived Modifier

Mode behavior:

1. Point Buy
- Six ability controls constrained by configured score bounds.
- Point cap control (input/slider) constrained by configured cap bounds.
- Live cost spent/remaining via configured cost table.
- Continue blocked if over cap or invalid.

2. PHB
- Rendered from config:
  - `standardArray`: each value must be used exactly once.
  - `manualRange`: each ability must be within configured range.
- Continue blocked on validation failure.

3. Roll Sets
- Generate configured number of sets.
- User selects one set.
- User assigns chosen set values to abilities.
- Persist roll output + selected set in state for reproducible reviews.

## 6) Validation and Responsibility Boundaries

- UI performs immediate guardrails and user feedback.
- Engine is source of truth for final ability-step validation.
- Ability validation is driven by flow config, not constants.
- `Next` is gated by ability validation success.

## 7) Existing Modifiers Visibility

Ability step should show currently known modifiers from selected choices/entities that already apply at this stage.
- Typical sources: selected race, selected class effects (if available by step order), always-on rules, selected feats if relevant.
- Representation should match provenance-style explanations but simplified for comprehension.

This removes the current gap where users only discover effective scores later.

## 8) State and Auditability Requirements

Persist enough state to make ability generation explainable:
- Selected generation mode
- Mode-specific payload:
  - Point buy: scores + cap
  - PHB: array/manual assignment state
  - Roll sets: generated sets + chosen set + assignment

Review page can continue using provenance details; ability step should expose practical summary early.

## 9) Risks and Mitigations

Risk: Schema growth increases complexity.
- Mitigation: keep config minimal and normalize at load time.

Risk: Different editions need divergent defaults.
- Mitigation: pack-level config and strict schema validation.

Risk: Rolling method reproducibility.
- Mitigation: persist generated data in state; do not regenerate silently.

## 10) Acceptance Criteria (MVP)

- Ability step exposes all 3 modes from config.
- Point-buy table and defaults come from edition data.
- User can customize point cap within configured range.
- Existing modifiers are visible in ability-step table.
- Engine validates ability selection using config rules.
- 3e and 5e can define different defaults without code branching.
- No hardcoded rule constants for edition behavior in frontend.

## 11) Out of Scope

- Full custom table editor and saved custom templates.
- Cross-session sharing/import/export of custom generation presets.

## 12) Next Step

Proceed to implementation planning with explicit tasks for:
- schema changes
- pack/flow data additions
- engine validation and state model
- web UI rendering
- tests and localization updates

## 13) Follow-Up Implementation Task List (UI Improvements)

- [ ] Replace Ability mode radio group with dropdown selector (`pointBuy` / `phb` / `rollSets`).
- [ ] Refactor mode-change state handling to keep existing `abilitiesMeta` compatibility.
- [ ] Build Roll Sets drag/drop assignment UI (draggable score chips + six ability drop targets).
- [ ] Enforce one-use-per-rolled-value assignment in Roll Sets mode.
- [ ] Disable direct number-input and stepper edits while `rollSets` mode is active.
- [ ] Persist roll assignment map in `abilitiesMeta` for deterministic review/export.
- [ ] Add completion validation for roll-set assignment (all six abilities assigned) and gate `Next`.
- [ ] Add Point Buy collapsible cost-reference section sourced from `abilitiesConfig.pointBuy.costTable`.
- [ ] Optionally support pack-provided external rules link in Point Buy reference section.
- [ ] Move point-buy `+` / `-` steppers to the same side of each number input.
- [ ] Keep stepper hit targets >= 40x40 across breakpoints after layout change.
- [ ] Change modifier-source details from expanded nested lists to hover/focus tooltip/popover.
- [ ] Add accessible fallback for source details (keyboard focus + `aria-describedby`/title behavior).
- [ ] Update English + Chinese UI copy keys for new controls (dropdown label text, point-buy reference labels, roll-set assignment hints).
- [ ] Update ability-step RTL tests for new interaction model.
- [ ] Add tests for drag/drop assignment invariants and mode-based edit restrictions.
- [ ] Add tests for point-buy reference collapse/expand behavior.
- [ ] Add tests for modifier-source hover/focus detail reveal.
