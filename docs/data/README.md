# Data Docs

This section documents the JSON pack and schema contract used by the builder.

- `PACK_FORMAT.md`: expected folder/file layout and pack-level requirements.
- `ENTITY_SCHEMA.md`: shared entity fields and type-specific data models.
- `DEFERRED_MECHANICS_VOCABULARY.md`: stable vocabulary for `deferredMechanics` concept IDs, capability IDs, and migration semantics.
- `FLOW_SCHEMA.md`: flow step schema and constraints.
- `EXPORT_SCHEMA.md`: export payload expectations.
- `CHARACTER_SPEC_V1.md`: flow-independent engine input contract (`CharacterSpec`).
- `SRD_AUTHENTICITY_VALIDATION.md`: automatic authenticity strategy for official SRD datasets.

## Recent updates

- Race entities (`entityType: races`) use a structured `data` model for SRD 3.5 baseline traits (ability modifiers, vision, languages, favored class, racial traits, and optional bonus lists/spell-like abilities).
- All entity types require text UI metadata (`summary`, `description`); image metadata (`portraitUrl`, `iconUrl`) is optional and may be `null`.
- Engine flow now consumes race data that impacts creation logic:
  - `racialTraits.bonus-feat` increases feat pick limit.
  - `racialTraits.extra-skill-points` increases level-1 skill budget.
  - `skillBonuses` apply to skill totals in review output.
  - `favoredClass` is surfaced as multiclass XP-penalty metadata for future leveling flow.
- `EXPORT_SCHEMA.md` now documents a phased target model for closing SRD-style final character-sheet gaps:
  - Phase 1 core combat/save/hp breakdowns
  - Phase 2 non-caster sheet completeness
  - Phase 3 caster and multiclass progression blocks

