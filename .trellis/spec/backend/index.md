# Backend Development Guidelines

> AI-facing backend and engine guidance index for this repository.

---

## Source Of Truth

This Trellis index is a routing layer, not a replacement for the repo's backend and engine documentation.

- Canonical architecture guidance lives in `docs/architecture.md` and `docs/engineering/ADR/`.
- Canonical engine and contract docs live under `docs/data/`.
- Canonical testing expectations live in `docs/engineering/TESTING_STRATEGY.md`.
- If a file in this directory is still placeholder content, fall back to those repo docs and sync the relevant guidance back here later.

---

## Read In This Order

1. `docs/architecture.md`
2. `docs/data/README.md`
3. `docs/data/CHARACTER_SPEC_V1.md`
4. `docs/data/COMPUTE_RESULT_V1.md`
5. `docs/engineering/TESTING_STRATEGY.md`
6. Relevant ADRs under `docs/engineering/ADR/`

Then read the most relevant local Trellis files in this directory:

| Guide | Purpose | Current State |
|-------|---------|---------------|
| [Directory Structure](./directory-structure.md) | Package and module placement | Bootstrap placeholder |
| [Database Guidelines](./database-guidelines.md) | Persistence conventions, if applicable | Bootstrap placeholder |
| [Error Handling](./error-handling.md) | Validation and failure-handling rules | Bootstrap placeholder |
| [Logging Guidelines](./logging-guidelines.md) | Diagnostics and observability expectations | Bootstrap placeholder |
| [Quality Guidelines](./quality-guidelines.md) | Test and review expectations | Bootstrap placeholder |
| [Type Safety](./type-safety.md) | Contract and payload validation rules | Bootstrap placeholder |

---

## Working Rule

Document this repository's actual engine, contract, and validation conventions here over time. Do not treat placeholder text as authoritative over the repo's existing docs.
