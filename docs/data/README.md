# Data Docs

This section documents the JSON pack and schema contract used by the builder.

- `PACK_FORMAT.md`: expected folder/file layout and pack-level requirements.
- `ENTITY_SCHEMA.md`: shared entity fields and type-specific data models.
- `FLOW_SCHEMA.md`: flow step schema and constraints.
- `EXPORT_SCHEMA.md`: export payload expectations.

## Recent updates

- Race entities (`entityType: races`) use a structured `data` model for SRD 3.5 baseline traits (ability modifiers, vision, languages, favored class, racial traits, and optional bonus lists/spell-like abilities).
- All entity types require text UI metadata (`summary`, `description`); image metadata (`portraitUrl`, `iconUrl`) is optional and may be `null`.
