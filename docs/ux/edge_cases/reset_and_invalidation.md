# UX Edge Case – Reset & Invalidation

This document discusses edge cases related to **resetting user choices** and **invalidating selections** when earlier decisions change the availability of later options.  Handling these cases gracefully is important for a smooth user experience and prevents confusion when the data‑driven flow dynamically hides or invalidates options.

## Resetting Selections

Users may wish to reset their progress at various stages:

- **Reset entire character creation:** Provide a “Start Over” option that clears all state and returns the user to the Rules Setup step.  This should include a confirmation prompt to avoid accidental loss of work.
- **Reset current step:** On steps like abilities or skills, allow resetting inputs to their default values (e.g. reset ability scores to base values, reset skill points to zero).  The UI should include a “Reset” button in these steps.

### Design Considerations

- **Visibility:** Reset options should be easily discoverable but not intrusive.
- **Confirmation:** Ask the user to confirm before resetting all progress.
- **Feedback:** After resetting, display a success message or highlight the default state.
- **Undo:** Consider allowing a simple “undo” action immediately after resetting (optional for MVP).

## Invalidation due to Earlier Changes

Because the wizard is data driven, choices made in one step may affect options in subsequent steps.  For example:

- Changing race may invalidate or disable previously selected feats, skills or equipment if they no longer meet prerequisites.
- Changing class may alter the number of skill points or feats available.
- Changing ability scores may cause feats to lose prerequisite qualification.

### Handling Invalidation

- **Detect:** When the user changes a selection in an earlier step, run validation across all later steps.
- **Highlight:** Mark any affected selections with a warning (e.g. “This feat is no longer valid because you changed your race.”).
- **Require fix:** Prevent progression until invalid selections are resolved.  Guide the user to update or remove them.
- **Automatic removal:** Optionally, automatically deselect invalid choices and notify the user.  Provide a message explaining what changed.

## TODO

- Define the exact behaviour for resetting progress (step vs entire flow) and document it in UI spec.
- Implement change detection in the engine or UI layer to recompute validity when earlier steps change.
- Decide whether invalid choices should be automatically removed or left for manual correction (and implement accordingly).

## Checklist

- [ ] “Start Over” functionality implemented with confirmation.
- [ ] Per‑step reset buttons implemented where applicable.
- [ ] Invalidation detection triggers when earlier choices change.
- [ ] UI highlights invalidated choices and guides user to fix them.