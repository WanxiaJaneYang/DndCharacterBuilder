# Schema-Driven Page Composition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce schema-driven page composition so wizard pages are assembled from pack-owned JSON page schemas and stable registered UI components instead of hardcoded `App.tsx` branches.

**Architecture:** Keep `flow` responsible for wizard sequencing and `pageSchemaId` references. Add standalone page schema files under pack-owned UI config, a typed page-schema contract and loader, a closed component registry, and a `PageComposer` runtime. Migrate existing page branches to schema-driven composition incrementally, starting with simpler surfaces and preserving the engine/UI boundary from `#162`.

**Tech Stack:** React, TypeScript, npm workspaces, pack JSON files, schema validation package, Vitest, Playwright, GitHub issues.

---

### Task 1: Freeze the architecture boundary in docs and issue relationships

**Files:**
- Create: `docs/plans/2026-03-10-schema-driven-page-composition-design.md`
- Create: `docs/plans/2026-03-10-schema-driven-page-composition-implementation.md`
- Reference: GitHub issues `#181`, `#182`, `#88`, `#151`, `#162`

**Step 1: Keep the design doc aligned with issue #181**

Verify the design doc explicitly states:
- `flow` owns step order/navigation plus `pageSchemaId`
- page schemas are standalone JSON files
- v1 bindings are path-only and declarative
- unknown block types fail validation

**Step 2: Keep this implementation plan aligned with issue #182**

Verify this plan only covers rollout sequencing and child work decomposition, not new architecture decisions.

**Step 3: Record issue relationships**

Make sure child issues created from this plan reference:
- Parent design issue: `#181`
- Parent planning issue: `#182`
- Related backlog issues: `#88`, `#151`, `#162`

### Task 2: Introduce a page schema contract and storage convention

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/schema.test.ts`
- Create: `packs/srd-35e-minimal/ui/pages/`
- Create: one or more sample page schema JSON files under `packs/srd-35e-minimal/ui/pages/`

**Step 1: Define the storage convention**

Adopt:

- `packs/<pack-id>/ui/pages/<page-id>.page.json`

Do not store page layout blocks inline inside flow step objects.

**Step 2: Add schema types and validation**

Add a `PageSchema` contract that validates:
- page id
- title/description keys where needed
- ordered block list
- block ids
- block type enum / discriminated union
- static props
- path-only bindings

Expected runtime behavior:
- invalid page schema fails load/validation
- unknown block type fails validation

**Step 3: Add pack-local fixture coverage**

Add tests proving:
- valid sample page schema parses
- unknown block type is rejected
- forbidden expression-like binding strings are rejected if they violate the path-only rule

### Task 3: Extend flow to reference page schemas without swallowing layout config

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/schema.test.ts`
- Modify: `packs/srd-35e-minimal/flows/character-creation.flow.json`
- Inspect: `packages/datapack/src/node.ts`

**Step 1: Add `pageSchemaId` to the flow contract**

Add a stable step-level field that references a page schema id.

Keep existing flow responsibilities intact:
- ordering
- labels
- gating
- step ids

Do not add nested block trees to the flow step object.

**Step 2: Decide how legacy step config coexists during migration**

Allow temporary coexistence for fields already in use today, such as:
- `abilitiesConfig`
- `abilityPresentation`

But do not widen that path with more page-layout config.

**Step 3: Add validation coverage**

Add tests that:
- accept steps with a valid `pageSchemaId`
- reject malformed references
- preserve backward compatibility for still-migrating steps

### Task 4: Add page-schema loading and runtime plumbing in the web app

**Files:**
- Create: `apps/web/src/pageSchemas.ts`
- Create: `apps/web/src/pageSchemaContext.ts`
- Modify: `apps/web/src/loadMinimalPack.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Load page schemas alongside flow data**

Add a web-facing loader path that makes pack page schemas available at runtime by id.

**Step 2: Build a page context adapter**

Create a typed adapter that prepares page-facing context objects, for example:
- `page.metadata`
- `page.review`
- `page.abilities`
- `page.skills`

This adapter is where shaping belongs. Do not move shaping logic into JSON.

**Step 3: Keep App.tsx thin**

`App.tsx` should:
- read current step
- resolve `pageSchemaId`
- assemble shared page context
- hand off to `PageComposer`

### Task 5: Build the PageComposer and closed component registry

**Files:**
- Create: `apps/web/src/page-composer/PageComposer.tsx`
- Create: `apps/web/src/page-composer/registry.ts`
- Create: `apps/web/src/page-composer/types.ts`
- Test: `apps/web/src/page-composer/PageComposer.test.tsx`

**Step 1: Introduce a closed registry**

Implement a typed registry mapping block `type` to React component.

Runtime rule:
- unknown block types are validation/runtime errors, not silent no-ops

**Step 2: Implement minimal composer behavior**

Support:
- ordered block rendering
- static props
- path-bound values from prepared page context
- consistent wrapper/layout behavior

**Step 3: Add targeted tests**

Cover:
- block dispatch by type
- missing block handling
- binding resolution for valid path references
- deterministic rendering order

### Task 6: Extract stable block components from the current App.tsx branches

**Files:**
- Create: `apps/web/src/page-blocks/`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Extract semantically meaningful blocks first**

Candidate first-class blocks:
- `ReviewHeroBlock`
- `StatCardsBlock`
- `AbilityBreakdownBlock`
- `CombatBreakdownBlock`
- `SkillsBreakdownBlock`
- `MetadataNameFieldBlock`
- `AbilityAllocatorBlock`
- `SkillsAllocatorBlock`

**Step 2: Preserve domain meaning**

Do not flatten everything into low-level primitives unless the block is genuinely reusable.

**Step 3: Keep behavior unchanged**

Extraction should not redesign the UI. Existing tests should remain the regression net.

### Task 7: Migrate simple pages before complex pages

**Files:**
- Modify: `packs/srd-35e-minimal/ui/pages/*.page.json`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Migrate the metadata page**

Move the current metadata page structure into a page schema and render it through `PageComposer`.

**Step 2: Migrate low-risk display-only review blocks**

Good initial candidates:
- review hero
- pack info
- provenance panel
- simple field-list sections

**Step 3: Verify no behavior drift**

Run focused tests after each migrated page/block.

### Task 8: Migrate complex interactive pages in controlled slices

**Files:**
- Modify: `packs/srd-35e-minimal/ui/pages/*.page.json`
- Modify: `apps/web/src/page-blocks/`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/App.test.tsx`
- Test: `tests/visual/*.spec.ts`

**Step 1: Migrate review breakdown sections**

Move review sections with tables/cards into schema-driven composition while keeping their existing block implementations.

**Step 2: Migrate abilities page**

Keep the existing interactive allocator component, but let the page schema compose it instead of `App.tsx`.

**Step 3: Migrate skills page**

Keep the existing interactive allocator component, but let the page schema compose it instead of `App.tsx`.

**Step 4: Keep v1 declarative**

If a page seems to require expression support, stop and open a follow-up issue instead of sneaking expressions into v1.

### Task 9: Remove remaining page-specific hardcoded branches

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Delete branch-specific rendering once migration is complete**

Remove the direct page-rendering branches for:
- `review`
- `metadata`
- `abilities`
- `skills`

Only after the schema-driven path is fully covering them.

**Step 2: Leave genuinely global concerns in App.tsx**

Examples:
- current step selection
- navigation buttons
- top-level state and context plumbing
- global export/provenance toggles if they remain global

### Task 10: Verify and stabilize

**Files:**
- Review only unless test fixes are required

**Step 1: Run verification**

Run:
- `npm --workspace @dcb/web run test`
- `npm --workspace @dcb/web run typecheck`
- `npm run test:visual -- tests/visual/wizard.visual.spec.ts`

**Step 2: Review final diff**

Confirm:
- `App.tsx` is thinner
- page composition moved into pack page schemas and page composer
- no expression system was introduced
- issue scope still matches `#181/#182`

**Step 3: Keep child issues small**

Do not execute this plan as one giant branch. Child issues should remain narrow and reviewable.
