# Pack Compiler Migration Architecture

> Historical note: this file records the March 2026 compiler-migration framing on the older refactor line. Current canonical architecture truth for the `engine-refactor` integration branch now lives in `docs/architecture.md`, `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`, and `docs/engineering/ENGINE_REFACTOR_STATUS.md`. Read this file as historical rationale and migration context, not as the latest branch contract.

Date: 2026-03-15

## Goal
Introduce a compiler-backed migration path for the engine redesign so source-authentic pack data can remain canonical while the new runtime executes compiled, capability-owned data.

## Branch Strategy
- Use a long-lived migration branch/worktree line for the engine/compiler rewrite.
- Keep `main` stable until parity is proven.
- Do not dual-support the old and new integrations on `main` while the architecture is still moving.

## Three Representations
1. Authored source data
   - Human-readable, source-aligned pack artifacts.
   - Canonical home for SRD-faithful text, tables, metadata, flow definitions, and locale content.
2. Normalized pack IR
   - Internal compiler representation.
   - Resolves IDs, links, selection definitions, per-capability runtime fragments, and legacy-compat records.
3. Compiled runtime bundle
   - Engine execution target.
   - Contains compiled selection schemas, compiled entities, capability-owned runtime data, facts, grants, deferred mechanics, and migration diagnostics.

## Architecture Rules
- The engine should execute the compiled runtime bundle, not raw authored entity fields.
- Capabilities target `RuntimeRequest`, never `CharacterState`.
- Ruleset-owned selection meaning should compile into runtime selection schemas rather than staying hardcoded in engine internals.
- Capability-owned runtime data should be emitted by the compiler rather than inferred ad hoc from raw pack fields at execution time.
- Legacy path-oriented mechanics should move through explicit compatibility records until they are natively owned by a capability.
- The approved schema-level contract for bundle/request separation, typed registry entries, and fixed-point execution now lives in `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`.

## Issue Map
- `#232`: generic `RuntimeRequest` boundary and adapters
- `#233`: capability-registry ADR approval
- `#234`: pack compiler parent
- `#235`: compiler scaffold
- `#236`: selection schema compilation
- `#122`: first native vertical slice, `cap:skills-core`

## Migration Order
1. Land `#232` so compute no longer materializes `CharacterState`.
2. Approve `#233` so the capability/runtime architecture is explicit.
3. Land `#235` for compiler scaffold.
4. Land `#236` for compiled runtime selection schemas.
5. Land `#122` as the first native vertical slice on compiled runtime data.
6. Expand to later slices such as `#139`, `#111`, then `#160`.

## Why This Is Safer Than A Raw Data Rewrite
- Current authored data still mixes source-authentic content with legacy-engine-shaped semantics.
- A direct rewrite would freeze current accidental structure into the new engine.
- A compiler allows staged migration:
  - preserve authored source
  - lift semantics capability by capability
  - run parity checks
  - delete legacy coupling last

## Immediate Next Work
- Keep active implementation on `#232`.
- Treat `#234/#235/#236` as the explicit downstream compiler lane, not as justification to widen `#232`.
- Keep `#122` blocked until the runtime-boundary and compiler groundwork are real.
