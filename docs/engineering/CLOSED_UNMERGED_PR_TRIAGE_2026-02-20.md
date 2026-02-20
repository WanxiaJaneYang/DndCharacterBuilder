# Closed Unmerged PR Triage (2026-02-20)

## Goal
Audit closed/unmerged PR heads that are ahead of `main` and confirm whether any missing work must be re-opened in new MRs.

## Method
- Enumerated closed PRs where `mergedAt == null`.
- Compared each remote head against `origin/main`.
- Used two checks:
  - `ahead_of_main`: commit-count delta (`git rev-list --count origin/main..origin/<head>`).
  - `unique_patch_commits`: non-duplicate patch count (`git rev-list --right-only --cherry-pick --count origin/main...origin/<head>`).
- Checked whether each head is already represented by an open PR head.

## Results (One-by-One)
| PR | Head Branch | unique_patch_commits | Status | Resolution |
| --- | --- | ---: | --- | --- |
| #36 | `feat/3p5-class-data` | 10 | Active line | Covered by open PR #38 |
| #31 | `feat/3p5-class-data` | 10 | Active line | Covered by open PR #38 |
| #30 | `feat/mcp-localization-mcp-docs` | 0 | Superseded | No action (duplicate/superseded by merged localization work) |
| #29 | `feat/mcp-localization-mcp-design` | 1 | Superseded design slice | No action (superseded by later merged localization/class-design path) |
| #27 | `feat/3p5-class-data-design` | 1 | Superseded design slice | No action (replaced by merged clean branch path) |
| #22 | `feat/review-sheet-ui-breakdown` | 1 | Superseded | No action (replaced by merged v2 review-sheet line) |
| #18 | `copilot/sub-pr-17` | 7 | Sub-PR staging branch | No direct merge; parent line merged via #17 |
| #10 | `copilot/sub-pr-9` | 2 | Sub-PR staging branch | No direct merge; parent line merged via #9 |
| #8 | `codex/refactor-codebase-for-agentic-coding-improvements` | 7 | Early refactor line | No action; superseded by subsequent merged hardening |
| #5 | `copilot/fix-cicd-pipeline` | 0 | Duplicate CI fix | No action |
| #3 | `codex/initialize-dd-3.5-character-builder-repo-6w8ahk` | 3 | Bootstrap-era branch | No action (historical initialization path) |
| #2 | `codex/initialize-dd-3.5-character-builder-repo-up7co1` | 1 | Bootstrap-era branch | No action (historical initialization path) |
| #1 | `codex/initialize-dd-3.5-character-builder-repo` | 4 | Bootstrap-era branch | No action (historical initialization path) |

## Conclusion
- No additional code MR is required from the stale closed/unmerged set right now.
- Current actionable lines remain:
  - PR #38 (`feat/3p5-class-data`)
  - PR #34 (`feat/race-deferred-mechanics`)

If a specific stale branch must be recovered, open a new dedicated MR from `main` with selective cherry-picks only, not branch-to-main wholesale merges.
