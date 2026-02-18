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
