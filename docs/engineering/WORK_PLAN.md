# Engineering Work Plan

This living document tracks the engineering tasks required to implement the DnDCharacterBuilder MVP and future iterations.  It serves as a roadmap for developers, with high‑level milestones and granular tasks.

## Current Phase: MVP Implementation

### High‑Level Milestones

1. **Core architecture and schemas**
   - [x] Define pack format and schemas (manifest, entities, flows, export).
   - [x] Implement pack loader and merge logic.
   - [x] Implement deterministic engine with provenance.
   - [ ] Implement export generation conforming to `data/EXPORT_SCHEMA.md`.

2. **Wizard UI & flow**
   - [ ] Build the Rules Setup page with version and source selection.
   - [ ] Implement race, class, ability, feat, skill and equipment steps using card and allocator components.
   - [ ] Implement review & export step with provenance display.
   - [ ] Wire validation and gating for each step.

3. **Data packs**
   - [x] Create minimal SRD 3.5 pack (human, fighter, basic feats, skills, items).
   - [x] Expand SRD race data to all core races with structured trait metadata (vision, ability modifiers, languages, favored class, racial traits).
   - [ ] Populate UI metadata (summary, description, images) for all entities.
   - [ ] Write example flows and exports in `data/examples/`.

4. **Testing**
   - [x] Add unit tests for pack loader (datapack package).
   - [x] Add unit tests for engine (engine package).
   - [ ] Add contract tests for minimal SRD pack.
   - [ ] Add integration tests for wizard flow (optional in MVP).

### Future Phases (Beyond MVP)

1. **Content expansion**
   - Add more races, classes, feats, spells and items to SRD pack.
   - Support spells and spellcasting classes.
   - Support additional rule packs (e.g. 3.5 expansions, homebrew).

2. **Level‑up & multi‑class**
   - Implement level‑up flow and cross‑class skill rules.
   - Allow characters to advance beyond level 1.

3. **Multi‑edition support**
   - Introduce flows for 5e/5R and other editions.
   - Handle edition‑specific steps (e.g. background feats in 5R).

4. **AI assistance and hints**
   - Integrate AI models to provide contextual explanations and recommendations.
   - Ensure AI suggestions respect rule constraints and provenance.

## TODO

- Complete export implementation and update engine to produce final character sheet.
- Finalise skill allocation rules and implement the SkillAllocator component.
- Implement starting equipment mode selection and persist it in exports.
- Write integration tests for wizard UI once components are stable.
- Document code standards (linting, formatting) and add CI scripts.

## Checklist

- [ ] Export schema implemented.
- [ ] Rules Setup UI complete.
- [ ] All wizard steps implemented and data‑driven.
- [ ] Minimal pack fully populated with UI metadata.
- [ ] Contract tests passing.
- [ ] Work plan updated regularly.
