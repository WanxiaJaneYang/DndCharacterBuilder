# Backend Quality Guidelines

> Repo-specific quality rules for engine, datapack, schema, and contract work.

---

## Overview

The backend side of this repo is centered on deterministic, data-driven rule evaluation.

- Pack and schema layers validate and normalize data.
- Engine logic remains pure and deterministic.
- Public behavior is exposed through documented contracts such as `CharacterSpec` and `ComputeResult`.
- UI-specific decisions should stay out of engine and contract code.

Read alongside:

- `docs/architecture.md`
- `docs/data/README.md`
- `docs/data/CHARACTER_SPEC_V1.md`
- `docs/data/COMPUTE_RESULT_V1.md`
- `docs/engineering/TESTING_STRATEGY.md`
- `docs/engineering/ADR/0001_datadriven_architecture.md`

---

## Forbidden Patterns

- Embedding UI flow state, step IDs, or presentation concerns into engine-facing public contracts.
- Introducing non-deterministic behavior into compute/finalize-style engine paths.
- Skipping schema validation or contract checks for pack and public-contract changes.
- Returning partially shaped public results that violate documented field-presence guarantees.
- Moving rule interpretation into ad hoc helpers that are not covered by engine or contract tests.
- Using silent data repair that changes meaning without surfacing the assumption or validation issue through the public result.

---

## Required Patterns

- Keep engine APIs pure and make identical inputs produce identical outputs.
- Keep public contracts versioned and documented before broadening their usage.
- Use contract tests and deterministic fixtures to guard engine/data-pack interactions.
- Preserve provenance, unresolved-mechanics, and validation surfaces as first-class outputs instead of hiding incompleteness.
- Keep schema, normalization, validation, and engine computation responsibilities explicit at their boundaries.

---

## Testing Requirements

- Add or update unit tests for pack validation, merge logic, normalization, and engine computation when behavior changes.
- Add or update contract fixtures when pack or engine behavior changes at public boundaries.
- Preserve determinism tests for canonical fixtures when touching compute-facing behavior.
- Run typecheck and the relevant package test suites for touched backend, engine, schema, or contracts areas.
- Treat public-contract changes as requiring both documentation updates and regression coverage.

---

## Code Review Checklist

- Does the change preserve deterministic, pure engine behavior?
- Is the public contract still documented and test-backed?
- Are schema validation and normalization boundaries still explicit?
- Did any UI concern leak into engine, schema, or contract code?
- Are unresolved rules, assumptions, and validation issues still surfaced instead of hidden?
