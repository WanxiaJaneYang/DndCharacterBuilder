# User Journey Overview

This document summarizes the experience of a user creating a character using the DnDCharacterBuilder wizard. The journey is data-driven and can change based on the selected edition and enabled packs.

## Flow Summary

| Step ID | Name | Description |
|--------:|------|-------------|
| 0 | Role Selection | User chooses whether they are a DM or Player before entering character creation. |
| 1 | Rules Setup | Player selects edition and rule sources (packs). This determines `enabledPackIds` and resolves the runtime wizard flow. |
| 2+ | Runtime Flow Steps | Step order comes from the resolved flow JSON of the selected packs. For the current `srd-35e-minimal` pack, the flow is: Race -> Class -> Ability Scores -> Feat -> Skills -> Equipment -> Name -> Review. |

## Edition Variability

Future editions may modify this journey:

- 5R (2024) may add a background feat step after class selection.
- 3.5 currently includes manual skills allocation and no background step.
- Ability assignment method and equipment mode may differ by flow/packs.

## UX Goals

- **Clarity:** Each step should clearly communicate what choices are being made and why.
- **Guidance:** Short explanations help novices understand the effect of each choice.
- **Validation:** Users cannot proceed until mandatory selections are complete and valid.
- **Progress:** A checklist or progress indicator shows which steps are complete.

## To-Do

- Determine progress indicator design (stepper vs checklist).
- Add confirm/cancel flows for leaving the wizard mid-process.
- Design summary cards for review step.

## Checklist

- [ ] Flow summary created.
- [ ] Edition variability noted.
- [ ] UX goals stated.
- [ ] To-do items recorded.
