# Issue 233 Engine Capability Architecture Design

**Date:** 2026-03-17
**Issue:** #233
**Parent:** #199
**Blocked by:** #232
**Follow-ons:** #234, #235, #236, #122

## Goal
Approve the engine-only architecture boundaries for the capability-registry redesign so later compiler and runtime work can proceed against explicit contracts instead of inferred assumptions from legacy `CharacterState` behavior.

## Recommended approach
Keep the runtime architecture centered on four distinct layers:
- authored source data
- normalized pack IR
- compiled runtime bundle
- per-character `RuntimeRequest`

The engine executes a compiled bundle plus a request. It does not execute raw authored pack fields, and it does not store a character-specific copy of the rules bundle. Runtime instructions are validated through a typed registry, constraints are first-class registry entries, and execution is a deterministic fixed-point over activation, invoke, and acquire phases before constraints are evaluated.

## Alternatives considered
1. Put selections and acquire operations directly into the compiled bundle.
Rejected because it collapses static rules content with per-character intent, prevents cacheable bundle reuse, and conflicts with the approved `RuntimeRequest` boundary from issue #232.

2. Reuse `dependsOn` for runtime fact or input prerequisites.
Rejected because the repo already uses `dependsOn` as a stable capability-implementation dependency field in deferred mechanics metadata.

3. Allow bare `level` conditions such as `{ op: "min-level", value: 4 }`.
Rejected because it promotes a d20-flavored progression concept into an engine primitive. Conditions must reference explicit typed operands instead.

4. Treat constraints as a special case of invoke execution.
Rejected because constraints have distinct semantics: they evaluate against stable state and emit `pass` / `fail` / `deferred` rather than mutating runtime state.

5. Allow imported state to hydrate runtime internals directly.
Rejected because it creates a back door for legacy `CharacterState` shapes and bypasses capability-owned normalization.

## Approved decisions

### 1. Execution target and request boundary
The engine consumes:
- one compiled runtime bundle
- one `RuntimeRequest`

The bundle is static and character-agnostic. It may contain compiled entities, selection schemas, grants, invoke statements, constraints, capability-owned runtime fragments, and migration diagnostics. It must not contain:
- current character selections
- acquire intents
- character-private state
- intermediate runtime caches

`RuntimeRequest` is dynamic and character-specific. It is the only place that may carry:
- selections
- user-provided inputs
- acquire intents
- imported raw input fragments that still require interpretation

### 2. Bundle statement contract
The compiled bundle statement surface is intentionally small:

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

Notably absent from bundle statements:
- `selection`
- `acquire`
- direct user input payloads

### 3. RuntimeRequest contract
`RuntimeRequest` is the per-evaluation envelope:

```ts
type RuntimeRequest = {
  selections: RuntimeSelection[];
  inputs?: RuntimeInput[];
  acquireIntents?: AcquireIntent[];
};
```

Namespace boundaries are strict:
- `selection:*` belongs to request selections
- `input:*` belongs to request inputs
- `acquire:*` or acquire intent records belong to request-side transactions
- `fact:*`, `resource:*`, and `entity:*` belong to runtime state and published output surfaces

`RuntimeRequest` must not inject `fact:*` records directly.

### 4. Dependency semantics
`dependsOn` remains reserved for static implementation dependencies such as missing capability support in deferred mechanics metadata.

Runtime prerequisites use explicit `requires*` fields:
- `requiresFacts`
- `requiresInputs`
- `requiresResources`
- `requiresEntities`

This keeps authored pack metadata and runtime execution dependencies from overloading the same field name with incompatible meanings.

### 5. Typed capability registry
`capability + op + args` is not a free-form protocol. Every runtime instruction must be validated against a registry entry with explicit schema and execution metadata.

The registry has at least two first-class spec families:

```ts
type InvokeSpec = {
  kind: "invoke";
  capability: string;
  op: string;
  version: string;
  argsSchema: JsonSchema;
  phase: PhaseId;
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

`ConstraintSpec` is first-class and registry-owned, but it is not modeled as a generic state-mutating invoke entry.

### 6. Shared condition DSL
`when` uses a shared condition DSL with typed operands rather than engine-special-case concepts such as bare level checks.

Approved operand families:
- boolean composition
- comparison
- selection-derived metrics
- published facts
- resource amounts
- constants

Example:

```json
{
  "op": "numeric-gte",
  "left": {
    "kind": "selection-metric",
    "schemaId": "sel:progression-track",
    "refId": "class:paladin",
    "field": "amount"
  },
  "right": { "kind": "const", "value": 4 }
}
```

If a ruleset wants to expose a concept such as "paladin level", it must appear as a metric or published fact, not as an engine-reserved keyword.

### 7. Runtime state layers
Runtime state is split into the following layers:
- raw request inputs
- owned entities
- resources
- capability-owned private state
- published facts
- constraint results

Published facts are deliberately narrower than capability-private state. A value should only be published when:
- another capability needs to read it
- its meaning is stable
- it has a documented identifier and contract

Internal caches, partial calculations, and UI-only projection fields are not published facts.

### 8. Deterministic execution model
Execution is a global super-cycle fixed-point, not a one-pass pipeline.

The engine repeatedly runs:
1. Activation
2. Invoke execution
3. Acquire resolution

until no new observable writes are produced across:
- owned entities
- published facts
- resources
- capability outputs that affect later observable behavior
- unresolved acquire outcomes

Only after convergence does the engine run:
4. Constraint evaluation
5. Projection

Ordering must be stable and derived from:
1. phase
2. capability
3. source entity order
4. local statement order

The registry must declare idempotence, and the runtime must define:
- maximum iteration count
- cycle detection policy
- failure behavior for non-convergence

### 9. Imported state invariant
Imported state is treated as input that still needs interpretation. It may enter only through `RuntimeRequest` and must pass through an engine entry normalizer or a capability-owned adapter.

Imported data must not directly write:
- owned entities
- published facts
- resources
- capability-private state

unless a capability explicitly exposes a registry-validated import operation for that purpose.

### 10. Scope of issue #233
Issue #233 approves architecture boundaries only. It does not itself approve:
- the full compiler implementation
- the first native capability slice
- ruleset-specific mechanics beyond illustrative examples

The expected sequence remains:
1. finish the generic `RuntimeRequest` boundary under #232
2. approve these architecture rules under #233
3. land compiler scaffold and selection-schema compilation under #235 and #236
4. implement `cap:skills-core` under #122 as the first native vertical slice

## Examples are illustrative, not normative
Paladin and D&D 3.5 examples in this design exist to test whether the contracts are expressive enough. They do not promote paladin-specific or d20-specific concepts into engine primitives.

## Testing and validation expectations
Follow-on implementation must lock these decisions with schema validation and deterministic tests. At minimum:
- bundle schema tests must reject request-side instructions such as `acquire`
- request schema tests must reject direct `fact:*` injection
- registry schema tests must distinguish invoke specs from constraint specs
- execution tests must prove deterministic convergence behavior for the first native capability slice

## Documentation follow-on
After this design is approved, the repo should add:
- a schema-level runtime contract in `@dcb/schema`
- a contributor-facing data contract doc under `docs/data/ENGINE_RUNTIME_ARCHITECTURE.md`
- implementation plans for the compiler scaffold and first native capability slice
