# ComputeResult v1

Parent issue: #159  
Child issue: #166

## API

```ts
compute(spec, rulepack) => ComputeResult
```

## Exported shape

```ts
type ComputeResult = {
  schemaVersion: "0.1";
  sheetViewModel: {
    schemaVersion: "0.1";
    data: SheetViewModel;
  };
  validationIssues: Array<{
    code: string;
    severity: "error" | "warning";
    message: string;
    path?: string;
    relatedIds?: string[];
  }>;
  unresolved: Array<{
    code: string;
    message: string;
    path?: string;
    relatedIds?: string[];
    suggestedNext?: string;
  }>;
  assumptions: Array<{
    code: string;
    message: string;
    path?: string;
    defaultUsed: unknown;
  }>;
  provenance?: ProvenanceRecord[];
};
```

## Field guarantees

- `schemaVersion` is always present on the top-level result and is always `"0.1"`.
- `sheetViewModel` is always present and always includes its own `schemaVersion`, also `"0.1"`.
- `validationIssues`, `unresolved`, and `assumptions` are always arrays, even when empty.
- `validationIssues.path`, when present, points to the corresponding `CharacterSpec` field instead of wizard-state internals.
- `provenance` is optional and must not be required for UI correctness.

## Ordering guarantees

The public contract guarantees deterministic array ordering for identical `CharacterSpec + RulepackInput`.

- `validationIssues`
  - CharacterSpec validation issues come first in `validateCharacterSpec()` order.
  - Engine validation issues come next in `validateState()` order.
- `unresolved`
  - Entries preserve the order emitted by `finalizeCharacter().unresolvedRules`.
- `sheetViewModel.data.combat.attacks`
  - Entries preserve the order emitted by `buildSheetViewModel()`.
- `sheetViewModel.data.skills`
  - Entries preserve the order emitted by `buildSheetViewModel()`.

Consumers may rely on array ordering and field presence. Consumers must not rely on object key enumeration order.

## Determinism

For identical `CharacterSpec + RulepackInput`, `compute()` must return deeply equal output.

This is covered by engine tests under `compute() contract`, including a deterministic golden fixture for a canonical equipped fighter path that locks AC totals and the first attack line.

## Validation and assumptions

- Invalid or missing CharacterSpec data surfaces through `validationIssues`.
- Legacy engine validation also flows into `validationIssues`.
- `compute()` still returns a `sheetViewModel` after normalization and the current engine pipeline, even when `validationIssues` are present.
- Normalization-driven defaults that change meaning, such as class levels adjusted during normalization, surface through `assumptions`.
- Incomplete or deferred mechanics continue to surface through `unresolved`.

## Migration note

`compute()` currently bridges into legacy engine internals through `characterSpecToState(spec)`, `validateState()`, and `finalizeCharacter()`.

This preserves current behavior while decoupling the public contract from wizard flow state. The top-level `@dcb/engine` package surface is now reserved for the flow-independent contract; temporary wizard/state APIs live under the explicit `@dcb/engine/legacy` entrypoint.

A later internal refactor can replace the bridge without changing the `ComputeResult` public shape.
