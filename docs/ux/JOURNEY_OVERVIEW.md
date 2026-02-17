# User Journey Overview

This document summarizes the experience of a user creating a character using the DnDCharacterBuilder wizard. The journey is defined by a flow JSON that can change based on the selected edition and enabled packs. The summary below reflects the current MVP flow for D&D 3.5 SRD.

## Flow Summary

| Step ID | Name                | Description                                                                      |
|--------:|---------------------|----------------------------------------------------------------------------------|
| 0       | Rules Setup         | User selects the edition and which rule sources (packs) to enable.               |
| 1       | Race Selection      | Presents a card grid of available races. Each card shows an image and summary.   |
| 2       | Class Selection     | Presents a card grid of available classes with images and summaries.             |
| 3       | Ability Assignment  | User allocates ability scores using manual entry or point buy as defined by flow |
| 4       | Feat Selection      | User chooses one or more feats, filtered by prerequisites.                       |
| 5       | Skill Selection     | User allocates skill points according to basic 3.5 rules (budget & max rank).    |
| 6       | Equipment Selection | User chooses weapons, armour and other gear; selects starting equipment mode.    |
| 7       | Review & Export     | Shows derived stats with provenance; user can download JSON and view HTML sheet. |

## Edition Variability

Future editions may modify this journey:

- **5R (2024)** adds a *background feat* step after the class selection.
- **3.5** does not include a background step but requires manual skills allocation.
- The point‑buy method and starting equipment modes may differ between editions.

## UX Goals

- **Clarity:** Each step should clearly communicate what choices are being made and why.
- **Guidance:** Short explanations help novices understand the effect of each choice.
- **Validation:** Users cannot proceed until mandatory selections are complete and valid.
- **Progress:** A checklist or progress indicator shows which steps are complete.

## To‑Do

- Determine progress indicator design (stepper vs checklist).
- Add confirm/cancel flows for leaving the wizard mid‑process.
- Design summary cards for review step.

## Checklist

- [ ] Flow summary created.
- [ ] Edition variability noted.
- [ ] UX goals stated.
- [ ] To‑do items recorded.
