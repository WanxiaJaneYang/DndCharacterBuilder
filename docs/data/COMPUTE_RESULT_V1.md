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

- `schemaVersion` is always present on the top-level result.
- `sheetViewModel` is always present and always includes its own `schemaVersion`.
- `validationIssues`, `unresolved`, and `assumptions` are always arrays, even when empty.
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

This is covered by engine tests under `compute() contract`, including a deterministic snapshot for a canonical fixture.

## Validation and assumptions

- Invalid or missing CharacterSpec data surfaces through `validationIssues`.
- Legacy engine validation also flows into `validationIssues`.
- Normalization-driven defaults that change meaning, such as class levels clamped up to `1`, surface through `assumptions`.
- Incomplete or deferred mechanics continue to surface through `unresolved`.

## Migration note

`compute()` currently bridges into legacy engine internals through `characterSpecToState(spec)`, `validateState()`, and `finalizeCharacter()`.

This preserves current behavior while decoupling the public contract from wizard flow state. A later internal refactor can replace the bridge without changing the `ComputeResult` public shape.
