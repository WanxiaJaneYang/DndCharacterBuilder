# UX Step 05 - Feat Selection

This document describes the **Feat selection** step.  Feats are special abilities that grant bonuses or unique actions.  In D&D 3.5 SRD, characters typically receive a feat at level 1 and additional feats at later levels based on their class and race.

## Goal

Allow the user to select feats that enhance their character, while enforcing prerequisites and selection limits.  Provide a clear listing of available feats with summaries and detailed descriptions.

## User Intent

- **New Player:** Needs help understanding what feats do and which are appropriate.  Should see only feats they qualify for.  May need explanations of prerequisites (e.g. ability scores, other feats).
- **Returning Player:** Wants to quickly filter or scroll to find their preferred feats.  Requires full descriptions on demand.

## Layout & Interaction

The feats step should present a **list or card grid** of available feats:

- Each feat displays:
  - Name.
  - Short summary of its effect.
  - A call-to-action to **View Details** showing the full description and prerequisites.
- Feats can be selected via checkboxes or card toggles.  The allowed number of selections is determined by the engine (based on race, class or other factors).
- The UI must disable feats for which the user does not meet prerequisites.  An explanation tooltip should indicate why a feat is not available.
- Once the maximum number of feats is selected, additional feats should be disabled until the user deselects one.

## Data Requirements

From each feat entity in `entities/feats.json`, the UI requires:

- `id`: stable identifier.
- `name`: display name.
- `summary`: short description displayed in the list.
- `description`: full text for details view.
- `prerequisites`: conditions such as minimum ability scores, other feats or level.  The engine resolves these.
- `effects`: modifiers applied to the character sheet when the feat is selected (not displayed directly in the UI).

The engine must know how many feats a character is allowed at level 1.  This may depend on race or class (e.g. humans get an extra feat).

## Validation & Gating

- Only feats for which prerequisites are satisfied can be selected.
- The number of selected feats must not exceed the allowed count.  Attempting to exceed the limit should show an error.
- The selection is stored in engine state and affects derived stats.

## Acceptance Criteria

- Feat list is generated from JSON; no hardcoded feats.
- The UI indicates feats that are unavailable due to prerequisites.
- The UI enforces the maximum number of feats allowed.
- Selecting a feat adds it to state and applies its effects via the engine.
- The user cannot proceed until they have selected the required number of feats (e.g. exactly one in the minimal SRD pack).

## TODO

- Finalise the feat schema to include `summary`, `description`, `prerequisites` and `effects`.
- Implement logic in the engine to determine the number of feats allowed based on race/class.
- Create the feat selection UI and details modal.
- Write tests that ensure the engine correctly validates prerequisites and selection limits.

## Checklist

- [ ] Feat schema fields added and populated in data pack.
- [ ] UI shows available feats and disables ones that cannot be selected.
- [ ] Engine determines feat allowance and validates prerequisites.
- [ ] Selection stored in state and affects derived stats.
- [ ] Tests for prereq enforcement and feat limits.
