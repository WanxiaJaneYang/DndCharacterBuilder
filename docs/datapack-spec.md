# Datapack Specification

## Folder structure

```text
packs/<pack-id>/
  manifest.json
  entities/
    races.json
    classes.json
    feats.json
    items.json
    skills.json
    rules.json
  flows/
    character-creation.flow.json
  patches/
    *.json (optional)
  contracts/
    *.json
```

## `manifest.json`
- `id` (string, stable)
- `name` (string)
- `version` (semver string)
- `priority` (number; higher/lower order via resolver)
- `dependencies` (pack id array)
- `compatibleEngineRange` (optional)

## Entity ID conventions
- Use lowercase kebab-case IDs (`fighter`, `power-attack`).
- IDs must be stable across versions for reliable overrides.

## Merge/override rules
1. Resolver topologically sorts enabled packs by dependency, then priority.
2. Entities merge by `entityType + id`.
3. Later precedence overrides previous values.
4. Optional patches apply after entity merge.
5. Resolver emits deterministic SHA-256 fingerprint from resolved pack set.

## Example snippet

```json
{
  "id": "chainmail",
  "name": "Chainmail",
  "entityType": "items",
  "effects": [
    { "kind": "add", "targetPath": "stats.ac", "value": { "const": 5 } }
  ]
}
```
