# Backlog Triage

Last updated: 2026-03-05

This document records the recommended execution order for currently open GitHub issues, plus the intended duplicate and umbrella relationships. It exists to keep repo planning in sync with the actual codebase rather than a stale backlog snapshot.

## Evidence-Based Notes

- `#69` is completed via PR #128 (merged on 2026-03-05), establishing the initial pack-reference integrity guardrail in contracts.
- `#72` is completed via PR #136 (merged on 2026-03-05), stabilizing item schema validation and Phase-1 combat attack-line item classification.
- The repo already has minimal SRD contract fixtures, contract CI wiring, and contract-fixture safety checks.
- The repo already has level-1 skill budget math, cross-class cost/rank validation, and web/UI coverage for the current skills step.
- The repo already has a review/export surface and `sheetViewModel`, so follow-up issues in that area should target contract hardening and cleanup, not greenfield implementation.
- Closed follow-ups removed from active sequencing:
  - `#70` minimal SRD 3.5 skill list completion
  - `#95` engine/export skill-budget gaps
  - `#102` engine-driven skill allocation validation
  - `#103` remove UI defaults for missing metadata
  - `#104` expose skill budget breakdown
- New 2026-03-05 planning issues now in active backlog:
  - `#124` [Epic] Rules/Data Integrity and Engine Foundations
  - `#125` [Epic] Wizard Reliability and Sheet Output Stabilization
  - `#126` [Epic] Character Persistence UX
  - `#132` Specialized skill subskills rollout umbrella
  - `#139` Proficiency-aware ACP follow-up
  - `#140` Conditional skill modifiers (synergy first)
  - `#141` Expand SRD 3.5 equipment catalog
  - `#142` Expand unresolved-rules contract fixture coverage

## Recommended Order

1. P0 issues first (all current P0 scope):
   - `#124` [Epic] Rules/Data Integrity and Engine Foundations
   - `#125` [Epic] Wizard Reliability and Sheet Output Stabilization
   - `#88` [Umbrella] Flow-driven wizard runner
   - `#84` [Umbrella] Unresolved-rules surfaced on sheet fields
   - `#83` [Umbrella] Skills completeness + legality
   - `#82` Minimal equipment model for AC + attack lines
2. Finish P1 regressions and contract hardening that reduce rework risk:
   - `#123` race-step E2E regression
   - `#96` skill-budget contract invariants
   - `#142` unresolved-rules contract fixture expansion
3. Move from foundations to data breadth in the same vertical slices:
   - `#141` expand minimal SRD equipment catalog
   - `#77` feat legality and fighter bonus feat handling
   - `#91` expand skill dataset to SRD-complete
4. Sheet/view-model contract stability and rendering quality:
   - `#86` sheet-spec contract snapshot
   - `#110` add `schemaVersion` to `sheetViewModel`
   - `#111` reshape attacks/damage model
   - `#131` show untrained skills on review sheet
5. Localization and presentation cleanup after contracts stabilize:
   - `#89` localization layer for pack entities
   - `#90` UI should never render raw IDs
   - `#85` class features/feat text rendering
6. Specialized-skill subskills rollout as a coordinated slice:
   - `#132` umbrella follow-up
   - `#133` UI grouping for specialized subskills
   - `#134` EN/ZH localization coverage for specialized skills
   - `#135` long-term specialized-subskill catalog strategy
   - `#140` conditional skill modifiers (synergy first)
   - `#139` ACP/proficiency follow-up
7. Later-cycle architecture and UX:
   - `#74` refactor engine index into modules
   - `#78` pack tooling scripts/linting
   - `#92` sheet-spec compliance + layout polish
   - `#79` export/import UX
   - `#126` character persistence epic

## Sprint-1 Candidate Scope (Next Sprint)

Target window: 2026-03-06 to 2026-03-13.

- **Goal A (Reliability baseline):** `#82`, `#123`, `#96`
- **Goal B (Contract confidence):** `#142`
- **Goal C (Data breadth kickoff):** `#141`
- **Carry-in if capacity remains:** `#131` or `#77`

Rationale: this mixes one P0 foundation item with regression/contract guardrails and a contained data-pack expansion, maximizing shipped value while reducing churn risk for subsequent P1 work.

## Umbrella Mapping

- `#124` (Rules/Data Integrity epic): `#82`, `#86`, `#96`, `#110`, `#111`, `#141`, `#142`, `#74`, `#78`
- `#125` (Wizard Reliability and Sheet Output epic): `#88`, `#123`, `#131`, `#89`, `#90`, `#85`, `#92`
- `#83` (Skills completeness + legality umbrella): `#91`, `#77`, `#132`, `#133`, `#134`, `#135`, `#139`, `#140`
- `#84` (Unresolved-rules umbrella): `#76`, `#142`

## Issue-Editing Guidance

- Do not close an issue because part of its work landed; close only when acceptance criteria are met.
- Keep umbrella issue bodies updated with active child links.
- When de-prioritizing, document why in issue comments so backlog order stays explainable.
