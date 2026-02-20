# UX Step 04 - Ability Scores

This document defines the **Ability Scores** step.  Characters in D&D have six ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom and Charisma.  The value of each ability score determines a modifier that affects skills, attacks and saves.

## Goal

Provide a clear and beginner-friendly method for assigning ability scores.  Methods are data-driven from flow config and can vary by edition.

MVP supports:

1. **Point Buy** (edition-configured defaults, including cap and score-cost table).
2. **PHB Method** (edition-configured; e.g. standard array/manual-range variants).
3. **Roll Sets** (generate configured sets and pick one).

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

### PHB and Roll Sets

- PHB mode behavior is read from flow config (e.g. standard array or manual range).
- Roll Sets mode uses configured generation settings and requires selecting a generated set.
- Both modes must produce final base scores for all six abilities before continuing.

Regardless of method:

- A "Reset" option returns values to the default (e.g. all 8s for point buy).
- Derived modifiers update in real time.
- Existing race/class/rule modifiers are shown on the Ability step (base, adjustments, final, modifier) so players can see effective outcomes immediately.
- Once complete, store the scores in engine state so racial bonuses and class effects can be applied.

## Data Requirements

The flow JSON must specify `abilitiesConfig`, including:

- enabled `modes` and `defaultMode`
- `pointBuy` config (cost table, cap defaults/range, score bounds)
- `phb` config
- `rollSets` config

The engine validates abilities against this config.  Racial ability adjustments apply after base scores are selected.

## Validation & Gating

- Ensure that all six abilities have values.
- For point buy, total cost <= available points; if cost > points, block progression and show error.
- For PHB mode, scores must satisfy configured PHB rules.
- For roll sets, one generated set must be selected.
- Show error messages near invalid fields and disable Next until resolved.

## Acceptance Criteria

- The ability assignment method is configured via flow JSON, not hardcoded.
- Point buy enforces the correct cost table and point total.
- PHB and roll-set validations are enforced from flow config.
- Ability modifiers update live in the UI.
- Racial adjustments apply after ability scores are stored (engine must handle this).

## TODO

- Implement point buy interface with live point tracking.
- Define cost table in the engine or configuration.
- Decide default method for 3.5 SRD (manual vs point buy) and document it in the flow.
- Add tooltips explaining each ability's impact.
- Write unit tests for validation logic.

## Checklist

- [x] Ability mode read from flow JSON.
- [x] Point buy interface implemented with configured cost table and cap.
- [x] Existing modifiers shown in Ability step summary.
- [x] Engine validates point buy / PHB / roll-set requirements.
- [x] Tests cover config parsing, engine validation, and web rendering.
