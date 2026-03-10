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
- If `/trellis:start` is not available in the current harness, start manually by reading `.trellis/workflow.md`, running `python ./.trellis/scripts/init_developer.py <your-name>` when needed, and then running `python ./.trellis/scripts/get_context.py`.

## Source Of Truth Boundaries

- Use `.trellis/tasks/` as the source of truth for active execution-task status.
- Use `.trellis/workspace/` as the source of truth for per-developer or per-agent session journals.
- Use `docs/engineering/WORK_PLAN.md` for roadmap, milestones, and sprint intent only; do not use it as a live task-status log.
- Use `docs/` as the canonical home for product, architecture, data-contract, UI, UX, and ADR documentation.
- Treat `.trellis/spec/` as the AI-facing guidance index for this repo. If a Trellis spec file is still placeholder text, fall back to the relevant repo docs and update the Trellis spec instead of inventing parallel rules.

## MR Workflow Notes

- For MR or PR work, read `.codex/mr-flow-and-approvals.md` in addition to running the Trellis startup flow.
- Trellis startup provides session context; it does not replace this repo's review, merge, or approval discipline.
