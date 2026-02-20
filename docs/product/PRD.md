# Product Requirements Document (PRD)

This document sets out the high-level product requirements for the DnDCharacterBuilder project. It is based on our agreed PRD (v0.1) and updated for the new folder structure.

## Problem Statement

Creating a character in D&D can be intimidating. New players are overwhelmed by unfamiliar choices, hidden prerequisites, and manual calculations. Existing tools often hardcode flows for specific editions, making adaptation difficult.

## Target Users

1. **Primary - New Players:** Require clear guidance, simple explanations and validation to avoid mistakes.
2. **Secondary - Returning Players:** Want a faster flow with the ability to tweak selections and skip guidance.
3. **Tertiary - Table Admin/DM (future):** May enable or disable expansions and manage custom rules.

## Core Product Principles

- **Data Driven:** Rules and UI flows are defined in JSON and can be extended without code changes.
- **Edition-Aware Flow:** The wizard steps depend on the selected edition and loaded rule packs.
- **Validity by Construction:** Only valid choices are shown; the user cannot proceed until mandatory selections are completed.
- **Provenance and Determinism:** Derived stats must be reproducible and include a trace of their origins.

## High-Level Functional Requirements

- Initial role-selection screen (DM vs Player) before wizard entry.
- Version and source selection screen for Player flow.
- Step-by-step wizard for Race, Class, Ability Scores, Feats, Skills, Equipment and Review.
- Each step must render options using data packs and include short descriptions and optional details.
- Validation and gating for each step.
- Export of the character sheet with pack fingerprint and provenance.

### Ability Score Product Requirement (2026-02)

- Ability generation must be fully data-driven by flow config (`abilitiesConfig`), with no edition behavior hardcoded in UI logic.
- MVP supports three generation modes:
  1. Point Buy
  2. PHB Method
  3. Roll Sets (generate configured sets and pick one)
- Rules are edition-bound in architecture: different editions can define different defaults/tables/method parameters in pack data; MVP implementation remains 3.5-only.
- Ability step must surface existing modifiers (from currently applied race/class/rules/feats) so users can see effective outcomes during assignment.
- Point-buy cap must be user-adjustable within configured bounds in MVP.
- Full custom point-buy table authoring/saving is explicitly non-MVP.

## Localization & Data Services (MCP)

To support large, extensible datasets and user-provided packs, the product relies on external MCP-based services to automate data generation:

- A localization service that can extract translatable strings from packs and generate `PackLocale` data for supported languages (starting with zh), applying a curated glossary for official D&D terms.
- A content ingestion service that can convert SRD-like structured data into our pack format, and in future parse rulebooks (e.g. PDFs) into structured entities and flows.
- A model-evolution service that can analyse new mechanics (e.g. feats, classes, races) that are not representable in the current data model and propose schema and flow/review-surface updates.

These services must keep the engine and UI data-driven and deterministic: packs and locales remain the single source of truth; MCP servers only produce JSON artifacts consumed by the existing engine and web app.

## Non-Functional Requirements

- Deterministic engine and pure business logic.
- Minimal network dependencies (works offline with local packs).
- Clear separation of concerns between UI, engine and data.

## Edition Variability

Different editions may introduce new steps or remove existing ones. For example, D&D 5R adds a background-feat step after class selection. The flow must be configurable per edition and pack.

## MVP Scope Summary

See `/product/MVP_SCOPE.md` for the precise boundaries.

## Success Criteria

- A first-time user can complete the wizard and export a valid level-1 character within 5 minutes.
- All screens are driven by JSON packs; no hardcoded lists remain.
- All derived stats show provenance.

## Final Character Sheet Parity Plan (SRD/PHB)

The current sheet is functional but not yet complete against SRD 3.5 character-sheet expectations. Implementation should follow this priority order.

### Phase 1: Core Playability (highest priority)

Goal: make the exported/review sheet usable at the table for level-1 martial characters.

- Add identity and progression fields:
  - `level`, `xp`, `alignment`, `size`, `speed`.
- Add full combat headline stats:
  - `ac.total`, `ac.touch`, `ac.flatFooted`.
  - `initiative.total`.
  - `grapple.total`.
  - `attacks.melee[]` and `attacks.ranged[]` entries (name, attack bonus, damage, crit, range).
- Add save breakdowns:
  - `fortitude`, `reflex`, `will` with `base`, `ability`, `misc`, `total`.
- Add HP breakdown:
  - `hp.total`, plus source breakdown (`hitDie`, `con`, `misc`).

Phase 1 acceptance:
- Review page shows these sections clearly.
- Export JSON includes the same fields.
- Engine tests validate deterministic totals and component breakdown math.

### Phase 2: Sheet Completeness for Non-casters

Goal: close major remaining gaps for common SRD 3.5 non-caster builds.

- Add feat and trait visibility:
  - explicit selected feat list with effect summary text.
  - racial trait summary list (including passive traits like vision/senses).
- Add skills detail completeness:
  - per-skill `misc` modifier channel.
  - armor-check penalty handling for affected skills.
- Add equipment and carry/load summary:
  - equipped items, carried weight, load category, speed impact.
- Add movement detail:
  - base speed vs adjusted speed (armor/load).

Phase 2 acceptance:
- Final sheet explains where each non-caster number comes from without external lookup.
- Data pack can encode required modifiers without UI hardcoding.

### Phase 3: Caster + Progression Expansion

Goal: support broader class coverage and leveling complexity.

- Add spellcasting block:
  - caster level, spell ability, save DC basis.
  - spells per day / known / prepared support (edition/pack driven).
- Add multiclass progression surfaces:
  - per-class levels, BAB/save aggregation provenance.
  - XP-penalty rule output tied to favored class and class mix.
- Add optional advanced sections:
  - resistances/immunities, conditional modifiers, situational notes.

Phase 3 acceptance:
- At least one SRD caster path is fully representable in review/export.
- Multiclass sheet output remains deterministic and provenance-backed.

## TODO

- Expand each functional requirement into user stories.
- Document performance and accessibility requirements.
- Add references to user research.

## Checklist

- [ ] Problem statement captured.
- [ ] Target users defined.
- [ ] Core principles agreed.
- [ ] Functional requirements listed.
- [ ] Non-functional requirements summarised.
- [ ] Edition variability described.
- [ ] Success criteria established.
- [ ] TODO tasks recorded.
