# UX Step 07 - Equipment Selection

This document covers the **Equipment** step, where the user chooses starting weapons, armor and other gear for their character.  The exact options depend on the selected class and the starting equipment rules (kit vs gold) defined for the edition.

## Goal

Allow the user to select appropriate starting equipment while respecting the rules for their class, race and chosen mode (kit or gold).  Provide clear categories (weapons, armor, adventuring gear) and ensure the user understands what they鈥檙e choosing.

## User Intent

- **New聽Player:** Needs to know which items their character can start with.  Should be offered a curated list or kit to avoid analysis paralysis.  Might appreciate a recommended kit based on class (e.g. fighter鈥檚 equipment kit).
- **Returning聽Player:** May want to manually pick items within a starting budget or kit allowance.

## Layout & Interaction

The equipment step can be split into two parts:

1. **Starting Equipment Mode:**
   - Choose between **Kit** and **Gold** (selectable from previous steps or on this page).
   - **Kit**: A predefined list of items per class (e.g. Fighter starts with chain mail, longsword and shield).  Show the kit contents and allow the user to accept it.
   - **Gold**: The user receives starting gold (e.g. 150聽gp) and can select items up to that value from a list or shop UI.  MVP may postpone this mode but must record the selection.
2. **Item Selection:**
   - Display categories of items (weapons, armor, shields, miscellaneous gear) sourced from the pack JSON.
   - Show item name, cost, weight, and a short description.
   - Allow multiple selections where appropriate (e.g. arrows, rations).  Each item adds to total weight and cost.
   - Validate that the total cost does not exceed starting gold in **Gold** mode; in **Kit** mode, selections are fixed.

## Data Requirements

Items are defined in `entities/items.json`:

- `id` 鈥?stable identifier.
- `name` 鈥?display name.
- `category` 鈥?weapon, armor, shield, gear, etc.
- `cost` 鈥?cost in gold pieces.
- `weight` 鈥?weight in pounds (optional; used in encumbrance calculations).
- `summary` 鈥?short description.
- `description` 鈥?detailed description (for details modal).
- `rules` 鈥?any rules effects (e.g. proficiency requirement) 鈥?used by engine.

Starting equipment kits may be defined in `rules.json` or a separate file, keyed by class and potentially race.

## Validation & Gating

- In **Kit** mode: ensure the user accepts the predefined kit; no editing allowed in MVP.
- In **Gold** mode: enforce that total cost 鈮?starting gold; warn when approaching limit; block when exceeded.
- Ensure that only items the character is proficient with or allowed to carry appear, based on class/race.

## Acceptance Criteria

- Equipment mode can be selected and stored in engine state.
- Item lists come from JSON and respect category filters.
- In Kit mode, items are fixed and displayed for confirmation.
- In Gold mode, items can be added up to the budget; UI shows remaining gold.
- Export includes starting equipment mode and list of selected items.

## TODO

- Define starting equipment kits in the data pack for the Fighter/Human example.
- Decide whether to implement a simplified Gold mode or postpone it until after MVP.
- Extend the item schema to include summary and description fields.
- Implement item list UI with filtering and selection.
- Write tests for budget enforcement and kit selection.

## Checklist

- [ ] Equipment mode selection implemented and stored.
- [ ] Item categories loaded from JSON and displayed.
- [ ] Kit items defined and presented for confirmation.
- [ ] Gold mode budget enforced (if implemented).
- [ ] Items included in export with provenance.
