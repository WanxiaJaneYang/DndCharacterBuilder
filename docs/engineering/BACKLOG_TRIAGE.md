# Backlog Triage

Last updated: 2026-03-05

This document records the recommended execution order for currently open GitHub issues, plus the intended duplicate and umbrella relationships. It exists to keep repo planning in sync with the actual codebase rather than a stale backlog snapshot.

## Evidence-Based Notes

- `#69` is completed via PR #128 (merged on 2026-03-05), establishing the initial pack-reference integrity guardrail in contracts.
- `#72` is completed via PR #136 (merged on 2026-03-05), stabilizing item schema validation and Phase-1 combat attack-line item classification.
- The repo already has minimal SRD contract fixtures, contract CI wiring, and contract-fixture safety checks.
- The repo already has level-1 skill budget math, cross-class cost/rank validation, and web/UI coverage for the current skills step.
- The repo already has a review/export surface and `sheetViewModel`, so follow-up issues in that area should target contract hardening and cleanup, not greenfield implementation.

## Recommended Order

1. Skill-system follow-up slice:
   - `#95` remaining engine/export skill-budget gaps
   - `#102` engine-driven skill allocation validation
   - `#103` remove UI defaults for missing metadata
   - `#104` expose skill budget breakdown
2. Regression coverage for the same slice:
   - `#96` contract tests for skill-budget invariants
   - `#94` E2E regression for the skills step (completed via PR #121 on 2026-03-05)
   - `#93` E2E regression for the abilities step (completed via PR #120 on 2026-03-05)
3. `#70` minimal SRD 3.5 skill list completion
4. `#77` feat legality and fighter bonus-feat handling
6. Unresolved-rules slice:
   - `#84` sheet-mapped unresolved-rules contract
   - `#76` unresolved-rules review UX
7. Sheet/export contract hardening:
   - `#86` sheet-spec contract snapshot
   - `#110` `sheetViewModel` schema versioning
   - `#111` attacks/damage-model reshaping
8. `#114` and `#115` `sheetViewModel` cleanup follow-ups from `#113`
9. `#92` sheet-spec compliance and UI layout polish
10. Localization and data presentation:
   - `#89` localization layer for pack entities
   - `#90` prevent raw IDs in UI
   - `#85` class-feature/feat rules text
11. Expanded content and architecture:
   - `#91` SRD-complete skill dataset
   - `#88` flow-driven wizard runner
   - `#74` engine modularization
   - `#78` pack tooling
12. `#79` export/import UX

## Ordering Rationale

- `#69` landed first to reduce noisy failures and provide clearer diagnostics before broader data expansion work.
- The skill-system engine and regression slice landed before `#72`; item-schema stabilization then landed via PR #136 once skill/export contracts were stable.

## Duplicate and Umbrella Mapping

### Closed as duplicate or superseded

- `#75` is subsumed by `#88`. Keep `#88` as the canonical wizard-runner refactor issue.
- `#71` overlaps heavily with already-landed engine behavior and the still-open follow-ups `#95`, `#102`, `#103`, and `#104`. Treat those follow-ups as the actionable remainder.

### Umbrella issues

- `#83` should act as the umbrella for skill completeness and legality.
  - Child or follow-up issues: `#70`, `#95`, `#96`, `#102`, `#103`, `#104`, `#91`
- `#88` should act as the umbrella for the flow-driven wizard refactor.
  - Child or follow-up issues: `#75`
- `#84` should act as the umbrella for unresolved-rules surfacing on the sheet and review UI.
  - Child or follow-up issues: `#76`

## Issue-Editing Guidance

- Do not close an issue just because part of it landed; first check whether the acceptance criteria still describe real remaining work.
- When an issue becomes an umbrella, edit its body so contributors can see the intended child issues without searching through PR history.
- When closing a duplicate, comment with the canonical issue number and the reason the duplicate is no longer the right implementation target.
