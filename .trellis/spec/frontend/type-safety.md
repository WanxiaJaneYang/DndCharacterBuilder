# Frontend Type Safety

> Repo-specific type-safety rules for the DndCharacterBuilder frontend.

---

## Overview

The frontend should consume stable, versioned contracts rather than inventing its own implicit shapes.

- `CharacterSpec` is the flow-independent engine input contract.
- `ComputeResult` is the engine output contract.
- UI code should treat those documented shapes as canonical boundaries, not reverse-engineer wizard-state internals.

Primary references:

- `docs/data/CHARACTER_SPEC_V1.md`
- `docs/data/COMPUTE_RESULT_V1.md`
- `docs/data/README.md`

---

## Type Organization

- Treat contract docs in `docs/data/` as the authority for public input/output shape.
- Keep UI-local view and interaction types local to the component or feature that owns them.
- Avoid creating duplicate "almost-the-same" frontend-only copies of engine contract shapes unless there is a clear adapter boundary.
- When an adapter is necessary, keep it thin and explicit about what field is being mapped and why.

---

## Validation

- Validate untrusted data at boundaries instead of trusting ad hoc object shapes.
- Pack data, schema-backed content, and public contract payloads should be treated as schema-governed inputs, not informal frontend objects.
- If the frontend accepts imported/exported structured data, use the documented schema/contract boundary rather than best-effort parsing.
- Do not use wizard-step IDs or screen-state metadata as a substitute for the flow-independent engine contracts.

---

## Common Patterns

- Narrow optional fields explicitly, especially `provenance`, unresolved-mechanics surfaces, and optional metadata fields.
- Preserve documented defaults and presence guarantees from the public contract, such as required arrays in `ComputeResult`.
- Map from engine contracts to display props in one place when possible so review and wizard components do not drift.
- Prefer explicit discriminators and string-literal unions from documented contracts over generic string bags.

---

## Forbidden Patterns

- `any` or broad type assertions to skip understanding the contract.
- Reconstructing types from DOM assumptions or component state when the contract already documents the shape.
- Treating optional contract fields as always present without narrowing.
- Creating frontend-only shadow contracts that silently diverge from `CharacterSpec` or `ComputeResult`.
- Depending on legacy wizard-state internals across public boundaries when the flow-independent contract already exists.
