# Issue 240 RulesContext Sheet-Centric Build Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define the MVP `RulesContext` boundary and the sheet-centric build model for `engine-refactor`, and align the canonical runtime docs with that model.

**Architecture:** Treat `RulesContext` as the rule-universe selector only, compile it into a cacheable `CompiledBundle`, and treat runtime building as progressive completion of a target character sheet rather than progression through page state. Keep flow as navigation around the target sheet, keep `RuntimeRequest` limited to committed selections and inputs, and make `RulesContext` changes reset the build in MVP.

**Tech Stack:** Markdown docs, Trellis task tracking, git branch workflow

---

### Task 1: Record The Issue 240 Model In A Dedicated Plan Doc

**Files:**
- Create: `docs/plans/2026-04-02-issue-240-rulescontext-sheet-centric-build-model.md`

**Step 1: Capture the agreed core model**

Record these decisions:
- `RulesContext` MVP fields are `rulesetId`, `enabledPackIds`, and optional `flowId`
- `NormalizedRulesContext` sorts and dedupes pack IDs and exposes a stable `contextKey`
- `CompiledBundle` is cacheable and independent from character selections
- the build is sheet-centric: target sheet is the primary build target, flow is navigation around it
- `RuntimeRequest` only carries committed selections and inputs
- `EvaluationResult` projects current sheet state, completion state, and constraints
- MVP `RulesContext` changes reset the build

**Step 2: Keep issue 240 scope tight**

Explicitly defer:
- pack overrides or bans
- migration/orphan preservation
- runtime selection lifecycle cleanup
- cross-capability ownership details beyond what the model needs to explain the boundary

**Step 3: Verify the plan doc exists**

Run:

```bash
rg -n "Sheet-Centric Build Model|RulesContext|CompiledBundle|RuntimeRequest|EvaluationResult" docs/plans/2026-04-02-issue-240-rulescontext-sheet-centric-build-model.md
```

Expected:
- the plan doc records the agreed issue 240 vocabulary

### Task 2: Tighten The Canonical Architecture Overview

**Files:**
- Modify: `docs/architecture.md`

**Step 1: Replace generic top-level object wording with the issue 240 model**

Update the architecture overview so it clearly says:
- `RulesContext` defines the rule universe
- `CompiledBundle` is the compiled static rules world
- `TargetCharacterSheetSchema` is the build target
- `FlowDescriptor` is navigation around the target sheet
- `RuntimeRequest` carries committed selections and inputs
- `EvaluationResult` returns the current projected sheet and completion state

**Step 2: Keep MVP reset policy explicit but scoped**

State that build reset on `RulesContext` change is an MVP policy, not a full long-term migration design.

**Step 3: Verify the overview terms**

Run:

```bash
rg -n "TargetCharacterSheetSchema|FlowDescriptor|CompiledBundle|RuntimeRequest|EvaluationResult|MVP policy" docs/architecture.md
```

Expected:
- the architecture overview uses the new sheet-centric vocabulary

### Task 3: Rewrite The Runtime Contract Around The Sheet-Centric Model

**Files:**
- Modify: `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`

**Step 1: Define the object model**

Document the MVP contracts for:
- `RulesContext`
- `NormalizedRulesContext`
- `CompiledBundle`
- `TargetCharacterSheetSchema`
- `FlowDescriptor`
- `RuntimeRequest`
- `EvaluationResult`
- `CurrentCharacterSheet`
- `CompletionState`

**Step 2: Remove over-generalized bundle wording**

Tighten the bundle contract so it exposes:
- `statements`
- `registries.entities`
- `registries.selections`
- `targetSheetSchema`
- `flow`

Do not expose `resources` or `projections` as compiled public contract fields in this issue.

**Step 3: Reframe flow as navigation**

Make it explicit that:
- sheet is the primary build truth
- flow is navigation around the target sheet
- runtime requests operate on selections and inputs, not on projected sheet fields

**Step 4: Verify the runtime doc**

Run:

```bash
rg -n "RulesContext|NormalizedRulesContext|CompiledBundle|TargetCharacterSheetSchema|FlowDescriptor|RuntimeRequest|EvaluationResult|CurrentCharacterSheet|CompletionState" docs/data/ENGINE_RUNTIME_ARCHITECTURE.md
```

Expected:
- the runtime contract centers the sheet-centric model rather than the old executor model

### Task 4: Update Branch Status And Follow-Up Boundaries

**Files:**
- Modify: `docs/engineering/ENGINE_REFACTOR_STATUS.md`

**Step 1: Add the issue 240 direction**

Update the branch status doc so it now says:
- `#240` defines `RulesContext` and the sheet-centric build model
- `RulesContext` compiles into a `CompiledBundle`
- MVP build reset is current policy

**Step 2: Preserve follow-up separation**

Keep separate follow-up status for:
- deeper `RulesContext` edit semantics
- selection lifecycle / cleanup
- output contract stabilization

**Step 3: Verify branch status**

Run:

```bash
rg -n "#240|RulesContext|CompiledBundle|sheet-centric|reset" docs/engineering/ENGINE_REFACTOR_STATUS.md
```

Expected:
- issue 240 is described with the new boundary

### Task 5: Final Review

**Files:**
- Review: `docs/architecture.md`
- Review: `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- Review: `docs/engineering/ENGINE_REFACTOR_STATUS.md`
- Review: `docs/plans/2026-04-02-issue-240-rulescontext-sheet-centric-build-model.md`

**Step 1: Review the diff**

Run:

```bash
git diff --stat
git diff -- docs/architecture.md docs/data/ENGINE_RUNTIME_ARCHITECTURE.md docs/engineering/ENGINE_REFACTOR_STATUS.md docs/plans/2026-04-02-issue-240-rulescontext-sheet-centric-build-model.md
```

Expected:
- the diff is doc-only and tightly scoped to issue 240

**Step 2: Run patch validation**

Run:

```bash
git diff --check
```

Expected:
- no patch-format or whitespace issues

**Step 3: Prepare commit summary**

The commit summary should say:
- issue 240 now defines `RulesContext` as the MVP rule-universe selector
- builds are sheet-centric rather than flow-centric
- compiled bundle, runtime request, and evaluation result boundaries are clearer
