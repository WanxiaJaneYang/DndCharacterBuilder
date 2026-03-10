---
name: repo-standards
description: Use when making repository changes, preparing PRs, or running build/test/lint workflows. Skip for pure Q&A.
---

# Repo Standards

1. Inspect repository state first (`git status`, current branch, pending local changes).
2. Start the repo workflow first: run `/trellis:start` when available, or manually run `python ./.trellis/scripts/init_developer.py <your-name>` as needed and `python ./.trellis/scripts/get_context.py`.
3. Read the relevant `.trellis/spec/` guidance before coding. If a Trellis spec file is still placeholder content, fall back to the corresponding repo docs in `docs/` and treat those as the source material to sync back into `.trellis/spec/`.
4. Keep changes minimal and aligned with existing style and architecture.
5. Run relevant validation for touched areas (format, lint, typecheck, tests).
6. Update docs/README when commands, workflows, or behavior change.
7. Summarize what changed, what was validated, and any remaining risk.
