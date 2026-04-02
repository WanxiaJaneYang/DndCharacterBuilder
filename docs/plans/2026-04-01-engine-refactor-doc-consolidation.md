# Engine Refactor Doc Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate the engine-refactor architecture truth onto the new `engine-refactor` line, move current conclusions out of `docs/plans/`, and update outdated contract wording before opening a review PR against `engine-refactor`.

**Architecture:** Keep `docs/plans/` as historical process records and move current refactor truth into a small canonical set outside `docs/plans/`. Use `docs/architecture.md` for the system boundary, `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md` for the current engine contract, and `docs/engineering/ENGINE_REFACTOR_STATUS.md` for the active branch spine, issue map, and migration status. Old plan docs should remain readable but explicitly marked as historical references rather than live architecture truth.

**Tech Stack:** Markdown docs, Trellis task tracking, git branches/worktrees, GitHub PR workflow

---

### Task 1: Establish The Canonical Doc Set

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/data/README.md`
- Create: `docs/engineering/ENGINE_REFACTOR_STATUS.md`

**Step 1: Write the target outline**

Lock the target doc roles before rewriting content:
- `docs/architecture.md`
  - system-level boundary
  - frontend / backend / engine / rules data responsibilities
  - note that `engine-refactor` is the integration line for the redesign
- `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
  - current runtime contract only
- `docs/engineering/ENGINE_REFACTOR_STATUS.md`
  - issue spine
  - branch strategy
  - active lane
  - historical-plan index
- `docs/data/README.md`
  - point readers to the canonical runtime and refactor docs

**Step 2: Implement the minimal skeleton**

Add the new status doc and update the existing top-level doc pointers so the canonical set exists before any historical notes are added.

**Step 3: Verify the structure**

Run:

```bash
rg -n "engine-refactor|ENGINE_REFACTOR_STATUS|ENGINE_RUNTIME_ARCHITECTURE" docs/architecture.md docs/data/README.md docs/engineering/ENGINE_REFACTOR_STATUS.md
```

Expected:
- each canonical file is discoverable by name
- the new status doc is referenced from stable docs

### Task 2: Rewrite The Current Runtime Contract To Match The New Direction

**Files:**
- Modify: `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- Modify: `docs/architecture.md`

**Step 1: Remove the outdated branch-era stance**

Replace or rewrite statements that are no longer current on the new refactor line, especially:
- `CompiledRuntimeBundle + RuntimeRequest` as the whole engine source model
- request-centered `changes[]` as the only top-level source contract
- flow as merely projection-only output without a fixed flow-resolution role
- wording that does not leave room for backend/frontend separation

**Step 2: Write the current contract**

The updated runtime/architecture docs should reflect the currently agreed direction:
- engine as backend-style domain service
- contract-first separation, API later
- rules data / compiled bundle / engine / frontend separation
- `RulesContext` as the rule-universe input
- flow resolved after rules selection
- flow fixed for that `RulesContext`
- evaluation returns authoritative build feedback, not just legality
- projection remains downstream output, but product-facing builder outputs are still engine-returned

Keep the wording high-level where details are still open. Do not invent final payload fields that have not been agreed.

**Step 3: Verify key terms**

Run:

```bash
rg -n "RulesContext|resolveFlow|evaluate|backend|fixed flow|engine-refactor" docs/architecture.md docs/data/ENGINE_RUNTIME_ARCHITECTURE.md
```

Expected:
- old `RuntimeRequest`-only framing is gone
- the new boundary terms appear in the canonical docs

### Task 3: Downgrade Historical Plan Docs Out Of Source-Of-Truth Status

**Files:**
- Modify: `docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md`
- Modify: `docs/plans/2026-03-15-pack-compiler-migration-architecture.md`
- Modify: `docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md`
- Modify: `docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md`

**Step 1: Add historical-context notes**

At the top of each plan doc, add a short note that says:
- this file records historical planning/design state on the older refactor line
- current canonical architecture truth lives outside `docs/plans/`
- point readers to:
  - `docs/architecture.md`
  - `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
  - `docs/engineering/ENGINE_REFACTOR_STATUS.md`

**Step 2: Correct only the most misleading outdated claims**

Do not rewrite every historical paragraph. Only fix or annotate statements that would materially mislead a current reader, especially where the old text now conflicts with:
- `RulesContext` as first-class source state
- the new `engine-refactor` integration-branch narrative
- the separation between historical plan docs and current truth

**Step 3: Verify the downgrade markers**

Run:

```bash
rg -n "historical|canonical|ENGINE_REFACTOR_STATUS|ENGINE_RUNTIME_ARCHITECTURE" docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md docs/plans/2026-03-15-pack-compiler-migration-architecture.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md
```

Expected:
- all four plan docs clearly point to the canonical docs

### Task 4: Record The New Integration-Branch Narrative

**Files:**
- Modify: `docs/engineering/ENGINE_REFACTOR_STATUS.md`
- Optional modify: `docs/data/README.md`

**Step 1: Define the new branch narrative**

Record that:
- `engine-refactor` is the new integration branch for the overall refactor
- PR `#237` is treated as a carried-forward asset on this line, not the final word
- already-merged or previously-landed refactor-related work may be absorbed into this line when necessary
- future doc and implementation work should organize around this branch instead of scattered issue-plan docs

**Step 2: Record the issue spine**

List the current issue chain and responsibilities at a high level:
- `#232`
- `#233`
- `#235`
- `#236`
- `#238`
- `#239`
- `#240`
- `#241`
- `#122`

Keep it concise. This is a branch-status doc, not another ADR.

**Step 3: Verify discoverability**

Run:

```bash
rg -n "894556e|#237|engine-refactor|#232|#233|#239|#241" docs/engineering/ENGINE_REFACTOR_STATUS.md
```

Expected:
- the branch narrative and issue spine are explicit

### Task 5: Final Review And PR Preparation

**Files:**
- No new files expected beyond the docs above

**Step 1: Review the diff**

Run:

```bash
git diff --stat
git diff -- docs/architecture.md docs/data/README.md docs/data/ENGINE_RUNTIME_ARCHITECTURE.md docs/engineering/ENGINE_REFACTOR_STATUS.md docs/plans/2026-03-15-issue-232-compute-runtime-input-adapters.md docs/plans/2026-03-15-pack-compiler-migration-architecture.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-design.md docs/plans/2026-03-17-issue-233-engine-capability-architecture-implementation.md docs/plans/2026-04-01-engine-refactor-doc-consolidation.md
```

Expected:
- the PR is doc-focused
- no opportunistic engine/runtime code changes are mixed in

**Step 2: Run minimal validation**

Run:

```bash
git diff --check
```

Expected:
- no whitespace or patch-format issues

**Step 3: Prepare PR summary**

The PR summary should state:
- `engine-refactor` is now the integration branch for the redesign
- current architecture truth has been consolidated outside `docs/plans/`
- outdated branch-era contract wording was corrected
- historical plan docs remain available but no longer act as live architecture truth

**Step 4: Human commit / push / PR**

Per repo workflow, leave a clean reviewable diff for commit/push/PR creation on this branch rather than committing inside the task.
