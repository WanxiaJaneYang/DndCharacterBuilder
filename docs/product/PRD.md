# Product Requirements Document (PRD)

This document sets out the high‑level product requirements for the DnDCharacterBuilder project. It is based on our agreed PRD (v0.1) and updated for the new folder structure.

## Problem Statement

Creating a character in D&D can be intimidating. New players are overwhelmed by unfamiliar choices, hidden prerequisites, and manual calculations. Existing tools often hardcode flows for specific editions, making adaptation difficult.

## Target Users

1. **Primary – New Players:** Require clear guidance, simple explanations and validation to avoid mistakes.
2. **Secondary – Returning Players:** Want a faster flow with the ability to tweak selections and skip guidance.
3. **Tertiary – Table Admin/DM (future):** May enable or disable expansions and manage custom rules.

## Core Product Principles

- **Data Driven:** Rules and UI flows are defined in JSON and can be extended without code changes.
- **Edition‑Aware Flow:** The wizard steps depend on the selected edition and loaded rule packs.
- **Validity by Construction:** Only valid choices are shown; the user cannot proceed until mandatory selections are completed.
- **Provenance and Determinism:** Derived stats must be reproducible and include a trace of their origins.

## High‑Level Functional Requirements

- Initial role-selection screen (DM vs Player) before wizard entry.
- Version and source selection screen for Player flow.
- Step‑by‑step wizard for Race, Class, Ability Scores, Feats, Skills, Equipment and Review.
- Each step must render options using data packs and include short descriptions and optional details.
- Validation and gating for each step.
- Export of the character sheet with pack fingerprint and provenance.

## Non‑Functional Requirements

- Deterministic engine and pure business logic.
- Minimal network dependencies (works offline with local packs).
- Clear separation of concerns between UI, engine and data.

## Edition Variability

Different editions may introduce new steps or remove existing ones. For example, D&D 5R adds a *background feat* step after the class selection. The flow must be configurable per edition and pack.

## MVP Scope Summary

See `/product/MVP_SCOPE.md` for the precise boundaries.

## Success Criteria

- A first‑time user can complete the wizard and export a valid level‑1 character within 5 minutes.
- All screens are driven by JSON packs; no hardcoded lists remain.
- All derived stats show provenance.

## TODO

- Expand each functional requirement into user stories.
- Document performance and accessibility requirements.
- Add references to user research.

## Checklist

- [ ] Problem statement captured.
- [ ] Target users defined.
- [ ] Core principles agreed.
- [ ] Functional requirements listed.
- [ ] Non‑functional requirements summarised.
- [ ] Edition variability described.
- [ ] Success criteria established.
- [ ] TODO tasks recorded.
