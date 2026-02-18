# User Interface Specification

This document describes the high‑level user interface of the D&D Character Builder.  It is intended to guide both UI implementation and Figma designs.  The UI is driven entirely by the rule packs and flow definitions: it renders pages based on a flow JSON file and displays entities defined in pack data.

## Layout Overview

The character creation wizard is a multi‑step form displayed as a **sidebar with a step checklist** and a **main content area**:

* **Sidebar** – shows the list of steps defined in the flow.  Each step displays its label, status (pending/active/done/error) and allows navigation back to previous steps.  Steps cannot be skipped if they are invalid.
* **Main content area** – displays the inputs for the current step, such as cards for race and class selection, point‑buy sliders for ability scores, lists of feats and skills, or item pickers.
* **Navigation buttons** – “Back” and “Next” buttons appear at the bottom of the main area.  The “Next” button is disabled until the current step is valid according to the engine’s `validateState` function.

### Desktop vs Mobile

On large screens the sidebar appears on the left with the main content on the right.  On mobile, steps may collapse into a dropdown at the top to maximise space.

### Pages/Steps

The following pages correspond to flow steps defined in the pack.  Each page is described in detail in the relevant `ux/steps/*` file.

1. **Role Selection** – choose DM or Player; DM shows unsupported message, Player enters wizard (`ux/steps/00_role_selection.md`).
2. **Rules Setup** – choose version and rule sources (see `ux/steps/01_rules_setup.md`).
3. **Race Selection** – pick one race from cards with image and summary (`ux/steps/02_race_selection.md`).
4. **Class Selection** – pick one class from cards (`ux/steps/03_class_selection.md`).
5. **Ability Scores** – assign ability scores using point‑buy or manual entry (`ux/steps/04_ability_scores.md`).
6. **Feats** – choose feats with prerequisite filtering (`ux/steps/05_feats.md`).
7. **Skills** – allocate skill points (`ux/steps/06_skills.md`).
8. **Equipment** – select starting kit or items (`ux/steps/07_equipment.md`).
9. **Review & Export** – show final character summary and export options (`ux/steps/08_review_export.md`).

## Component Requirements

### StepChecklist

Displays a vertical or horizontal list of steps.  Each entry shows:

- Label (e.g. “Race”, “Class”).
- Icon representing the step’s type (optional).  Use a consistent style.
- Status indicator: pending (grey), active (highlight), done (green), error (red).
- Click behaviour: user can navigate to a completed or current step but not to a future step.

### CardGridPicker

Used for race and class selection (and potentially background/other categories in future versions).  Requirements:

- Accepts an array of entities each with an image, name, summary and details.
- Displays items in a responsive grid (2–3 columns on desktop, 1–2 on mobile).
- Each card shows name and summary; clicking reveals details in a modal (see `DetailsModal`).
- Cards indicate selected state (e.g. border highlight or check icon).
- Cards are disabled if prerequisites are unmet.

### DetailsModal

Displays a full description of an entity (race, class, feat, item).  Requirements:

- Scrollable content area.
- Close button.
- Optionally show source (pack id and entity id) to help with provenance.

### AbilityAllocator

Used in the ability scores step.  Must support different methods (manual entry, point‑buy).  Requirements:

- For **point buy**: show remaining points, slider or number input for each ability (STR, DEX, CON, INT, WIS, CHA).  Validate that total points spent does not exceed the budget.
- For **manual**: provide number input fields with min/max constraints.
- Show current modifier derived from the value.

### SkillAllocator

Used in the skills step.  Requirements:

- Show a list of skills with their names and descriptions (short).
- Display available points and per‑skill rank limits.
- Allow the user to assign ranks to each skill and update remaining points.
- Highlight cross‑class skills and adjust cost accordingly (for future versions; MVP may treat all skills as same cost).
- Validate overspending and maximum ranks.

### ValidationBanner

Displays error messages returned from the engine’s `validateState` function.  Requirements:

- Show one or more messages at the top or bottom of the page.
- Use a consistent, noticeable style (e.g. red text or alert box).
- Provide guidance on how to fix the error (if possible).

## Design Tokens

Design tokens should be defined in `ui/tokens/DESIGN_TOKENS.md` and synchronised with Figma.  They include colours, typography, spacing and radii.  Use these tokens in the CSS/Theme for consistent look and feel.

## TODO

* [ ] Flesh out component props and state shapes for each component listed above.
* [ ] Define theme variables in `ui/tokens/DESIGN_TOKENS.md`.
* [ ] Provide visual examples (Figma wireframes) for each page and component.
* [ ] Document responsive breakpoints and behaviours.

## Checklist

- [ ] All steps/pages are described in this spec.
- [ ] Each UI component is documented with requirements.
- [ ] Tokens are defined and referenced.
- [ ] Flow between pages is clear and matches the user journey documents.

### RoleSelectionTabs

The initial entry component before the wizard proper. Requirements:

- Display a bold prompt near the top-center of the page asking whether the user is DM or Player.
- Render two equal-width tabs/panels across the page: DM on the left, Player on the right.
- DM selection shows a non-blocking message: **Not supported in this version.**
- Player selection transitions to the first wizard step.
- Include clear hover and active states so users can immediately understand interactivity.
- Use a fantasy-themed presentation (parchment/gold/serif accents) while maintaining readability and contrast.
- All user-facing copy should come from JSON-backed UI text resources so language switching can be supported without code rewrites.
- Provide a language switcher (MVP supports English and Chinese) on the entry screen and keep labels consistent across wizard pages.
- Default language should auto-detect from browser locale (zh -> Chinese, otherwise English), with manual toggle override.
