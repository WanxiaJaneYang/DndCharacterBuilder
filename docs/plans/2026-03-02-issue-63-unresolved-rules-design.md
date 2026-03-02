# Issue 63 Unresolved Rules Design

Date: 2026-03-02
Owner: Engine
Status: Approved for implementation
Issue: #63

## Goal

Expose deferred mechanics in final `CharacterSheet` output so selected content cannot silently appear fully implemented when rules are still unresolved.

## Scope

- Add `unresolvedRules` to engine output.
- Include deterministic IDs, stable ordering, and provenance.
- Support current deferred metadata shape now and tolerate future normalized `impacts` data without changing the output field name.
- Add a contract fixture for one known deferred rule path.

## Design

The engine already knows which entities are selected during `finalizeCharacter`. That makes finalization the correct layer to aggregate deferred rule metadata. The output will use this shape:

- `id`
- `category`
- `description`
- `dependsOn`
- `impacts?`
- `source`

`impacts` will read from future `impacts` metadata when present, otherwise from current `impactPaths`. Output ordering will be deterministic by a derived ID based on pack, entity type, entity ID, and deferred mechanic ID.

## Non-goals

- No UI changes.
- No implementation of deferred rules themselves.
- No normalization of the underlying pack metadata in this PR.
