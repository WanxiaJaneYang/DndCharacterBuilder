# CLAUDE.md

## Repo map
- `apps/web` – React/Vite wizard UI; must consume pack‑driven flow/data only.
- `packages/schema` – Zod schemas + shared domain types.
- `packages/datapack` – Pack resolution (`core`) and disk I/O (`node`) entrypoints.
- `packages/engine` – Pure deterministic rules engine + provenance.
- `packages/contracts` – Pack fixture runner.
- `packs/srd-35e-minimal` – MVP data pack (manifest/entities/flow/contracts).
- `docs` – Documentation for product, UX, UI, data, figma and engineering.

## Common commands
- Dev web: `npm --workspace @dcb/web run dev`
- Unit tests: `npm test`
- Contracts: `npm run contracts`
- Typecheck: `npm -ws run typecheck`
- Build: `npm -ws run build`

## Invariants
1. Rules are data: UI must not hardcode SRD rules or wizard steps.
2. Engine stays pure/deterministic and unit‑testable.
3. Browser code must never import Node‑only modules/entrypoints (`@dcb/datapack/node`).
4. Pack resolution must preserve dependency order; priority only breaks independent ties.
5. Provenance must record the source pack/entity for every applied effect.

## Workflow
- Prefer **explore → plan → code → verify → commit**.
- For refactors, maintain a checklist scratchpad in the relevant `docs/` folder and update verification outcomes.
- Prefer test‑first loops when feasible; keep commits small and scoped.
- Before each commit: run relevant tests (`npm test`), type checks, build and contract tests (`npm run contracts`) and capture outcomes.

## Reading guidelines for Claude
1. Identify which area your task falls into (product, UX, UI, data, figma, engineering).
2. Read the corresponding `docs/<area>/README.md` first to get an overview and find links to deeper documents.
3. Each documentation subfolder contains a TODO list and a checklist. Use these to decide which files to read next and to track progress.
4. Avoid hardcoding rule logic in UI or skipping the guidelines; follow the checklists to maintain determinism and traceability.

## MR/PR guidance
- Before any MR/PR work, read `.codex/mr-flow-and-approvals.md`.
- Follow its MR flow, approval preferences, and GitHub command guidance for this repo.
