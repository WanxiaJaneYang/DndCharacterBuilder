# Schema-Driven Page Composition Design

**Date:** 2026-03-10  
**Issue:** #181  
**Related:** #182, #88, #151, #162

## Goal

Define the UI architecture that turns wizard pages into config-defined compositions of stable React components, so `App.tsx` stops hardcoding page-specific JSX for `review`, `metadata`, `abilities`, `skills`, and future pages.

## Problem

The repository is only partially flow-driven today.

- `packs/*/flows/*.flow.json` controls step order and some step-level behavior.
- `apps/web/src/App.tsx` still hardcodes page rendering with `currentStep.kind` branches.
- Some step-local configuration already lives in flow JSON, such as `abilitiesConfig` and `abilityPresentation`.
- Adding or reshaping a page still requires touching `App.tsx`, even when the page is fundamentally configuration-owned.

That creates two kinds of drift:

1. Flow/config says what pages exist, but React code still decides what those pages look like.
2. UI architecture work risks collapsing into either:
   - another monolithic renderer hidden behind a registry, or
   - endless `App.tsx` modularization that does not actually make pages config-defined.

## Design principles

1. Keep `flow` focused on wizard sequencing, not page layout details.
2. Give every page its own schema file.
3. Represent each page as a recursive component tree rather than a flat block list.
4. Compose pages from typed, registered UI components rather than arbitrary renderer ids.
4. Keep v1 declarative only:
   - fixed data-path bindings
   - static props
   - recursive `children`
   - explicit `slot` placement
   - no expressions
   - no embedded filtering / sorting language
   - no custom renderer escape hatch
5. Keep domain-heavy presentation blocks at a meaningful abstraction level.

The goal is not to configuration-drive every `<td>` in the UI. The goal is to configuration-drive page structure by composing stable, semantic components.

## Proposed architecture

### Layer 1: Flow

Flow remains the source of truth for:

- step order
- navigation/gating
- step id / label / kind
- `pageSchemaId`
- step-local behavior config that truly belongs to the flow runner

Flow should no longer own page-internal section layout. In particular, step-local page composition should stop expanding inside the step object.

Example direction:

```json
{
  "steps": [
    {
      "id": "metadata",
      "kind": "page",
      "label": "Identity",
      "pageSchemaId": "character.metadata"
    },
    {
      "id": "review",
      "kind": "page",
      "label": "Review",
      "pageSchemaId": "character.review"
    }
  ]
}
```

### Layer 2: Page Schemas

Each page gets a standalone JSON schema file.

Recommended location:

- `packs/<pack-id>/ui/pages/<page-id>.page.json`

This keeps page schemas:

- pack-owned
- ruleset-specific
- versionable alongside flow and entities
- clearly UI-facing instead of engine-facing

Each page schema declares:

- page identity
- a recursive root node
- static node props
- declarative data bindings by path
- optional `children`
- optional `slot` routing into a parent component

Example direction:

```json
{
  "id": "character.review",
  "root": {
    "id": "review-root",
    "componentId": "layout.twoColumnReview",
    "children": [
      {
        "id": "hero",
        "componentId": "reviewHero",
        "slot": "header",
        "dataSource": "page.review.hero"
      },
      {
        "id": "summary",
        "componentId": "statCards",
        "slot": "main",
        "dataSource": "page.review.summaryCards"
      },
      {
        "id": "skills",
        "componentId": "skillsBreakdown",
        "slot": "main",
        "dataSource": "page.review.skills"
      }
    ]
  }
}
```

### Layer 3: Page Composer + Component Registry

The web app owns a typed registry of allowed components.

Layouts are not a separate schema layer. A layout is just another registered component that accepts children in named slots.

Representative component ids:

- `textField`
- `choiceGroup`
- `fieldList`
- `summaryList`
- `dataTable`
- `statCards`
- `reviewHero`
- `abilityBreakdown`
- `combatBreakdown`
- `skillsBreakdown`
- `provenancePanel`
- `layout.singleColumn`
- `layout.twoColumnReview`

The registry is explicit and closed. Unknown component ids fail validation rather than silently rendering nothing.

`PageComposer` becomes the only runtime that turns:

`pageSchemaId -> page schema root node -> registered component tree -> rendered page`

## Binding model (v1)

Bindings are declarative path references only.

Allowed examples:

- `spec.meta.name`
- `page.review.skills`
- `ui.currentStep.label`
- `page.metadata.fields.name`

Disallowed in v1:

- expression strings
- filter/sort/map pipelines
- computed conditionals inside schema
- arbitrary JS callbacks

This keeps the page schemas stable and reviewable. Any nontrivial transformation belongs in a typed selector/adapter layer inside the web app.

## Tree model and slot routing

Each page schema is a recursive node tree.

Each node may contain:

- `id`
- `componentId`
- `props`
- `dataSource`
- `children`
- `slot`

Rules:

- `componentId` must exist in the registry
- `dataSource` is optional and path-only
- `children` is optional and static in v1
- `slot` is optional and only meaningful when the parent component exposes named insertion regions

This gives us one uniform composition model:

- layout components are just nodes
- domain blocks are just nodes
- leaf display components are just nodes

We do not need separate schema systems for layout, sections, and leaves.

## Data shaping rule

JSON does not shape raw engine output directly.

Instead, each page is rendered against a prepared page context assembled by the UI runtime. The composer consumes already-shaped values such as:

- `page.review`
- `page.metadata`
- `page.abilities`
- `page.skills`

That gives us a clean split:

- selectors/adapters perform typed shaping in code
- page schemas declare layout and block composition

This avoids turning page JSON into a query language.

## Component abstraction rule

We should not over-normalize components into layout primitives only.

Keep semantically meaningful domain blocks when they are stable, for example:

- `reviewHero`
- `abilityBreakdown`
- `combatBreakdown`
- `skillsBreakdown`
- `layout.twoColumnReview`

Those components are better than forcing every page author to reconstruct them from low-level primitives. Primitive components still exist, but they do not replace every domain block.

## Current hardcoded surfaces to migrate

The main hardcoded branches still live in `apps/web/src/App.tsx`:

- `currentStep.kind === "review"`
- `currentStep.kind === "metadata"`
- `currentStep.kind === "abilities"`
- `currentStep.kind === "skills"`

Within those branches, page composition is embedded directly in JSX. That is the immediate migration target for this architecture.

## Relationship to existing issues

### #88

Not a duplicate.

`#88` is about a flow-driven wizard runner. This design assumes that direction and adds the missing page-composition layer underneath it.

### #151

Not a duplicate.

`#151` is codebase modularization (`App.tsx` splitting). This design defines the architectural target so that future modularization does not merely move hardcoded JSX into more files.

### #162

Not a duplicate.

`#162` is about decoupling wizard/flow from engine. This design remains UI-layer only and is compatible with that boundary.

## Migration boundary

This design intentionally does **not** require a one-shot rewrite.

Expected migration sequence:

1. define page schema contract and loader
2. add page composer and registry runtime
3. extract reusable blocks from existing `App.tsx` JSX
4. migrate simple pages first
5. migrate complex review/abilities/skills pages
6. remove the remaining page-specific `currentStep.kind` rendering branches

## Risks

1. Recreating a second monolith:
   a giant generic renderer would be little better than `App.tsx`.

2. Overly powerful schema language:
   expression support too early would move logic into config and make testing harder.

3. Wrong component granularity:
   if components are too low-level, schemas become noisy and fragile.
   if components are too high-level, the schema adds little value.

4. Flow/page ownership drift:
   if page layout fields continue to accumulate inside flow step objects, the separation collapses again.

5. Slot misuse:
   if slot naming is inconsistent or under-specified, layouts become hard to reason about and schemas become trial-and-error.

## Guardrails

- Keep flow and page schema responsibilities separate.
- Validate page schemas in a typed schema package before runtime.
- Keep bindings path-only in v1.
- Keep children static and recursive in v1.
- Keep slot names component-defined and validated.
- Use typed selectors/adapters for shaping.
- Fail closed on unknown component ids and invalid bindings.
- Migrate page-by-page rather than doing a big-bang rewrite.

## Duplicate issue audit

Existing issue audit on 2026-03-10 found no exact duplicate for this architecture slice.

Closest related issues:

- `#88` `[P1] UI: Flow runner for ruleset-specific creation steps`
- `#151` `[P2] Split monolithic App.tsx into feature modules`
- `#162` `[P0] Decouple wizard/flow from engine`
- closed historical precursor: `#75` refactor wizard into step components aligned to `flow.json`

Conclusion:

- architecture issue `#181` is warranted
- planning issue `#182` is warranted
- follow-up implementation should be decomposed into child issues rather than broadening `#88` or `#151`
