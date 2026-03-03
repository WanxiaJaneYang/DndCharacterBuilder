# Deferred Mechanics Domain Vocabulary Design

Date: 2026-03-02
Owner: Data + Schema
Status: Approved
Scope: Documentation-only phase for issue #59 and subissue #61

## 1. Objective

Define a stable, engine-agnostic contract for `deferredMechanics` so future schema and data migrations can stop using engine/model path hints as backlog metadata.

## 2. Problem Statement

Current `deferredMechanics` metadata mixes two different concerns:

- rule semantics: what the deferred rule actually affects
- engine wiring: where the current implementation might eventually store the outcome

That coupling is brittle. Internal engine or sheet-model refactors can invalidate backlog metadata even when the underlying rule meaning has not changed.

## 3. Decision Summary

- Introduce a stable rules-domain vocabulary for affected concepts.
- Treat `dependsOn` as capability identifiers, not ad hoc dependency prose.
- Replace engine-oriented `impactPaths` semantics with domain-oriented `impacts`.
- Document when concept-keyed modifier targets such as `bonuses.skills:jump` are appropriate.
- Keep this phase documentation-only. No schema, pack-data, or test changes are part of this PR.

## 4. Deliverable Split

Parent issue:
- `#59` Normalize deferred mechanics to domain vocabulary and capability IDs

Subissues:
- `#61` Documentation phase
- `#62` Planning phase
- `#60` Implementation phase

Sequential PR stack:
1. Docs PR for `#61`
2. Planning PR for `#62`, stacked on PR1
3. Implementation PR for `#60`, stacked on PR2

## 5. Vocabulary Design

### 5.1 Rule Concept IDs

Affected rule concepts must use stable IDs that describe the rules domain rather than the current data model.

Format:
- lower-case, kebab-case segments
- segment characters: `a`-`z`, `0`-`9`, and internal hyphens only
- no leading, trailing, or repeated hyphens within a segment
- colon-separated namespace
- no empty segments
- no engine object paths

Examples:
- `skills:jump`
- `skills:tumble`
- `combat:ranged`
- `action:standard`
- `proficiency:armor:light`
- `modifier:armor-check-penalty`
- `attack:multi-projectile`

Granularity rule:
- use the most specific stable concept available without encoding engine state
- prefer specific concepts such as `proficiency:armor:light` when the rule text is specific
- use broader concepts only when the rule itself is broad and the extra specificity would be artificial

### 5.2 Capability IDs

Implementation dependencies must be represented as capability IDs.

Format:
- prefix `cap:`
- lower-case kebab-case segments after the prefix

Examples:
- `cap:skills-core`
- `cap:proficiency-armor`
- `cap:armor-check-penalty`
- `cap:combat-attack-sequence`
- `cap:metamagic`

## 6. Field Semantics

### 6.1 `impacts`

`impacts` is the target field for affected rule concepts.

It answers:
- what stable rules concepts this deferred mechanic touches

It does not answer:
- which engine fields will be edited
- which sheet object paths are expected to change

### 6.2 `dependsOn`

`dependsOn` should reference known capability IDs only.

It answers:
- which implementation capability must exist before the deferred mechanic can be implemented cleanly

It does not answer:
- vague future work labels
- temporary implementation notes

### 6.3 `impactPaths`

`impactPaths` is now legacy vocabulary. It reflects engine/model destination guesses and should be removed in the implementation phase after replacement with domain-oriented `impacts`.

New data must not introduce `impactPaths`.

## 7. Numeric Modifier Guidance

When a deferred rule is already representable as a numeric modifier in the effect system, prefer stable concept-keyed targets instead of ad hoc engine fields.

Preferred examples:
- `bonuses.skills:jump`
- `bonuses.skills:tumble`

Separation rule:
- `impacts` names rule concepts such as `skills:jump`
- effect targets use modifier or engine channels such as `bonuses.skills:jump`
- those two namespaces serve different purposes and should not be mixed

Do not use concept-keyed bonus targets when the rule still depends on unmodeled conditional flow, actor choice, timing, or sequencing behavior. In those cases, keep the rule deferred and describe the affected concepts in `impacts`.

## 8. Migration Rules

Implementation PR requirements:
- add a canonical capability registry and validate `dependsOn` against it
- choose the registry location and document it
- define the validation strategy for capability IDs
- add or rename schema support for domain-oriented `impacts`
- migrate existing race/class/feat deferred metadata away from engine-path semantics
- update docs and tests to use the new contract

Non-goals for this docs phase:
- changing `packages/schema`
- changing pack entity JSON
- changing existing tests

## 9. Representative Translation Examples

Examples derived from current backlog patterns:

| Current engine-oriented metadata | Domain-oriented replacement |
|----------------------------------|-----------------------------|
| `impactPaths: [stats.attackBonus, combat.ranged.fullAttack]` | `impacts: [combat:ranged, attack:multi-projectile]` |
| `impactPaths: [selections.equipment, validation.race.proficiency]` | `impacts: [proficiency:armor:light, proficiency:weapon:martial]` |
| `impactPaths: [metadata.alignment, validation.class.alignment]` | `impacts: [alignment:restriction]` |
| `impactPaths: [skills.jump, skills.tumble]` | `impacts: [skills:jump, skills:tumble]` |

Capability examples:
- `dependsOn: [cap:combat-attack-sequence, cap:ammo-consumption]`
- `dependsOn: [cap:alignment-selection, cap:alignment-validation]`
- `dependsOn: [cap:skills-core, cap:armor-check-penalty]`

## 10. Review Guidance

Review this PR as a contract-setting documentation change.

Questions reviewers should answer:
- Are the concept and capability ID formats stable and readable?
- Is the `impacts` semantic clear enough to prevent future engine-path drift?
- Do the representative examples give the planning and implementation phases enough naming guidance?
- Is the numeric-modifier guidance narrow enough to avoid premature engine commitments?

## 11. Acceptance Criteria

- A durable documentation reference exists for deferred mechanics vocabulary and capability conventions.
- The sequential delivery plan for issues `#61`, `#62`, and `#60` is recorded.
- Representative examples are documented for current race/class/feat backlog patterns.
- The docs phase remains documentation-only.
