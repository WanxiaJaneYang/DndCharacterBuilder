# Architecture

This repository is moving off the old monolithic wizard-plus-engine shape and onto the `engine-refactor` integration line. The target is a contract-first frontend/backend split: the frontend owns rendering and interaction, while the engine owns rules evaluation and returns authoritative build feedback.

The refactor is now being driven top-down from product invariants, not bottom-up from the old executor model. The architecture must first define what survives rules changes, what the user is building, and what the engine owes its callers before it freezes any internal loop, IR, or registry shape.

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

## Top-Level Product Invariant

For MVP, the hardest invariant is the relationship between the selected rule universe and the current build:

- the user first chooses a `RulesContext`
- the engine compiles or normalizes that rule universe
- the engine resolves a fixed flow for that context
- the user then builds inside that context
- if the `RulesContext` changes, MVP resets the current build and starts fresh

This means MVP does not yet preserve cross-ruleset build progress. That later preservation and cleanup story is important, but it should extend the architecture rather than distort the initial contract.

## Core Product Objects

The architecture should be understood in terms of these first-class objects:

- `RulesContext`
  The selected rule universe: ruleset, enabled packs, optional rules, bans, overrides, and similar choices.
- `CompiledRulesContext`
  The normalized or compiled executable form of that rule universe.
- `FlowDescriptor`
  The fixed builder flow derived from the chosen rules context.
- `CommittedBuildState`
  The durable user-owned build state under the current rules context. For MVP, this contains committed user data only. Temporary edits stay in the frontend until the user commits a step.
- `EvaluationResult`
  The authoritative engine response for the current committed build state.

## MVP Lifecycle

The top-down MVP flow is:

1. The user chooses a `RulesContext`.
2. The engine compiles or normalizes that rules context.
3. The engine resolves a fixed `FlowDescriptor`.
4. The frontend gathers temporary edits locally while the user works through a step.
5. When the user commits a step, such as clicking `Next`, the frontend submits the current `CommittedBuildState`.
6. The engine evaluates that committed state and returns the updated authoritative result.
7. If the `RulesContext` changes, the current `CommittedBuildState` is discarded and the flow starts over.

## Responsibilities

### Rules / compiler layer

- author and organize rules content
- normalize or compile it into an engine-executable form
- keep authored source data separate from build state

### Engine layer

- accept the selected rule universe and committed build state
- resolve flow after rules are selected
- evaluate legality, progression, and derived build state
- return authoritative builder-facing outputs and explanations

### Frontend layer

- render the flow returned by the engine
- manage interaction and temporary local edits
- submit committed build state, not raw UI events
- present returned build status, issues, explanations, and projections

## Determinism

- Engine evaluation should stay deterministic for the same rules context and committed build state.
- The frontend should not recompute rules truth on its own.
- Flow status, legality, and derived build outputs come from the engine contract, not from UI heuristics.

## Engine Obligations

For MVP, the engine must be able to:

- return the flow after rules selection
- return legality and completion status for the current flow
- return issues, unresolved state, assumptions, and blocking feedback where applicable
- return explanation and provenance surfaces so the frontend can answer why a result exists
- return authoritative builder-facing summaries during the flow
- return the full user-data sheet at the terminal step

## Deferred Internal Decisions

These are intentionally downstream of the product contract:

- whether the runtime executor is fixed-point or something simpler
- whether `RuntimeRequest = { changes[] }` survives in any public or internal form
- whether capability behavior is modeled as `capability + op + args` or something more domain-shaped
- the final ownership and merge rules for cross-capability facts, resources, and entities
- the final transport/API shape and any long-lived backend persistence

Those details matter, but they should follow from the top-level product objects and guarantees above rather than define them.
