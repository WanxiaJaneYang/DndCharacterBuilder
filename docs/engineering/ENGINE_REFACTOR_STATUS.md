# Engine Refactor Status

This file tracks the current integration-branch narrative for the engine redesign.

## Integration Branch

- Integration branch: `engine-refactor`
- Current base line: carried forward from the older refactor branch at commit `894556e` (`#237`)
- Purpose: unify the frontend/backend split and the engine redesign on one long-lived branch instead of scattering the work across isolated plan docs and issue-only narratives

`#237` and other earlier refactor work on the older line should be treated as carried-forward assets, not as the final architecture truth.

## Canonical Docs

Current architecture truth lives in:

- `docs/architecture.md`
- `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- `docs/engineering/ENGINE_REFACTOR_STATUS.md`

Historical reasoning and implementation notes remain in `docs/plans/`.

## Current Direction

- treat the engine as a backend-style domain service
- keep the refactor contract-first; add API transport as the boundary stabilizes
- start from source state and caller-facing guarantees before freezing executor internals
- resolve flow after `RulesContext` selection
- keep flow fixed for that `RulesContext` in MVP
- reset the current build state when `RulesContext` changes in MVP
- have evaluation return authoritative build feedback rather than legality-only answers
- keep frontend rendering, temporary edits, and interaction out of engine truth

## Top-Down Reset Principles

The branch is now being reframed around these rules:

- define `RulesContext` and committed build state before defining runtime change envelopes
- define engine obligations and stable output surfaces before approving executor details
- treat `RuntimeRequest = { changes[] }` as historical branch context, not settled architecture truth
- treat fixed-point execution as a candidate implementation strategy, not as the starting architectural invariant
- keep selection lifecycle, cleanup semantics, and cross-capability ownership as explicit design problems rather than hiding them inside ordering rules

## Issue Spine

This branch currently treats the redesign spine as:

- `#232`: legacy request/runtime boundary migration work from the older line
- `#233`: architecture approval history for the runtime redesign
- `#235`: compiler scaffold
- `#236`: selection-schema compilation
- `#238`: runtime state and change semantics that must be defined before executor freeze
- `#240`: `RulesContext` and rule-universe semantics
- `#239`: projection and output contract
- `#241`: blocked/orphaned cleanup semantics and later selection lifecycle work
- `#122`: first native capability slice

## Working Rules

- New implementation PRs for the redesign should target `engine-refactor`, not `main`, unless explicitly stated otherwise.
- `docs/plans/` may still hold design and implementation history, but stable conclusions must be promoted out of `docs/plans/`.
- Earlier PRs that materially belong to the redesign may be absorbed into this branch narrative when necessary, even if they were merged elsewhere before the branch strategy was clarified.
- Internal executor, IR, and registry details should stay provisional until source state, ownership, and output guarantees are explicit.

## Required Follow-Up Issues

- `RulesContext` edit semantics must be treated as a separate follow-up architecture issue. This branch currently documents the MVP reset behavior, but that is not the final semantic answer for rule-universe edits. The follow-up must define what recomputation means when ruleset, packs, optional rules, bans, or overrides change mid-build, and whether reset remains only a temporary frontend policy.

## Historical Plan Index

Readers looking for branch history can start with:

- `docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md`
- `docs/plans/2026-03-15-pack-compiler-migration-architecture.md`
- `docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md`
- `docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md`
- `docs/plans/2026-04-01-engine-refactor-doc-consolidation.md`

Those files explain how the branch got here. They do not replace the canonical docs above.
