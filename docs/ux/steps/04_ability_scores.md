# UX Step 04 - Ability Scores

This document defines the **Ability Scores** step.  Characters in D&D have six ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom and Charisma.  The value of each ability score determines a modifier that affects skills, attacks and saves.

## Goal

Provide a clear and beginner鈥慺riendly method for assigning ability scores.  Two approaches are supported:

1. **Point聽Buy** (32 points) 鈥?recommended for newcomers because it guides them to create balanced characters.
2. **Manual Entry** 鈥?veterans can assign scores manually (within allowed ranges) if desired.

The method is defined in the flow JSON.  If unspecified, default to manual entry for MVP and refine later.

## User Intent

- **New聽Player:** Needs a structured method that prevents illegal scores and explains the consequences of high or low values.
- **Returning聽Player:** May prefer to assign numbers directly and follow house rules.

## Layout & Interaction

Depending on the selected method:

### Point聽Buy 32

- Display six ability score fields with dropdowns or number inputs.
- Show available points remaining as the user adjusts values.
- Each score has a cost; higher values cost more.  For 3.5 SRD, the cost table is typically:
  - 8 鈬?0聽points
  - 9 鈬?1聽point
  - 10 鈬?2聽points
  - 11 鈬?3聽points
  - 12 鈬?4聽points
  - 13 鈬?5聽points
  - 14 鈬?6聽points
  - 15 鈬?8聽points
  - 16 鈬?10聽points
  - 17 鈬?13聽points
  - 18 鈬?16聽points
- Enforce the total point limit and the minimum/maximum per score (8鈥?8 before racial adjustments for 3.5).
- Display the resulting ability modifier next to each ability as the user updates values.
- Provide a short explanation of what each ability represents (e.g. Strength affects melee attacks and damage).

### Manual Entry

- Present six numeric inputs labelled with each ability.
- Enforce valid range (3鈥?8) for each ability in 3.5 SRD.
- Provide the same explanation and live modifier calculation.
- Validate that the user enters a value for each ability before proceeding.

Regardless of method:

- A 鈥淩eset鈥?option returns values to the default (e.g. all 8s for point buy).
- Derived modifiers update in real time.
- Once complete, store the scores in engine state so racial bonuses and class effects can be applied.

## Data Requirements

The flow JSON must specify:

- `method`: `"pointBuy"` or `"manual"` (or other in future).
- `points`: number of points for point buy (default 32).
- `min_score` and `max_score`: valid range for manual entry (default 3鈥?8).

The engine must define cost tables and validation rules.  Racial ability adjustments should apply after scores are selected and before derived stats are finalised.

## Validation & Gating

- Ensure that all six abilities have values.
- For point buy, total cost 鈮?available points; if cost > points, block progression and show error.
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
- Add tooltips explaining each ability鈥檚 impact.
- Write unit tests for validation logic.

## Checklist

- [ ] Ability method read from flow JSON.
- [ ] Point buy interface implemented with proper cost table.
- [ ] Manual entry validated and stored.
- [ ] Racial adjustments applied after abilities.
- [ ] Tests cover validation and cost calculation.
