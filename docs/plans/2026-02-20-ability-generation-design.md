# Ability Score Page Product Design (Data-Driven, Edition-Bound)

Date: 2026-02-20  
Owner: Product Design + Engineering  
Status: Approved for planning

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
- Architecture supports edition-specific defaults (for example, 3e and 5e can differ), while MVP implementation targets 3.5 only.
- Point-buy cap is customizable in MVP within configured bounds.
- Full custom table authoring is deferred to later version.

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
- `abilityPresentation.modifierSources` (e.g. race/class/rules/feats)

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
- Ability generation rules are loaded from config without hardcoded edition branching, and are validated for the active 3.5 pack in MVP.
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
