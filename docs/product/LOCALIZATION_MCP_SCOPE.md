#+ Localization & MCP Services – Scope

This document defines the scope and initial requirements for MCP-based localization and data-generation services that support the DnDCharacterBuilder product.

## Goals

- **Data-driven localization**: Generate and serve `PackLocale` data (starting with zh) for any compatible rule pack, including user-uploaded extensions.
- **Scalable content ingestion**: Convert SRD-like datasets and, in future, rulebook PDFs into our canonical pack format without hardcoding rules in the UI or engine.
- **Model evolution support**: Detect mechanics that do not fit the current data model and propose schema and flow/review updates instead of ad-hoc exceptions.

## In-Scope (Phase 1 – Localization MCP)

- **Pack locale extraction**
  - Input: a resolved pack (manifest, entities, flows).
  - Output: a locale template that lists all translatable strings as `flowStepLabels` and `entityText[entityType][entityId][path]`.
  - Must work for both core packs and user-uploaded packs that follow the schema.

- **Locale generation & translation**
  - Input: a locale template and target language (initially `zh-CN`).
  - Output: a `PackLocale` object suitable for merging in `resolveLoadedPacks`.
  - Must:
    - Apply a curated glossary for official D&D Chinese terminology where available.
    - Leave untranslated/unknown strings in a safe default (typically English) for later human review.
    - Be deterministic for the same input template and glossary version.

- **Locale syncing**
  - Keep locale templates in sync with evolving packs (added/removed entities, renamed fields).
  - Provide a report of added/removed/changed keys so translators can focus on deltas.

## Future Scope (Not in Phase 1 but Recorded)

- **SRD → Pack conversion MCP**
  - Import structured SRD datasets and emit packs that conform to `@dcb/schema`.
  - Support reusable mapping profiles per source (e.g. "3.5e SRD JSON v1").

- **PDF rulebook ingestion**
  - Read licensing-compliant rulebook PDFs and extract races, classes, feats, items and rules into structured entities and flows.
  - Flag ambiguous or low-confidence extractions for human review.

- **Data model evolution assistance**
  - Analyse extracted mechanics to detect gaps in the current data model.
  - Propose schema updates and corresponding changes to flows and review surfaces in data (no hardcoded UI rules).

## Acceptance Checklist (Phase 1 – Localization MCP)

- [ ] MCP tool can extract a locale template from the existing minimal 3.5e pack.
- [ ] MCP tool can generate a deterministic `PackLocale` for zh using a glossary.
- [ ] Engine can merge MCP-produced `PackLocale` with existing pack locales without code changes to the web app.
- [ ] Localization flow works for at least one user-uploaded pack that follows the same schema.
- [ ] Documentation updated to describe how product and packs depend on MCP localization.

