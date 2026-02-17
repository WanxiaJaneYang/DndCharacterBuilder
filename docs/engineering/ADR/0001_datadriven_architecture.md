# ADR 0001: Data‑Driven Architecture

## Status

Accepted

## Context

The DnDCharacterBuilder project must support multiple tabletop game editions (e.g. D&D 3.5, 5R 2024) and a variety of optional expansions and homebrew content.  Hardcoding rules and UI flows for each edition would quickly become unmanageable and make it impossible to add new content without modifying source code.  Users and DM’s may also want to load custom packs.

## Decision

We adopt a **data‑driven architecture** for rules and UI flows.  All game data (races, classes, feats, spells, items, skills) and wizard flows are defined in JSON rule packs.  The core engine applies deterministic modifiers and constraints defined by these packs to produce derived stats.  The UI reads flow definitions and entity metadata to render steps and options.  The engine records provenance for all derived values.

## Rationale

1. **Edition Agnostic:**  New editions and expansions can be added as packs without changing engine code.  The same engine can interpret 3.5 SRD, 5R and custom house rules.
2. **Maintainability:**  Rules reside in data, making them easier to update and audit.  Developers can focus on logic rather than scattering constants and conditions across the codebase.
3. **Testability:**  The engine becomes a pure function of state and packs.  We can write contract tests for each pack and ensure determinism and provenance.
4. **User Extensibility:**  Future versions may allow users or DM’s to author their own packs and load them in the app.

## Consequences

1. **Complex Pack Schema:**  We must design a comprehensive pack schema and validation rules.  Entities require metadata for UI (summaries, images) and rules (effects, prerequisites).
2. **Performance Considerations:**  Loading and merging multiple packs may have overhead.  We need to optimise pack parsing and caching.
3. **Flow Configurations:**  The wizard flow is defined in packs.  Adding a new step or edition requires updating flow JSON.  We must ensure flows remain valid and coherent.
4. **Dependence on Data Quality:**  Incorrect or poorly defined packs will break the app.  We need strong schema validation and contract tests.

## Alternatives Considered

**Hardcoded Rules:**  Embedding all rule logic in code would make initial development simpler but hinder adding new editions and expansions.  It would also require code changes for any rule update.

**Hybrid Approach:**  A hybrid approach with core rules in code and expansions in data could work, but it complicates precedence and merging logic.  We chose to fully commit to data‑driven for consistency.

## TODO

- Finalise pack schemas and flows (see `/data/` docs).
- Implement tooling for validating and compiling packs.
- Provide documentation for pack authors (future work).

## References

- Product Decisions document in `/product/DECISIONS.md`.