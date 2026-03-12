# CharacterSpec v1

Parent issue: #159  
Child issue: #165

## Purpose

`CharacterSpec` v1 defines a flow-independent engine input contract. It must not include wizard step ids, screen state, or flow runner metadata.

## Type summary

```ts
type CharacterSpec = {
  meta: {
    name?: string;
    rulesetId: string;
    sourceIds: string[];
  };
  raceId?: string;
  class?: {
    classId: string;
    level: number;
  };
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skillRanks?: Record<string, number>;
  featIds?: string[];
  equipmentIds?: string[];
  overrides?: Record<string, unknown>;
};
```

Canonical example: `docs/data/examples/character_spec_v1_example.json`.

## Normalization rules

The engine now exports `normalizeCharacterSpec(spec)`.

- ID-like fields are trimmed and lowercased.
- `meta.sourceIds`, `featIds`, and `equipmentIds` are deduplicated and sorted.
- `skillRanks` keys are normalized, invalid keys are dropped, and non-finite or negative values are dropped.
- `class.level` is clamped to an integer >= 1.

## Migration notes

### `CharacterState` -> `CharacterSpec`

Use this mapping to migrate wizard-shaped state into flow-independent engine input:

- `metadata.name` -> `meta.name`
- ruleset/source selection from caller context -> `meta.rulesetId` + `meta.sourceIds`
- `abilities` -> `abilities`
- `selections.race` -> `raceId`
- `selections.class` -> `class`
- `selections.skills` -> `skillRanks`
- `selections.feats` -> `featIds`
- `selections.equipment` -> `equipmentIds`

Class migration rule:

- `selections.class = "fighter"` -> `{ classId: "fighter", level: 1 }`
- `selections.class = "fighter-3"` -> `{ classId: "fighter", level: 3 }`

Unknown wizard-only step state should not be copied into `CharacterSpec`.

### `CharacterSpec` -> `CharacterState` (temporary bridge)

The temporary `characterSpecToState(spec)` bridge remains available from the internal `packages/engine/src/characterSpec.ts` module for engine migration work, but it is not part of the public package surface.

The package surface is now split deliberately:

- `@dcb/engine` exposes the flow-independent contract (`compute(spec, rulepack)`, CharacterSpec validation, and ComputeResult-facing types/constants).
- `@dcb/engine/legacy` exposes the temporary wizard/state APIs (`initialState`, `applyChoice`, `listChoices`, `validateState`, `finalizeCharacter`, and related state types) for migration work.

- `meta.name` -> `metadata.name`
- `abilities` -> `abilities`
- `raceId` -> `selections.race`
- `class.classId + class.level` -> `selections.class` (`fighter` for level 1, `fighter-3` for level 3)
- `skillRanks` -> `selections.skills`
- `featIds` -> `selections.feats`
- `equipmentIds` -> `selections.equipment`

## Non-goals in v1

- multiclass arrays and leveling history
- equipped slot modeling
- random generation or flow step orchestration
