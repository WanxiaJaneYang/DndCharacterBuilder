# Findings

- The user set a new repository expectation: every authored `ts`/`tsx` module should stay at or under 200 lines by default.
- This is intended as both a coding-style and review-standard rule, not just a cleanup preference.
- Current violating files in the `#195` branch:
  - `apps/web/src/App.tsx` at 1416 lines
  - `apps/web/src/components/ReviewStep.tsx` at 580 lines
  - `apps/web/src/appHelpers.ts` at 293 lines
- The user wants the current branch restarted in place rather than abandoned for a fresh branch from `main`.
- The target architecture remains:
  - `App.tsx` should trend toward orchestration only
  - dynamic/config-friendly rendering should be favored over hardcoded branches
  - modules should be split by responsibility and remain extendable
