# UX Edge Case – Pack Conflicts

This document addresses scenarios where **multiple rule packs conflict** with each other.  As the product will eventually support loading multiple editions and home‑brew expansions, there is a risk that two packs define overlapping entities, incompatible rules or mutually exclusive options.  The UX must help users understand and resolve these conflicts.

## Context

When users select several optional rule packs alongside the base SRD, the application merges their contents.  Conflicts can arise in a few ways:

- Two packs define the same entity (e.g. two different `Human` race definitions).
- A pack attempts to override a core rule in a way that breaks another pack’s assumptions.
- Packs require incompatible prerequisites (e.g. one requires edition 3.5, another requires edition 5R).
- Packs introduce steps that the flow does not support when combined.

## Design Goals

1. **Detect conflicts early.**  Identify clashing entity IDs or incompatible prerequisites when the user selects their rule sources.
2. **Inform the user.**  Clearly explain which packs conflict and why.  Provide guidance on how to resolve the conflict (e.g. choose one pack or adjust edition selection).
3. **Prevent inconsistent state.**  Do not allow the wizard to proceed with conflicting packs enabled.  Either disable the conflicting pack or ask the user to disable it.
4. **Remain transparent.**  Show which pack definitions prevail when overrides occur and record this in provenance.

## Handling Conflicts

1. **Conflict Detection:**  When the user enables packs, run a conflict detection routine:
   - Check for duplicate `id` fields across entities (e.g. the same race defined twice).  Log the source of each duplicate.
   - Evaluate manifest prerequisites (edition, dependencies) to find incompatible combinations.
   - Inspect flow definitions to ensure merged flows are coherent (no missing required steps).

2. **User Notification:**  Display a summary of conflicts to the user:
   - List the conflicting packs and the entities involved.
   - Describe the resolution options: disable one of the packs or accept one pack’s version (override).  In later versions, the UI may allow reordering pack priorities.

3. **Override Rules:**  If packs have a defined priority, the higher‑priority pack’s definitions override the lower.  Make this explicit in the UI and provenance.  The user should see which pack took precedence.

4. **Resolution Flow:**  Provide simple resolution options:
   - **Disable one pack.**  Uncheck the optional pack causing the conflict.
   - **Change edition/version.**  Switch to a different edition that is compatible with the packs selected.
   - **Proceed with overrides.**  Accept the higher priority pack’s definitions and suppress the conflicting entries from the other.

5. **Logging for Developers:**  When conflicts are detected, log details for debugging.  This will help authors of rule packs improve compatibility.

## TODO

- Implement automatic conflict detection in the pack loader.
- Design the conflict resolution UI on the Rules Setup screen.
- Decide on a user‑friendly way to present override order and allow manual priority adjustment (post‑MVP).
- Document override precedence rules in the data specification.

## Checklist

- [ ] Conflict detection implemented in the pack loader.
- [ ] User notification shown when enabling conflicting packs.
- [ ] UI elements for resolving conflicts designed.
- [ ] Override precedence recorded in provenance and export.