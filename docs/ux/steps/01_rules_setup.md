# Step 1: Rules Setup

## Goal

Allow the player to select the rules version (edition) and which rule sources (packs) are enabled. This step appears after the role-selection gate and determines which data packs and flow configuration will be loaded for the rest of the wizard.

## User Intent

- Choose the edition they want to play (currently only 3.5).
- Enable optional rule packs or expansions.
- Ensure the base SRD pack remains enabled.

## Layout

- A dropdown or segmented control for edition selection.
- A checklist of rule sources:
  - The base SRD pack appears selected and disabled.
  - Optional packs appear with toggles.
- A button to proceed once the choices are confirmed.
- A summary of the next steps (e.g., a step list with progress indicator).

## Data Requirements

- List of available editions and associated packs.
- Manifest information (name, description) for each pack.

## Validation & Errors

- At least one edition must be selected.
- The base pack cannot be deselected.
- If a pack conflicts with another pack, display an error (edge case).

## Acceptance Criteria

- User can select an edition and optional packs.
- UI correctly builds the context (`enabledPackIds` and `packSet`).
- On submission, the wizard flow loads with steps defined by the selected packs.

## To‑Do

- Decide how to discover available packs (static list vs dynamic discovery).
- Design pack conflict resolution UI.
- Add tooltips explaining what each pack adds.

## Checklist

- [ ] Layout wireframed.
- [ ] Data requirements identified.
- [ ] Validation rules listed.
- [ ] Acceptance criteria defined.
- [ ] To‑do items recorded.
