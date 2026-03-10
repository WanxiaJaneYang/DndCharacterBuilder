# Trellis Workflow Boundaries And MR Discipline Update

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clarify that Trellis owns session bootstrap and execution-task tracking, while existing repo docs remain the source of truth for product and engineering guidance; update MR discipline to match that split.

**Architecture:** Keep one source of truth per concern. Use `.trellis/tasks/` for active execution state, `.trellis/workspace/` for per-agent journals, `docs/engineering/WORK_PLAN.md` for roadmap/sprint direction only, and `.codex/mr-flow-and-approvals.md` for MR review/merge discipline.

**Tech Stack:** Markdown documentation, Trellis workflow scripts, repo-local agent guidance

---

### Task 1: Codify the Boundary In Agent Entry Points

**Files:**
- Modify: `AGENTS.md`
- Modify: `.codex/skills/repo-standards/SKILL.md`

1. Add a concise rule that `.trellis/` is for bootstrap/task/journal workflow, not domain documentation.
2. Require session startup via `/trellis:start` or the manual Trellis commands before substantive repo work.
3. Point repo-local workflow guidance at the Trellis startup flow so entry points do not drift.

### Task 2: Update MR Discipline

**Files:**
- Modify: `.codex/mr-flow-and-approvals.md`

1. State the source-of-truth split explicitly.
2. Require MR-related sessions to bootstrap Trellis context first.
3. Require task execution state to live in `.trellis/tasks/` and forbid using `docs/engineering/WORK_PLAN.md` as a live status log.
4. Preserve repo-specific review/merge discipline as independent from Trellis.

### Task 3: Update Engineering Docs

**Files:**
- Modify: `docs/engineering/README.md`
- Modify: `docs/engineering/WORK_PLAN.md`
- Modify: `README.md`

1. Reframe `WORK_PLAN.md` as roadmap/sprint guidance only.
2. Add pointers showing where active execution state and session journals now live.
3. Update top-level docs so contributors know to start with Trellis for session context, then use repo docs for substantive guidance.

### Task 4: Verify Documentation Consistency

**Files:**
- Review diffs for all touched files

1. Confirm there is no remaining ambiguity about:
   - active task state;
   - session journals;
   - domain/spec source of truth;
   - MR review discipline.
2. Summarize follow-up cleanup candidates separately instead of mixing them into this migration.
