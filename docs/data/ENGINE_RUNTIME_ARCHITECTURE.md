# Engine Runtime Architecture

This document defines the current `#240` runtime-contract direction on the `engine-refactor` integration branch.

The core reset is sheet-centric: after the user selects a `RulesContext`, the system compiles a static rules world, exposes the target character sheet that should be built under that world, and uses flow only as navigation around that sheet. Runtime evaluation then projects the user's current selections and inputs onto that target sheet.

## Purpose

The engine refactor is moving toward a backend-style domain service with a contract-first boundary:

- rules data stays authoritative
- the engine owns compilation and evaluation
- the frontend owns rendering and temporary interaction state
- API transport and deployment can be introduced later without changing the core contract

## MVP Scope

For `#240`, keep the rule-universe boundary intentionally small:

- no bans or overrides yet
- additive packs only
- no mid-build migration or preservation when the rule universe changes
- no selection cleanup/orphan lifecycle design in this issue

The MVP policy is simple: if the `RulesContext` changes, the current build resets and the rules world is rebuilt from scratch.

## Object Model

### `RulesContext`

`RulesContext` defines the selected rule universe and nothing else.

```ts
export interface RulesContext {
  rulesetId: string;
  enabledPackIds: string[];
  flowId?: string;
}
```

MVP notes:

- `enabledPackIds` are additive pack references only
- pack order is not semantic; normalization should sort and dedupe them
- `flowId` stays optional and only exists if a rules context supports multiple flow presets

### `NormalizedRulesContext`

`NormalizedRulesContext` is the stable compiled-input form.

```ts
export interface NormalizedRulesContext {
  rulesetId: string;
  enabledPackIds: string[];
  flowId?: string;
  contextKey: string;
}
```

`contextKey` is the stable cache key for this rule universe.

### `CompiledBundle`

`CompiledBundle` represents the static compiled result of a normalized rules context.

```ts
export interface CompiledBundle {
  context: NormalizedRulesContext;
  bundleId: string;

  statements: BundleStatement[];

  registries: {
    entities: EntityRegistry;
    selections: SelectionRegistry;
  };

  targetSheetSchema: TargetCharacterSheetSchema;
  flow: FlowDescriptor;

  diagnostics: CompileDiagnostic[];
}
```

This object has three caller-facing concerns:

- rule execution assets: `statements`
- static rules-world definitions: `registries.entities`, `registries.selections`
- product-facing build target: `targetSheetSchema`, `flow`

The bundle is:

- compiled from `RulesContext`
- cacheable by `contextKey`
- independent from character selections and inputs

For this issue, `resources` and generic `projection` registries are intentionally not part of the compiled public contract.

### `TargetCharacterSheetSchema`

This is not a final character sheet result. It is the target character representation that the current rules world expects the user to build.

```ts
export interface TargetCharacterSheetSchema {
  schemaId: string;
  contextKey: string;
  sections: SheetSectionSchema[];
}

export interface SheetSectionSchema {
  id: string;
  title: string;
  required: boolean;
  order: number;
  fields: SheetFieldSchema[];
}

export interface SheetFieldSchema {
  id: string;
  kind: "input" | "selection" | "derived" | "collection";
  required: boolean;
  source?: {
    selectionId?: string;
    inputKey?: string;
    projectionKey?: string;
  };
}
```

Field kinds mean:

- `input`: user enters a literal value
- `selection`: user chooses from engine-provided options
- `derived`: engine computes the value
- `collection`: the field is a repeated list, such as feats, skills, or attacks

### `FlowDescriptor`

`FlowDescriptor` is not the primary build truth. It is the navigation structure used to progressively complete the target sheet.

```ts
export interface FlowDescriptor {
  flowId: string;
  steps: FlowStep[];
}

export interface FlowStep {
  id: string;
  title: string;
  order: number;
  coversSectionIds: string[];
  requiredSelectionIds: string[];
  requiredInputKeys: string[];
}
```

This lets packs extend the build flow by extending the target sheet and then adding steps that cover the new sections.

### `RuntimeRequest`

`RuntimeRequest` carries the user's committed build input under one compiled bundle.

```ts
export interface RuntimeRequest {
  contextKey: string;
  selections: SelectionBinding[];
  inputs: RuntimeInput[];
}

export interface SelectionBinding {
  selectionId: string;
  selectedIds: string[];
}

export interface RuntimeInput {
  key: string;
  value: string | number | boolean | null;
}
```

`RuntimeRequest` must not contain:

- static rule-universe data such as ruleset or pack IDs
- derived sheet values
- transient UI state such as step index, hover state, or button clicks

### `EvaluationResult`

Each evaluation returns the current build status projected onto the target sheet.

```ts
export interface EvaluationResult {
  contextKey: string;
  bundleId: string;

  status: "ok" | "invalid";

  currentSheet: CurrentCharacterSheet;
  completion: CompletionState;

  facts: RuntimeFact[];
  resources: RuntimeResourceState[];
  constraints: ConstraintResult[];
  diagnostics: RuntimeDiagnostic[];
}
```

### `CurrentCharacterSheet`

`CurrentCharacterSheet` is the current projected sheet instance for the submitted request.

```ts
export interface CurrentCharacterSheet {
  schemaId: string;
  sections: CurrentSheetSection[];
}

export interface CurrentSheetSection {
  id: string;
  title: string;
  visible: boolean;
  complete: boolean;
  fields: CurrentSheetField[];
}

export interface CurrentSheetField {
  id: string;
  value: unknown;
  status: "empty" | "filled" | "derived" | "invalid";
}
```

### `CompletionState`

`CompletionState` captures how far the current build has progressed toward the target sheet.

```ts
export interface CompletionState {
  complete: boolean;
  completedSectionIds: string[];
  incompleteSectionIds: string[];
  unresolvedSelections: UnresolvedSelection[];
  missingInputs: MissingInput[];
}

export interface UnresolvedSelection {
  selectionId: string;
  reason: string;
}

export interface MissingInput {
  key: string;
  reason: string;
}
```

## Lifecycle

### Step 1: Choose `RulesContext`

The build begins by selecting a rule universe.

```ts
const context: RulesContext = {
  rulesetId: "dnd35-srd",
  enabledPackIds: [],
};
```

### Step 2: Compile The Rules World

```ts
const normalized = normalizeRulesContext(context);
const bundle = compileRulesContext(normalized);
```

Compilation directly produces:

- `bundle.targetSheetSchema`
- `bundle.flow`

In other words:

- what kind of character sheet should be built under this rules world
- how the frontend should guide the user through filling it in

### Step 3: Start Building

```ts
const request: RuntimeRequest = {
  contextKey: bundle.context.contextKey,
  selections: [],
  inputs: [],
};
```

The user progressively submits committed selections and inputs.

### Step 4: Evaluate

```ts
const result = evaluate(bundle, request);
```

Each evaluation returns:

- the current projected character sheet
- which sections are complete
- which selections are still unresolved
- which inputs are still missing
- which constraints are currently invalid

## Design Principles

### Sheet Is Primary Truth, Flow Is Navigation

The build should not revolve around page state. It should revolve around progressive completion of the target character sheet.

Flow is still important, but only as a navigation structure around the target sheet.

### Runtime Requests Operate On Source Input, Not Projection

The caller submits:

- `selections`
- `inputs`

The caller does not directly mutate:

- `hp.total`
- `ac.total`
- attack bonuses
- other derived sheet fields

Those values are always projected by the engine.

### RulesContext Changes Reset The Build In MVP

For MVP, this policy is explicit:

```ts
if (oldBundle.context.contextKey !== newBundle.context.contextKey) {
  resetBuild();
}
```

No migration, orphan preservation, or partial carry-over is designed in this issue.

### Packs Are Additive In MVP

For MVP, packs may:

- add entities
- add selectable content
- add rule statements
- add target sheet sections
- add flow steps

Pack overrides and patch/ban semantics are deferred.

## Public Contract Surfaces

The public runtime story for this issue is:

- normalize `RulesContext`
- compile it into a `CompiledBundle`
- evaluate `RuntimeRequest` against that bundle

This is enough to define the boundary without prematurely freezing a broader executor or registry story.

## Follow-Up Work

The following remain explicit follow-up topics:

- deeper `RulesContext` edit semantics beyond MVP reset
- selection lifecycle, cleanup, blocked/orphaned states, and refunds
- stable output mapping to other public contracts such as `ComputeResult`
- cross-capability ownership and merge rules for runtime facts/resources/entities
- the final executor model and whether any legacy `changes[]` request shape survives internally
