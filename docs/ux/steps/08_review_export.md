# UX Step 08 - Review & Export

This document specifies the **Review & Export** step, where the user examines their completed character, checks all selections and derived stats, and downloads the final output.  This is the last step in the level-1 character creation flow.

## Goal

Present a comprehensive summary of the character, including selected race, class, ability scores (with modifiers), feats, skills, equipment and derived statistics (HP, AC, saves, attack bonuses, skill modifiers, etc.).  Allow the user to verify the information, view provenance, and then export the character sheet in JSON (and optionally HTML) format.

This step should be implemented in phases aligned with `docs/product/PRD.md`:

- **Phase 1 (Core Playability):** identity/progression basics, AC touch/flat-footed, saves breakdown, HP breakdown, initiative/grapple, attack lines.
- **Phase 2 (Non-caster completeness):** feat/trait summaries, skill misc/ACP visibility, equipment/load and movement detail.
- **Phase 3 (Caster + progression):** spellcasting blocks, multiclass progression surfaces, expanded defenses/resistances.

## User Intent

- **New Player:** Needs reassurance that their character is valid.  Wants to see where each number comes from and may need guidance on what everything means.
- **Returning Player:** Wants to quickly scan the final sheet, adjust any mistakes and download the file.

## Layout & Interaction

The review page should display sections summarising each aspect of the character:

- **Identity:** Character name, level, race, class, alignment (if chosen), background (if applicable).
- **Abilities:** A breakdown table with `Ability | Base | Adjustments | Final | Modifier`.  
  - `Base`: user-entered score.  
  - `Adjustments`: each racial/class/rule/item modifier from provenance.  
  - `Final` + `Modifier`: computed end result.
- **Feats:** List of selected feats with brief reminders of their effects; clicking a feat reveals full text.
- **Skills:** List of skills with ranks, modifiers, class/cross-class indicators and ability dependencies.
- **Equipment:** Items selected, starting equipment mode (kit vs gold), total weight and cost (if applicable).
- **Derived Stats:** HP, AC, initiative, speed, BAB, saves (Fort/Ref/Will); shown in a table with `Base | Adjustments | Final`.
- **Calculation Trace:** adjustments must be listed as readable rows (`+2 Elf`, `=10 Fighter`, etc.) so users can follow the formula without opening raw JSON.
- **Pack Info:** Display the selected edition/version and the list of enabled rule packs with versions.  Show the pack fingerprint hash for reproducibility.
- **Actions:**
  - **Edit** buttons for each section allow the user to go back and modify previous steps.  The wizard should support non-linear edits (e.g. go back from review to feats step, adjust selection and return to review).
  - **Export JSON:** Download the character sheet as a JSON file including selections, derived stats, enabled packs, fingerprint and starting equipment mode.
  - **Export HTML:** (optional) Download or print a formatted character sheet in HTML or PDF.  This is not required in MVP but may be included as a future enhancement.

## Data Requirements

The engine must provide:

- Final derived stats with provenance chains per field.
- The list of enabled packs and their versions.
- The pack set fingerprint.
- A serialisable state of user choices (race, class, abilities, feats, skills, items) and any starting equipment mode.

The UI must be able to render these structures and provide interactive provenance explanations.

## Validation & Gating

- There should be no validation errors at this point.  The review step is only accessible when all previous steps have passed validation.
- If the user goes back and changes something, derived stats and selections must update accordingly when returning to review.

## Acceptance Criteria

- The review page shows all selections and derived stats clearly.
- Provenance can be accessed for each derived number (e.g. AC shows base 10 + armor + shield + Dex modifier).  This may use tooltips or an expandable explanation panel.
- The user can go back to any previous step and return to review without losing progress.
- Export JSON includes all required fields and the pack fingerprint.
- (Optional) Export HTML provides a printable character sheet.

## TODO

- Design the review layout for clarity and readability.
- Implement provenance tooltips or panels that reference the engine's provenance data.
- Ensure that editing previous steps correctly updates the review content.
- Keep review sections aligned with the phased export model documented in `docs/data/EXPORT_SCHEMA.md`.
- Consider implementing a basic HTML export template.

## Checklist

- [x] Review page implemented with sections for identity, abilities, combat/defense, skills, rules decisions, and pack info.
- [x] Provenance display implemented (calculation rows plus raw provenance panel toggle).
- [x] Export JSON logic implemented and tested.
- [ ] Navigation back to previous steps and forward again works without data loss.
- [x] Pack fingerprint displayed.
