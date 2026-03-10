# Backend Type Safety

> Repo-specific type-safety rules for engine, schema, datapack, and contract boundaries.

---

## Overview

This repo uses documented, versioned contracts to separate wizard state, engine input/output, and pack/schema data.

- `CharacterSpec` is the flow-independent engine input contract.
- `ComputeResult` is the versioned engine output contract.
- Pack and entity data are schema-governed and should be validated before engine use.

Type safety here is not only static TypeScript correctness. It also includes runtime validation, normalization, and documented field guarantees.

Primary references:

- `docs/data/README.md`
- `docs/data/CHARACTER_SPEC_V1.md`
- `docs/data/COMPUTE_RESULT_V1.md`
- `docs/architecture.md`

---

## Public Contract Ownership

- Treat the `docs/data/` contract docs as the source of truth for public shapes and guarantees.
- Keep `CharacterSpec` flow-independent: no wizard step IDs, no UI screen metadata, no orchestration state.
- Keep `ComputeResult` stable and explicit about required fields, optional fields, ordering guarantees, and schema versions.
- When public contract behavior changes, update both docs and tests in the same change.

---

## Validation And Normalization Boundaries

- Validate and normalize external or pack-derived data before relying on it in engine computation.
- Use normalization to make input canonical, but do not let normalization hide meaning-changing adjustments; surface those through documented assumption or validation channels.
- Keep validation paths tied to the public contract. For example, `validationIssues.path` should point to `CharacterSpec` fields, not wizard-only internals.
- Treat pack/entity/schema inputs as runtime-validated boundaries, not as trusted plain objects.

---

## Common Patterns

- Use version markers such as `schemaVersion` as part of the public contract, not as incidental metadata.
- Preserve documented presence guarantees such as always-present arrays in `ComputeResult`.
- Keep ordering guarantees stable for deterministic arrays that consumers rely on.
- Use explicit adapters when bridging from legacy internals to current public contracts so the public shape can stay stable while internals evolve.

---

## Forbidden Patterns

- Widening public contracts with undocumented `unknown` bags or ad hoc optional fields.
- Depending on wizard-state internals where the public `CharacterSpec` boundary should be used.
- Omitting schema/version fields or required arrays from public outputs.
- Treating normalization, validation, and computation as the same step when different responsibilities need different guarantees.
- Using unchecked casts in contract-facing code to bypass runtime validation or documented invariants.
