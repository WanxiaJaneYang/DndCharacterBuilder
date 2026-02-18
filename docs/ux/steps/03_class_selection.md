# UX Step 03 - Class Selection

This document outlines the **Class聽selection** step of the character creation wizard.  It follows a similar pattern to the race selection step but includes class鈥憇pecific nuances such as hit points, base attack bonus and saving throw progressions.

## Goal

Allow the user to select a starting class for their level鈥? character.  Present classes in an approachable way, emphasising flavour and mechanical identity.  Support both new and returning players with concise summaries and easy access to full details.  Only one class can be chosen during character creation.

## User Intent

- **New聽Player:** May not know what a class does.  Needs to understand the broad playstyle and any prerequisites (if present) before making a selection.
- **Returning聽Player:** Likely has a class in mind.  Needs quick selection with minimal reading.

## Layout & Interaction

Similar to race selection, the class step uses a **card grid** UI:

- Each class card shows:
  - Class name.
  - A representative image.
  - A short summary describing the class鈥檚 archetype (e.g. 鈥淔ighters excel at combat with weapons and armor.鈥?.
  - A **View聽Details** call鈥憈o鈥慳ction.
- Clicking a card selects it; only one class can be selected at a time.
- **View聽Details** opens a modal with a longer description, hit die, base attack bonus progression, saving throws and class features from the JSON definition.
- Validation ensures one class is selected before allowing the user to proceed.

All UI content must be sourced from the class definitions in the data pack.

### States

- **Empty:** Class cards display; nothing selected.
- **Selected:** One class highlighted; user may click another to change selection.
- **Error:** Attempting to proceed without a selection triggers a validation error.

## Data Requirements

From each class entity in `entities/classes.json` the UI needs:

- `id` 鈥?stable class identifier.
- `name` 鈥?display name.
- `summary` 鈥?one鈥憇entence class description.
- `description` 鈥?full text for the modal.
- `image` 鈥?optional illustration.
- `hit_die` 鈥?class hit die (e.g. d10 for Fighter).  Used in details view.
- `base_attack_bonus` 鈥?array or formula describing BAB progression.  Used in details view and for derived stats.
- `saves` 鈥?description of good/poor saving throws (Fort/Ref/Will).
- `features` 鈥?list of class features for level聽1; displayed in details view.
- `prerequisites` 鈥?if any (e.g. requires certain alignment or edition).

## Validation & Gating

- Exactly one class must be selected.
- If prerequisites are specified, only classes satisfying them should be selectable.
- The 鈥淣ext鈥?button is disabled until a valid selection is made.

## Acceptance Criteria

- The class list is populated from JSON and not hardcoded.
- Each card displays image, name and summary.  Clicking **View聽Details** shows detailed information.
- Only one class can be selected at once.
- The step enforces prerequisites and validation.
- The selected class is stored in the engine state and influences derived statistics (hit points, BAB, saves, skill points, etc.).

## TODO

- Add `summary`, `description`, `image`, `hit_die`, `base_attack_bonus`, `saves`, and `features` fields to the class schema.
- Determine how to represent BAB and saves in JSON for level鈥? characters.
- Implement the class details modal UI component.
- Write tests for class selection validation and engine integration.

## Checklist

- [ ] Class cards render with UI metadata.
- [ ] Details modal includes hit die, BAB, saves and features.
- [ ] Validation enforces single selection and prerequisites.
- [ ] Selected class stored in engine state.
- [ ] Tests cover selection and engine integration.
