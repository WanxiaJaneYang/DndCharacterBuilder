# Architecture

This repository is moving off the old monolithic wizard-plus-engine shape and onto the `engine-refactor` integration line. The target is a contract-first frontend/backend split: the frontend owns rendering and interaction, while the engine owns rules evaluation and returns authoritative build feedback.

## Canonical Refactor Docs

These files are the current source of truth for the refactor:

- `docs/architecture.md`
- `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- `docs/engineering/ENGINE_REFACTOR_STATUS.md`

Files under `docs/plans/` remain valuable, but they are historical design and implementation records. They should not carry the latest architecture truth by themselves.

## System Boundary

The target system boundary is:

```text
[authored rules/packs]
        |
        v
[normalization / compiler]
        |
        v
[engine backend / domain service]
        |
        v
[frontend client]
```

Important consequences:

- Rules content remains the canonical source of rule meaning.
- The engine executes compiled or normalized rules data, not raw UI state.
- The frontend owns local interaction mechanics such as clicks, draft form behavior, and presentation.
- The engine should behave like a backend-style domain service even if transport and deployment are introduced later.

## Contract-First Flow

The current top-down direction is:

1. The user chooses a `RulesContext`.
2. The engine resolves a fixed flow for that `RulesContext`.
3. The frontend gathers durable user input for that flow.
4. The engine evaluates the submitted snapshot and returns authoritative build feedback.
5. Terminal or explicit projection requests may additionally return a full user-data sheet.

This keeps the frontend out of rules truth while still letting it own rendering and UX.

## Responsibilities

### Rules / compiler layer

- author and organize rules content
- normalize or compile it into an engine-executable form
- keep authored source data separate from runtime request data

### Engine layer

- accept rule-universe input plus user-source input
- resolve flow after rules are selected
- evaluate legality, progression, and derived build state
- return authoritative builder-facing outputs

### Frontend layer

- render the flow returned by the engine
- manage interaction and local draft behavior
- submit durable user input, not raw UI events
- present returned build status, issues, and projections

## Determinism

- Engine evaluation should stay deterministic for the same rules context and input snapshot.
- The frontend should not recompute rules truth on its own.
- Flow status, legality, and derived build outputs come from the engine contract, not from UI heuristics.

## Provenance And Explanation

The engine should continue to expose explanation/provenance surfaces where useful so the frontend can answer “why is this result what it is?” without re-implementing rule logic in the client.
