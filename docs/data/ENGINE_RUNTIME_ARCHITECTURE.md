# Engine Runtime Architecture

This document defines the current runtime-contract direction on the `engine-refactor` integration branch. It supersedes branch-era plan text that lived only in `docs/plans/`.

## Purpose

The engine refactor is moving toward a backend-style domain service with a contract-first boundary:

- rules data stays authoritative
- the engine owns evaluation and flow resolution
- the frontend owns rendering and interaction
- API transport and deployment can be introduced later without changing the core contract

## Canonical Runtime Boundary

The runtime boundary now separates five things:

1. Authored source
2. Normalized pack IR
3. Compiled runtime bundle
4. `RulesContext`
5. per-build request snapshot

The engine should execute a compiled bundle against rule-universe input plus per-build user input. It should not execute raw authored entity fields, and it should not depend on frontend click history or transient UI state.

## RulesContext

`RulesContext` is the rule-universe input. Typical examples include:

- selected ruleset or edition
- enabled packs or sources
- optional-rule toggles
- bans, overrides, or house-rule profiles

`RulesContext` must be chosen before the engine resolves flow.

## Flow Resolution

The current direction is to treat flow as engine-owned output derived from `RulesContext`.

At the contract level:

- the frontend selects a `RulesContext`
- the engine resolves a flow descriptor for that context
- that flow is fixed for the chosen `RulesContext` in MVP
- flow nodes use opaque IDs defined by the resolved flow, not engine-reserved domain nouns

The frontend still owns presentation, layout, and component behavior, but it should not invent or reorder the authoritative flow on its own.

## Request Snapshot

After flow resolution, the frontend submits a durable request snapshot for evaluation.

Important boundary rules:

- submit durable user state, not raw UI events
- clicks, hover state, open panels, and stepper mechanics stay in the frontend
- the request remains generic and should avoid hardcoded D&D-specific engine primitives
- the request-side vocabulary may continue to use generic concepts such as:
  - input
  - selection
  - acquire

Older branch-era docs may refer to the request half as `RuntimeRequest`. That historical naming is still useful, but it is no longer sufficient by itself to describe the whole runtime source model.

## Two Main Contract Surfaces

The current contract direction is best understood as two surfaces:

### `resolveFlow(rulesContext)`

Returns the fixed flow descriptor for the chosen `RulesContext`.

That descriptor should define:

- opaque node IDs
- ordering
- the structure needed for the frontend to render and navigate the builder

### `evaluate(rulesContext, requestSnapshot)`

Recomputes the current authoritative build result for the submitted source state.

At a high level, it should return:

- per-node legality or completion status
- issues and blocking feedback
- authoritative derived build state
- builder-facing projections or summaries

At terminal or explicitly requested points, evaluation may also return a full user-data sheet projection. That still counts as downstream output; it does not make the sheet the engine’s source of truth.

## Compiled Runtime Bundle

The compiled runtime bundle remains static and character-agnostic.

It may contain:

- compiled rule fragments
- selection or flow schema references
- capability-owned runtime data
- constraints, grants, and other execution metadata

It must not contain:

- request-side user state
- frontend-local interaction state
- per-character mutable build drafts

## Execution And Derived Output

The engine is responsible for more than legality checks.

Evaluation should recompute the current authoritative build result from the submitted source state, including:

- derived build data
- progression legality
- node-level status
- downstream projections needed by the builder or final review surfaces

This keeps the builder honest: the frontend displays engine-returned truth instead of reconstructing the character on its own.

## Projection

Projection remains downstream of evaluation, not source truth.

That means:

- builder summaries are projections
- terminal full-sheet outputs are projections
- review data is projection
- explanation and provenance surfaces are projection

Projection is still important, but it should not become a back door for hiding engine state or frontend-owned logic inside the contract.

## Backend / Frontend Separation

The target deployment model is a real backend/frontend separation, but the refactor is intentionally contract-first.

Current stance:

- define the engine contract first
- keep frontend and engine boundaries clean now
- add API transport before or during implementation of the separated system
- keep server-owned persistence or draft sessions out of MVP unless explicitly needed later

## Open Items

The following details are still intentionally open:

- the final transport/API shape
- the exact normalized request type names
- the exact schema of builder summaries and terminal full-sheet payloads
- richer cleanup semantics such as active / blocked / orphaned projection surfaces
- long-lived backend persistence

Those should be decided on the `engine-refactor` line, but they should not force readers back into old plan docs just to understand the current architecture.
