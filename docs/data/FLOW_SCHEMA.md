# Flow Schema

Flow files define the wizard order and how each step gets its input.

## Allowed step ids and kinds

- `name` -> `metadata` (manual source)
- `abilities` -> `abilities` (manual source)
- `race` -> `race` (entityType source)
- `class` -> `class` (entityType source)
- `feat` -> `feat` (entityType source)
- `skills` -> `skills` (manual source)
- `equipment` -> `equipment` (entityType source)
- `review` -> `review` (manual source)

The parser rejects unknown step ids and mismatched `kind` or `source.type`.

## Dynamic behavior implemented by the engine

- `feat` limit is dynamic at runtime:
  - Base limit comes from flow JSON.
  - Race trait `bonus-feat` increases available feat selections.
- `skills` is a manual allocator step:
  - Budget uses selected class + ability modifiers + race traits.
  - Cross-class cost/max-rank rules are validated by the engine.

## 3.5 Core Ordering Convention

For 3.5 core packs, the runtime flow should start from ancestry/class decisions:

- `race` first
- `class` second
- then remaining core build steps (`abilities`, `name`, `feat`, `skills`, `equipment`, `review`)

For future 3.5 extension packs:

- `subrace` should appear immediately after `race`
- `subclass` should appear immediately after `class`

This keeps downstream options logically scoped to their parent selections.
