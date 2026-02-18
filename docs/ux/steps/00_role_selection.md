# Step 0: Role Selection

## Goal

Ensure the user chooses whether they are entering as a DM or a Player before any character creation steps are shown.

## User Intent

- Quickly understand whether this product supports their intended use today.
- Begin character creation immediately if they are a player.

## Layout

- A single bold question, centered near the upper middle of the page.
- The page is split into two side-by-side tabs:
  - **DM** tab on the left.
  - **Player** tab on the right.
- Selecting **DM** displays an inline message: **Not supported in this version.**
- Selecting **Player** proceeds to the next step of the character creation journey.

## Validation & Errors

- Role choice is required before entering the wizard flow.
- No blocking error is required for DM; the user simply remains on this page with the not-supported message.

## Acceptance Criteria

- The first visible screen in the app is Role Selection.
- DM and Player tabs are rendered left/right and are clickable.
- DM selection shows a clear not-supported message.
- Player selection transitions to the standard wizard.

## Checklist

- [ ] Layout defined.
- [ ] DM behavior defined.
- [ ] Player behavior defined.
- [ ] Acceptance criteria listed.
