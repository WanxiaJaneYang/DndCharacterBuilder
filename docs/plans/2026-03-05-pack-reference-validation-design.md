# Pack Reference Integrity Validation Design

Date: 2026-03-05  
Issue: #69

## Goal
Fail CI when pack entities reference missing IDs across core entity relationships, with actionable diagnostics that include source file and JSON path.

## Scope
- Add referential-integrity validation to `@dcb/contracts`.
- Validate explicit entity ID references used by current pack data model.
- Emit deterministic, human-readable failures: `pack`, `file`, `path`, `target entity type`, `missing id`.

## Non-Goals
- Parsing natural-language references (e.g., free-form prerequisite text).
- Heuristic recursive validation on unknown fields.

## Approach
Use a curated ruleset validator:
1. Build an entity index from `packs/<pack>/entities/*.json` keyed by entity type and ID.
2. Define extraction rules with:
   - source entity file and source entity type,
   - extraction function returning reference candidates with JSON path,
   - expected target entity type.
3. Validate extracted references against indexed IDs.
4. Throw a single consolidated error when any missing reference is found.

## Initial Validation Rules
- `entities/classes.json`: `*.data.classSkills[] -> skills.id`
- `entities/races.json`: `*.data.favoredClass -> classes.id`
- `entities/races.json`: `*.data.skillBonuses[].skill -> skills.id`

## Error Contract
`[contracts] Pack reference integrity check failed` with per-item lines:
- `pack=<packId>`
- `file=<relative entities file>`
- `path=<json path>`
- `expected=<targetEntityType>.id`
- `missing=<id>`

## Testing Strategy
- Red: test that corrupted references in temp copied pack throw with file/path/id details.
- Green: implement minimal validator and wire into `runContracts`.
- Refactor: extract reusable helper types/functions in `references.ts`.

## Integration
Call reference integrity validation at the start of `runContracts` so it fails fast before fixture execution.
