# Engine Runtime Architecture

This document defines the stable contract boundary for the engine runtime architecture approved under issue `#233`.

## Four Representations

The engine redesign separates four representations:

1. Authored source
   - Human-maintained pack data that stays close to sourcebook structure.
   - Canonical home for text, tables, and pack-authored semantics.
2. Normalized pack IR
   - Compiler-owned intermediate representation.
   - Resolves links, IDs, and capability-owned fragments before final bundle emission.
3. Compiled runtime bundle
   - Static engine execution input.
   - Character-agnostic, cacheable, and reusable across requests.
4. RuntimeRequest
   - Per-character evaluation request.
   - Carries selections, raw inputs, and acquire intents.

The engine executes `CompiledRuntimeBundle + RuntimeRequest`. It does not execute raw authored entity fields, and it does not keep per-character copies of a rules bundle.

## Compiled Runtime Bundle

Bundle statements are intentionally small:

```ts
type BundleStatement =
  | {
      kind: "invoke";
      capability: string;
      op: string;
      args: Record<string, unknown>;
      when?: ConditionExpr;
    }
  | {
      kind: "grant";
      entity: string;
      when?: ConditionExpr;
    }
  | {
      kind: "constraint";
      capability: string;
      op: string;
      args: Record<string, unknown>;
      requiresFacts?: string[];
      requiresInputs?: string[];
      requiresResources?: string[];
      requiresEntities?: string[];
      when?: ConditionExpr;
    };
```

The bundle must not contain:

- request-side selections
- acquire intents
- direct user inputs
- character-private runtime state

## RuntimeRequest

`RuntimeRequest` is the dynamic evaluation envelope:

```ts
type RuntimeRequest = {
  selections: RuntimeSelection[];
  inputs?: RuntimeInput[];
  acquireIntents?: AcquireIntent[];
};
```

### Namespace rules

Request-side identifiers:

- `sel:*` for selection schema IDs
- `input:*` for request inputs
- acquire intent records in `acquireIntents`

Runtime-state and published-surface identifiers:

- `entity:*`
- `resource:*`
- `private:*`
- `constraint:*`
- `fact:*`

`RuntimeRequest` must not inject `fact:*` directly. Inputs are normalized before facts are published.

## Dependency Semantics

`dependsOn` remains reserved for static implementation dependencies, such as deferred mechanics waiting on missing capability support.

Runtime prerequisites use dedicated fields instead:

- `requiresFacts`
- `requiresInputs`
- `requiresResources`
- `requiresEntities`

This avoids overloading one field name with incompatible meanings.

## Typed Capability Registry

Runtime instructions are validated through a typed registry. The registry has two first-class instruction families:

```ts
type InvokeSpec = {
  kind: "invoke";
  capability: string;
  op: string;
  version: string;
  argsSchema: JsonSchema;
  phase: RuntimeInvokePhase;
  reads: StateKey[];
  writes: StateKey[];
  publishes?: FactId[];
  idempotent: boolean;
  mayActivateEntities?: boolean;
  mayMutateResources?: boolean;
};

type ConstraintSpec = {
  kind: "constraint";
  capability: string;
  op: string;
  version: string;
  argsSchema: JsonSchema;
  reads: StateKey[];
  requiresFacts?: FactId[];
  requiresInputs?: InputId[];
  requiresResources?: ResourceId[];
  requiresEntities?: EntityId[];
  evaluationPhase: "constraints";
  deferredWhenMissing: boolean;
};
```

`ConstraintSpec` is first-class, but it is not a generic state-mutating invoke entry.

## Shared Condition DSL

`when` uses a shared condition DSL with typed operands. The engine does not provide a bare `level` primitive.

Approved operand families:

- constants
- selection-derived metrics
- published facts
- resource amounts
- boolean composition
- numeric comparison

If a ruleset needs a concept such as "paladin level", it must expose it as a typed metric or a published fact.

## Runtime State Layers

Runtime state is split into:

- raw request inputs
- owned entities
- resources
- capability-owned private state
- published facts
- constraint results

Published facts are a narrow public interface for cross-capability reads. Internal caches, temporary calculations, and UI-only fields are not published facts.

## Execution Model

Execution is a deterministic global fixed-point:

1. Activation
2. Invoke execution
3. Acquire resolution

These three phases repeat as a super-cycle until there are no new observable writes across owned entities, published facts, resources, and unresolved acquire outcomes.

Only after convergence does the engine run:

4. Constraint evaluation
5. Projection

Execution order must be stable by:

1. phase
2. capability
3. source entity order
4. local statement order

The runtime must also define:

- idempotence requirements
- maximum iteration count
- cycle detection
- non-convergence failure behavior

## Imported State Rule

Imported state is treated as raw input that still needs interpretation.

It may enter only through `RuntimeRequest` and must pass through:

- engine entry normalization
- or a capability-owned adapter

Imported data must not directly hydrate runtime internals unless a capability explicitly exposes a registry-validated import operation.

## Issue Map

This contract sits in the approved issue chain:

- `#232`: `RuntimeRequest` adapter boundary
- `#233`: architecture approval
- `#235`: compiler scaffold
- `#236`: selection-schema compilation
- `#122`: first native capability slice
