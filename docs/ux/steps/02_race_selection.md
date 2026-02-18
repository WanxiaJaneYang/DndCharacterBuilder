# UX Step 02 - Race Selection

This document describes the **Race聽selection** step of the character creation wizard.  It defines the purpose, user expectations, interface requirements, and validation rules for choosing a race.  As with all steps, the content is driven by JSON definitions in the rule packs.

## Goal

Help the user select a race suitable for their character.  For beginners, the UI should be discoverable and not overwhelm them with text.  Each race should present a visual identity, a brief summary of its flavour and mechanics, and easy access to full details.  Validation should ensure exactly one race is selected.

## User Intent

- **New聽Player:** Understands little about D&D races. Needs guidance and context.  Wants to browse options visually and read more when curious.
- **Returning聽Player:** Likely knows the race they want.  Needs quick selection without reading long descriptions.

## Layout & Interaction

The race step uses a **card grid** UI:

- Each race is a card with:
  - An image (or placeholder icon).
  - Race name.
  - A short, one鈥搒entence summary of the race鈥檚 flavour (e.g. 鈥淗umans are adaptable and ambitious.鈥?.
  - A call鈥憈o鈥慳ction to **View聽Details**.
- Clicking a card highlights it as the selected race.  Only one race can be selected at a time.
- Clicking **View聽Details** opens a modal or side panel showing the full description and mechanical traits of the race.
- A 鈥淣ext鈥?button advances to the next step once a race is selected and no validation errors remain.

All of the above fields are populated from the `entities/races.json` in the current pack.  UI fields (image, summary, description) must be defined in the schema.

### States

- **Empty:** The step loads and displays all races; no race is selected yet.
- **Selected:** Exactly one race is selected and highlighted.
- **Error:** If the user tries to continue without selecting a race, an error message appears and the step stays blocked.

## Data Requirements

The race step consumes the following fields from each race entity:

- `id` 鈥?stable identifier used by the engine.
- `name` 鈥?display name.
- `summary` 鈥?short one鈥搒entence description for the card.
- `description` 鈥?longer text for the details modal.
- `image` 鈥?URL or asset path for the card illustration (optional; fallback to a default icon).
- `effects` 鈥?mechanical modifiers applied when the race is selected (not displayed in UI but used by the engine).
- `prerequisites` 鈥?conditions that must be satisfied (e.g. certain editions).  These may hide or disable the race from selection if unmet.

The list of races and their fields come from the currently resolved pack set.  No race should be hardcoded in the UI.

## Validation & Gating

- The engine must enforce that **exactly one race** is selected.  Incomplete selection should block progress.
- If prerequisites are defined for a race, the UI must disable or hide it accordingly.  For example, a race from an optional pack should only appear when that pack is enabled.
- The UI should display a validation error if the user attempts to proceed without a selection.

## Acceptance Criteria

- Race cards render using JSON metadata; no hardcoded race names or descriptions.
- Exactly one race can be selected at a time.  Selecting a different card toggles the previous selection off.
- Clicking 鈥淰iew聽Details鈥?opens a modal with the full description from the JSON.
- The 鈥淣ext鈥?button remains disabled until a race is selected and validation passes.
- The selected race is stored in the engine state and is used to apply modifiers to derived stats.

## TODO

- Define placeholder images for races in the minimal SRD pack.
- Ensure the race schema includes `summary`, `description` and `image` fields.
- Decide how to handle races from optional packs (hide vs disable when not enabled).
- Implement the details modal component (see UI spec).
- Test the validation logic via unit tests and contract fixtures.

## Checklist

- [ ] Card grid layout implemented.
- [ ] Race JSON updated with UI metadata fields.
- [ ] Details modal implemented.
- [ ] Validation rules integrated with engine state.
- [ ] User can proceed only when a race is selected.
