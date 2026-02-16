# Refactor Checklist (Agentic-Coding Friendly)

## Step 1 — Explore-only summary

### Current structure
- Monorepo has `apps/web`, `packages/{engine,datapack,schema,contracts}`, `packs/srd-35e-minimal`, and docs.
- `packages/datapack/src/index.ts` mixed pure resolution logic with Node-only disk loading (`node:fs`, `node:path`, `node:crypto`).
- `packages/engine/src/index.ts` had local/duplicated resolved type shapes.
- `apps/web/src/App.tsx` manually injected a `review` step rather than using only flow data.
- Root scripts and CI did not expose/run a dedicated `contracts` command.

### Pain points against requested invariants
- Browser boundary risk: web depended on an entrypoint that imported Node modules.
- Type drift risk: resolved pack/entity types were duplicated across packages.
- Wizard data-driven invariant was violated by manual review-step injection.
- Contracts runner error messages lacked pack/fixture context and expected-vs-actual snippets.

## Step 2 — Plan and checklist

### Plan
1. Split datapack into `core` vs `node` entrypoints and enforce import boundaries.
2. Centralize resolved types in datapack core; update engine/contracts/web usage.
3. Make wizard flow fully data-driven and schema-constrained.
4. Keep dependency-first pack ordering with explicit test coverage.
5. Improve contract runner ergonomics and add root `contracts` command.
6. Add root `CLAUDE.md` playbook and update CI.

### Checklist
- [x] Explore-only pass completed (no code changes during exploration).
- [x] Added tests first where feasible (schema unknown step id, datapack entity source metadata).
- [x] Implemented datapack core/node boundary split.
- [x] Unified resolved types across datapack and engine.
- [x] Removed manual wizard step injection; flow now drives all steps.
- [x] Added flow schema constraints with clear unknown-step errors.
- [x] Improved contract runner diagnostics.
- [x] Added `npm run contracts` root script and CI step.
- [x] Added root `CLAUDE.md`.
- [x] Recorded verification command outcomes.

## Verification log
- `npm test` → ⚠️ failed: local tools unavailable (`vitest: not found`) because dependencies could not be installed in this environment.
- `npm -ws run typecheck` → ⚠️ failed: missing `@types/node` due unresolved dependency installation (`TS2688`).
- `npm -ws run build` → ⚠️ failed: missing `@types/node` and toolchain binaries due unresolved dependency installation.
- `npm --workspace @dcb/web run dev` → ⚠️ failed: `vite: not found` (dependency install incomplete).
- `npm run contracts` → ⚠️ failed: `vitest: not found` (dependency install incomplete).
- `npm ci` attempts → ⚠️ unstable in this container (proxy-related hangs and `ENETUNREACH` without proxy).
