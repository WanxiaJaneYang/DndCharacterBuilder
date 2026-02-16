# CLAUDE.md

## Repo map
- `apps/web`: React MVP wizard UI, must consume pack-driven flow/data only.
- `packages/schema`: Zod schemas + shared domain types.
- `packages/datapack`: pack resolution (`core`) and disk I/O (`node`) entrypoints.
- `packages/engine`: pure deterministic rules engine + provenance.
- `packages/contracts`: pack fixture runner.
- `packs/srd-35e-minimal`: MVP data pack (manifest/entities/flow/contracts).
- `docs`: architecture and process docs.

## Common commands
- Dev web: `npm --workspace @dcb/web run dev`
- Unit tests: `npm test`
- Contracts: `npm run contracts`
- Typecheck: `npm -ws run typecheck`
- Build: `npm -ws run build`

## Invariants
1. Rules are data: UI must not hardcode SRD rules or wizard steps.
2. Engine stays pure/deterministic and unit-testable.
3. Browser code must never import Node-only modules/entrypoints (`@dcb/datapack/node`).
4. Pack resolution must preserve dependency order; priority only breaks independent ties.
5. Provenance must record the source pack/entity for every applied effect.

## Workflow
- Prefer **explore → plan → code → verify → commit**.
- For refactors, maintain a checklist scratchpad in `docs/` and update verification outcomes.
- Prefer test-first loops when feasible; keep commits small and scoped.
- Before each commit: run relevant tests/typecheck/build/contracts and capture outcomes.
