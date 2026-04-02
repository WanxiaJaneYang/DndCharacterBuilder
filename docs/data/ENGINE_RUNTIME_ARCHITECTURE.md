# Engine Runtime Architecture

This document defines the current runtime-contract direction on the `engine-refactor` integration branch. It supersedes branch-era plan text that lived only in `docs/plans/`.

The most important architectural reset is sequencing: this contract now starts from product semantics, not from the old executor loop. The architecture must first define the rule-universe boundary, the committed build state, and the caller-facing guarantees before it freezes any instruction model, bundle protocol, or convergence strategy.

## Purpose

The engine refactor is moving toward a backend-style domain service with a contract-first boundary:

- rules data stays authoritative
- the engine owns evaluation and flow resolution
- the frontend owns rendering and interaction
- API transport and deployment can be introduced later without changing the core contract

## Top-Level MVP Invariant

For MVP, the rule-universe lifecycle is intentionally simple:

- the user selects a `RulesContext`
- the engine compiles or normalizes that rule universe
- the engine resolves a fixed flow for that context
- the user builds inside that context
- if the `RulesContext` changes, the current build state is discarded and the flow restarts

This keeps MVP honest. Cross-ruleset preservation, orphan handling, and cleanup are later extensions, not hidden assumptions in the initial runtime contract.

## Canonical Product Objects

The current top-level architecture is built around five objects:

### `RulesContext`

The rule-universe input. Typical examples include:

- selected ruleset or edition
- enabled packs or sources
- optional-rule toggles
- bans, overrides, or house-rule profiles

`RulesContext` must be chosen before the engine resolves flow.

### `CompiledRulesContext`

The normalized or compiled executable form of the selected rule universe.

This is important architecturally, but whether it becomes a public API object, a cache key, or a purely internal implementation detail is still open.

### `FlowDescriptor`

The fixed builder flow derived from the chosen rules context.

Flow nodes should use opaque IDs from the resolved flow. The engine should not hardcode domain-specific UI nouns as its stable public contract.

### `CommittedBuildState`

The durable user-owned build state under one fixed rules context.

For MVP:

- it contains committed user data only
- temporary in-step edits stay in the frontend until commit
- it may be expressed in generic terms such as input, selection, and acquire
- it does not include derived engine state, projection output, or raw UI events

Older branch-era docs may refer to the dynamic input half as `RuntimeRequest`. That historical name is still useful context, but `RuntimeRequest = { changes[] }` is no longer treated as settled architecture truth.

### `EvaluationResult`

The authoritative engine response for the current committed build state.

It should cover legality, progression, explanation, and builder-facing outputs rather than acting as a thin legality-only answer.

## MVP Lifecycle

The intended product flow is:

1. The user selects a `RulesContext`.
2. The engine compiles or normalizes that rules context.
3. The engine resolves a fixed `FlowDescriptor`.
4. The frontend collects temporary step edits locally.
5. When the user commits a step, the frontend submits the current `CommittedBuildState`.
6. The engine evaluates that committed state and returns a new `EvaluationResult`.
7. If the `RulesContext` changes, the current `CommittedBuildState` is dropped and the flow restarts.

## Public Contract Surfaces

The current contract direction is best understood as two public surfaces plus an internal compilation step:

### `resolveFlow(rulesContext)`

Returns the fixed flow descriptor for the chosen `RulesContext`.

That descriptor should define:

- opaque node IDs
- ordering
- the structure needed for the frontend to render and navigate the builder

The engine may compile or cache the rules context internally first. That compile step is architecturally important but not yet locked as its own public API surface.

### `evaluate(rulesContext, committedBuildState)`

Recomputes the current authoritative build result for the submitted committed state.

At a high level, it should return:

- per-node legality and completion status
- issues, unresolved state, assumptions, and blocking feedback
- authoritative derived build state
- builder-facing projections or summaries
- explanation and provenance surfaces

At the terminal step, evaluation should also be able to return the full user-data sheet projection. That still counts as downstream output; it does not make the sheet the engine's source of truth.

## Source-State Boundary Rules

The engine boundary should obey these rules:

- submit committed user state, not raw UI events
- clicks, hover state, open panels, and stepper mechanics stay in the frontend
- the frontend must not send derived stats or final projections back as source truth
- the engine should evaluate authored or compiled rules data plus committed build state, not frontend-local drafts
- the request-side vocabulary should stay generic rather than hardcoding product nouns into the core engine contract

## User-Visible Guarantees Come Before Executor Design

The engine contract must be able to support the following caller-facing guarantees:

- authoritative node status for the current flow
- validation, unresolved state, assumptions, and blocking feedback
- explanation and provenance for why outcomes exist
- stable builder-facing projections during the flow
- terminal full user-data sheet output

These guarantees are more important than the shape of the internal loop. The executor exists to deliver these outcomes, not the other way around.

## Internal Architecture Still Intentionally Open

The following internal decisions are not settled architecture truth yet:

- whether evaluation uses a fixed-point executor
- whether any surviving request object still looks like `changes[]`
- whether capability behavior is modeled as `capability + op + args` or something more domain-shaped
- the exact ownership, typing, and merge rules for cross-capability facts, resources, and entities
- the final compiler IR and bundle statement model

Earlier branch work around these ideas remains valuable implementation context, but those internal shapes should now be treated as provisional candidates rather than as already-approved architecture.

## Cross-Capability Ownership Is A Required Follow-On

Cross-capability surfaces cannot remain "just namespaced IDs" forever.

The redesign still needs explicit ownership rules for:

- which capability owns which facts, resources, and entities
- which other capabilities may read them
- whether anything may be multi-writer
- how merge and conflict rules work
- which changes are observable versus private

Until that is defined, execution order must not quietly become the true conflict-resolution model.

## Projection Remains Downstream Output

Projection remains downstream of evaluation, not source truth.

That means:

- builder summaries are projections
- terminal full-sheet outputs are projections
- review data is projection
- explanation and provenance surfaces are projection

Projection is still first-class from a product perspective because the engine owes stable, explainable output surfaces to its callers.

## Backend / Frontend Separation

The target deployment model is a real backend/frontend separation, but the refactor remains contract-first.

Current stance:

- define source state and caller-facing guarantees first
- keep frontend and engine boundaries clean now
- add API transport before or during implementation of the separated system
- keep server-owned persistence or draft sessions out of MVP unless explicitly needed later

## Open Items

The following details are still intentionally open:

- the final transport/API shape
- whether `CompiledRulesContext` becomes a public handle or remains internal
- the exact normalized type names for committed build state and evaluation outputs
- the exact schema of builder summaries and terminal full-sheet payloads
- richer selection lifecycle semantics such as active, blocked, orphaned, cleanup reasons, and refunds
- long-lived backend persistence
- the final change algebra and executor model

Those should be decided on the `engine-refactor` line, but they should not force readers back into old plan docs just to understand the current architecture.
