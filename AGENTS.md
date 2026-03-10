<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

Use the `/trellis:start` command when starting a new session to:
- Initialize your developer identity
- Understand current project context
- Read relevant guidelines

Use `@/.trellis/` to learn:
- Development workflow (`workflow.md`)
- Project structure guidelines (`spec/`)
- Developer workspace (`workspace/`)

Keep this managed block so 'trellis update' can refresh the instructions.

<!-- TRELLIS:END -->

## Repo Compatibility Notes

- This repository already maintains a local `.agents/skills/` library. Discover and use those repo-local skills alongside Trellis instead of treating Trellis as a replacement for them.
- Treat `.trellis/` as additive workflow structure for tasks, specs, and workspace memory. Do not use it as a reason to overwrite existing repo-specific agent rules or review discipline.
- When both Trellis guidance and repo-local guidance exist, follow the more specific project instruction set for the task at hand.
- Do not remove, downgrade, or ignore existing multi-agent review gates just because Trellis is present. Trellis should support the repo workflow, not replace it.
- If `/trellis:start` is not available in the current harness, start manually by reading `.trellis/workflow.md`, running `python .\\.trellis\\scripts\\init_developer.py <your-name>` when needed, and then running `python .\\.trellis\\scripts\\get_context.py`.
