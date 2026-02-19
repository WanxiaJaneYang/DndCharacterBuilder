# MR Flow And Approval Preferences

## User Preferences
- Do not repeatedly ask for GitHub-related approvals when an approved command prefix already exists.
- Prefer reusing saved approved prefixes for `gh`/GitHub operations.
- Batch GitHub operations to minimize approval prompts.
- If all comments are addressed and all CI checks pass, proceed to merge.
- If approval is required and self-approval is blocked, use admin merge when explicitly requested by user workflow.

## Approved Prefixes (This Session)
- `git commit`
- `git push`
- Git MR creation commands: `gh pr create`, `gh pr comment`, `gh pr edit`
- Git MR pull/read commands: `gh pr view`, `gh pr list`, `gh pr status`, `gh pr checks`, `gh pr diff`
- CI/log inspection commands: `gh run view`, `gh run list`
- Review/comment resolution commands: `gh api` (including GraphQL mutations/queries for review threads and comments), `gh pr review`
- Merge commands: `gh pr merge` (including admin merge when required by branch policy and user workflow)

## Standard MR Flow
1. Identify latest/open MR tied to current branch.
2. Check merge conflict state first (`mergeStateStatus` / `gh pr view`).
3. If conflict/dirty, resolve conflicts on the MR branch **before** requesting/rerunning CI.
4. Pull unresolved review threads/comments.
5. Address unaddressed comments in code/docs/workflows.
6. Resolve addressed threads.
7. Re-request review (Copilot/reviewer) using direct reviewer-request APIs and re-check CI.
8. Iterate steps 4-7 until review threads are resolved and checks pass.
9. Merge MR (prefer normal merge; use `--admin` only when required by policy/workflow).
10. Verify merged state and report merge commit SHA.

## Copilot Review Trigger Rules
- Use direct reviewer requests, not comments:
  - `gh pr edit <pr-number> --add-reviewer copilot`
- Do **not** use comment pings like `@copilot ...` to re-request review.
- After requesting Copilot review, poll PR checks/review state and only proceed once new comments (if any) are handled.

## Post-push polling requirement
- After every push to an MR branch:
  1. Poll `gh pr checks <pr-number>` until checks are no longer pending.
  2. Poll `gh pr view <pr-number>` for `reviewDecision` / requested reviewers (Copilot included when requested).
  3. If CI fails, fix immediately and repeat polling.
  4. If review is still required, report blocker clearly and continue once feedback arrives.

## Operational Rules For Future Sessions
- Read this file at the start of MR-related tasks.
- Assume user wants end-to-end completion (fix -> resolve -> review -> merge) unless user says otherwise.
- Surface only hard blockers (policy limitations, failed CI, missing required reviewer approval).
- Keep user updates brief and action-focused.

## Workspace Notes (Current Migration)
- Local guidance/skill artifacts are being tracked on branch: `chore/agent-guidance-and-local-skills`.
- Keep these artifacts off `main` until explicitly reviewed: `.codex/`, `.agents/`.
- If interrupted mid-task, immediately:
1. run `git status --short --branch`
2. move work to a dedicated `chore/*` branch
3. update this file with what was changed and why

## Agent Direction For This Repo
- Prefer repo-local skill prompts under `.agents/skills/` when they match the task.
- Treat `.codex/skills/` as local experiments unless user asks to publish or promote them.
- Before MR actions, check this file first for approval and flow preferences.

## Platform Constraints
- GitHub does not allow approving your own PR. If branch protection requires approval and no other approver is available, use admin merge only when user workflow explicitly allows it.
