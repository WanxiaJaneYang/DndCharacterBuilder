# Product Overview

This folder contains the high‑level product specifications and documentation for the DnDCharacterBuilder project. The product is a beginner‑first, data‑driven web application that helps users create tabletop characters through a guided wizard. The primary goal of this project is to remove friction for new players by making complex rules and choices easy to navigate.

## Scope

Our current focus is on D&D 3.5 SRD character creation for level 1 characters. Future versions will add more editions (such as 5e/5R 2024) and level‑up functionality.

The product must support:

- Edition selection and rule source selection.
- A wizard flow defined by JSON (flow step configuration).
- Dynamic rendering of races, classes, feats, skills, items and other options from data packs.
- Validation and gating so users cannot progress with invalid choices.
- Provenance for derived stats in the character sheet.

## Personas

- **New Player:** No knowledge of D&D rules. Needs step‑by‑step guidance and simple explanations.
- **Returning Player:** Familiar with some rules. Wants quick entry, the ability to customize and skip guidance.
- **DM / Table Admin:** (future) Manages rule packs, expansions, and custom house rules.

## Glossary

- **Rule Pack:** A versioned bundle of JSON data (manifest, entities, flows) representing a set of rules or expansions.
- **Flow:** A JSON file that defines the order and types of steps in the character creation wizard.
- **Engine:** Pure deterministic code that interprets selected choices and rule packs to produce derived stats and provenance.
- **Provenance:** Information recorded for each derived value describing which choices and rule pack caused it.

## Roadmap Pointers

- See `/product/PRD.md` for detailed product requirements.
- See `/product/MVP_SCOPE.md` for the exact MVP boundaries and success metrics.
- See `/product/DECISIONS.md` for a record of product decisions.

## TODO

- Refine personas with real user research.
- Add glossary entries as new concepts emerge.
- Update roadmap pointers when new documents are added.

## Checklist

- [ ] Initial personas defined.
- [ ] Glossary created.
- [ ] Links to PRD, MVP scope and decisions added.
- [ ] Future tasks tracked in TODO.
