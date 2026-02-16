# Architecture

## Module/Data Flow

```text
[packs/* JSON] -> [packages/datapack]
                  - validate manifest/entities/flow
                  - dependency topo sort + priority
                  - merge + patch + fingerprint
                          |
                          v
                   resolved pack set
                          |
                          v
                    [packages/engine]
         listChoices/applyChoice/validate/finalize
         - deterministic DSL interpreter
         - prerequisites + exclusivity
         - derived stats + provenance
                          |
                          v
                     [apps/web]
             thin wizard UI + JSON export + HTML sheet
```

## Determinism
- Engine APIs are pure and deterministic.
- Character `state` stores only user selections, not derived stats.
- Derived stats are recomputed on finalize from resolved pack data.

## Provenance
Each applied effect emits a provenance record:

```json
{
  "targetPath": "stats.ac",
  "delta": 2,
  "source": { "packId": "srd-35e-minimal", "entityId": "heavy-wooden-shield" }
}
```

This powers “why is this number this number?” in the review UI.
