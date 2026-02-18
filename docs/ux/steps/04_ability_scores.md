# UX Step 04 - Ability Scores

This document defines the **Ability Scores** step.  Characters in D&D have six ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom and Charisma.  The value of each ability score determines a modifier that affects skills, attacks and saves.

## Goal

Provide a clear and beginner-friendly method for assigning ability scores.  Two approaches are supported:

1. **Point Buy** (32 points) - recommended for newcomers because it guides them to create balanced characters.
2. **Manual Entry** - veterans can assign scores manually (within allowed ranges) if desired.

The method is defined in the flow JSON.  If unspecified, default to manual entry for MVP and refine later.

## User Intent

- **New Player:** Needs a structured method that prevents illegal scores and explains the consequences of high or low values.
- **Returning Player:** May prefer to assign numbers directly and follow house rules.

## Layout & Interaction

Depending on the selected method:

### Point Buy (32)

- Display six ability score fields with dropdowns or number inputs.
- Show available points remaining as the user adjusts values.
- Each score has a cost; higher values cost more.  For 3.5 SRD, the cost table is typically:
  - 8 -> 0 points
  - 9 -> 1 point
  - 10 -> 2 points
  - 11 -> 3 points
  - 12 -> 4 points
  - 13 -> 5 points
  - 14 -> 6 points
  - 15 -> 8 points
  - 16 -> 10 points
  - 17 -> 13 points
  - 18 -> 16 points
- Enforce the total point limit and the minimum/maximum per score (8-18 before racial adjustments for 3.5).
- Display the resulting ability modifier next to each ability as the user updates values.
- Provide a short explanation of what each ability represents (e.g. Strength affects melee attacks and damage).

### Manual Entry

- Present six numeric inputs labelled with each ability.
- Enforce valid range (3-18) for each ability in 3.5 SRD.
- Provide the same explanation and live modifier calculation.
- Validate that the user enters a value for each ability before proceeding.

Regardless of method:

- A "Reset" option returns values to the default (e.g. all 8s for point buy).
- Derived modifiers update in real time.
- Once complete, store the scores in engine state so racial bonuses and class effects can be applied.

## Data Requirements

The flow JSON must specify:

- `method`: `"pointBuy"` or `"manual"` (or other in future).
- `points`: number of points for point buy (default 32).
- `min_score` and `max_score`: valid range for manual entry (default 3-18).

The engine must define cost tables and validation rules.  Racial ability adjustments should apply after scores are selected and before derived stats are finalised.

## Validation & Gating

- Ensure that all six abilities have values.
- For point buy, total cost <= available points; if cost > points, block progression and show error.
- For manual entry, each score must fall within the defined range.
- Show error messages near invalid fields and disable Next until resolved.

## Acceptance Criteria

- The ability assignment method is configured via flow JSON, not hardcoded.
- Point buy enforces the correct cost table and point total.
- Manual entry enforces valid ranges.
- Ability modifiers update live in the UI.
- Racial adjustments apply after ability scores are stored (engine must handle this).

## TODO

- Implement point buy interface with live point tracking.
- Define cost table in the engine or configuration.
- Decide default method for 3.5 SRD (manual vs point buy) and document it in the flow.
- Add tooltips explaining each ability's impact.
- Write unit tests for validation logic.

## Checklist

- [ ] Ability method read from flow JSON.
- [ ] Point buy interface implemented with proper cost table.
- [ ] Manual entry validated and stored.
- [ ] Racial adjustments applied after abilities.
- [ ] Tests cover validation and cost calculation.
