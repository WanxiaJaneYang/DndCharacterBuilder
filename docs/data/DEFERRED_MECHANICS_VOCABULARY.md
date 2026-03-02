# Deferred Mechanics Vocabulary

This document defines the stable metadata contract for `deferredMechanics`.

Use it when a rule is intentionally preserved in source-aligned data but cannot yet be enforced by the current engine.

## Goals

- keep deferred backlog metadata stable across engine refactors
- separate rules meaning from implementation wiring
- make future schema validation stricter and more predictable

## Core Terms

### Rule concept ID

A stable identifier for the rules concept affected by a deferred mechanic.

Format:
- lower-case, kebab-case segments
- segment characters: `a`-`z`, `0`-`9`, and internal hyphens only
- no leading, trailing, or repeated hyphens within a segment
- colon-separated
- no empty segments
- domain-oriented, not engine-oriented

Examples:
- `skill:jump`
- `skill:tumble`
- `combat:ranged`
- `action:standard`
- `attack:multi-projectile`
- `proficiency:armor:light`
- `modifier:armor-check-penalty`

Granularity rule:
- use the most specific stable concept available without encoding engine state
- prefer `proficiency:armor:light` over `proficiency:armor` when the rule is truly light-armor-specific
- use broader concepts only when the rule meaning is intentionally broad

### Capability ID

A stable identifier for an implementation capability that must exist before a deferred mechanic can be implemented.

Format:
- starts with `cap:`
- lower-case kebab-case segments

Examples:
- `cap:skills-core`
- `cap:proficiency-armor`
- `cap:armor-check-penalty`
- `cap:combat-attack-sequence`
- `cap:ammo-consumption`
- `cap:metamagic`

## Field Contract

### `dependsOn`

`dependsOn` should contain capability IDs only.

Use it to answer:
- what engine or rules capability is missing

Do not use it for:
- temporary notes
- implementation guesses
- free-form backlog labels

### `impacts`

`impacts` should contain rule concept IDs only.

Use it to answer:
- which stable rules concepts this deferred mechanic affects

Do not use it for:
- engine object paths
- current sheet model fields
- speculative storage destinations
- effect-target namespaces such as `bonuses.*`

### `impactPaths`

`impactPaths` is legacy terminology. Existing datasets may still use it until the implementation phase lands, but new conventions should be written against `impacts` and rule concept IDs.

New data MUST NOT introduce `impactPaths`.

## Writing Rules

Prefer deferred-mechanic metadata that reads like rules-domain indexing, not implementation notes.

Good:

```json
{
  "id": "rapid-shot-full-attack",
  "category": "feat-benefit",
  "description": "Additional ranged attack during a full attack is preserved but not yet enforced.",
  "dependsOn": ["cap:combat-attack-sequence", "cap:ammo-consumption"],
  "impacts": ["combat:ranged", "action:full-round", "attack:multi-projectile"]
}
```

Bad:

```json
{
  "dependsOn": ["iterative-ranged-attack-engine"],
  "impactPaths": ["stats.attackBonus", "combat.ranged.fullAttack"]
}
```

The second example leaks current implementation structure instead of describing the rule.

## Numeric Modifier Guidance

If a rule is already representable in the effect system as a numeric modifier, prefer a stable concept-keyed target.

Examples:
- `bonuses.skill:jump`
- `bonuses.skill:tumble`

Separation rule:
- `impacts` always names rule concepts such as `skill:jump`
- effect targets always use modifier or engine channels such as `bonuses.skill:jump`
- do not use `bonuses.*` values inside `impacts`
- do not replace effect targets with raw rule concepts where the effect system needs a target channel

Use concept-keyed bonus targets only when:
- the rule is numeric
- the target concept is stable
- the current effect system can already apply it without new control-flow semantics

Keep the rule deferred when it still depends on:
- per-turn declarations
- opponent selection
- timing windows
- attack sequencing
- other not-yet-modeled conditions

## Initial Capability Examples

This list is illustrative for planning and naming consistency. The implementation phase should convert it into a validated registry.

- `cap:skills-core`
- `cap:alignment-selection`
- `cap:alignment-validation`
- `cap:proficiency-armor`
- `cap:proficiency-weapon`
- `cap:armor-check-penalty`
- `cap:combat-attack-sequence`
- `cap:ammo-consumption`
- `cap:metamagic`

Planning requirements for the registry:
- choose and document the registry location
- define the validation strategy for `dependsOn`
- define how new capability IDs are added and reviewed

## Example Translations

| Legacy metadata pattern | Preferred concept-oriented form |
|-------------------------|---------------------------------|
| `impactPaths: [skills.jump, skills.tumble]` | `impacts: [skill:jump, skill:tumble]` |
| `impactPaths: [validation.class.alignment]` | `impacts: [alignment:restriction]` |
| `impactPaths: [selections.equipment, validation.race.proficiency]` | `impacts: [proficiency:armor:light, proficiency:weapon:martial]` |
| `impactPaths: [combat.ranged.fullAttack]` | `impacts: [combat:ranged, attack:multi-projectile]` |

## Phase Boundary

This document defines the target contract only.

The planning and implementation phases are responsible for:
- final schema shape
- capability-registry location
- validation rules
- migration of existing race/class/feat data
- test updates
