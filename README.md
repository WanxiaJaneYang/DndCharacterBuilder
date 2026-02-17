# D&D 3.5 Character Builder (Web, beginner-first)

A beginner-friendly, open-source MVP character builder for **D&D 3.5 SRD content**.

## What this is
- A guided step-by-step web wizard for creating a level 1 character.
- Deterministic, data-driven rules engine with provenance for every derived number.
- Pack-based architecture so future expansions can be enabled/disabled as data packs.

## Legal note
- This repository is intended to include **only SRD/OGL-compatible content**.
- It does **not** include copyrighted full rulebook text.
- It does **not** scrape PDFs from the internet.
- User-uploaded private PDFs are out of scope and are not stored or redistributed.

## Why data-driven
Rules are encoded as pack entities + DSL effects/constraints, not hardcoded in the UI. The UI is a thin client that calls engine APIs.

## Monorepo layout
- `apps/web` React/Vite wizard UI.
- `packages/engine` pure deterministic rules engine.
- `packages/datapack` pack loader, dependency sort, merge/patch, fingerprint.
- `packages/schema` zod schemas for contracts and pack definitions.
- `packages/contracts` pack contract test runner.
- `packs/srd-35e-minimal` minimal SRD demo pack.
- `docs/` architecture/spec/testing docs.

## Run locally
```bash
npm install
npm run dev
```

### Test and quality
```bash
npm test
npm run typecheck
npm run lint
npm run build
```

### Visual regression tests (Playwright)
Uses default Playwright browser install/cache path unless you explicitly set `PLAYWRIGHT_BROWSERS_PATH`.

```bash
npm run playwright:install
npm run test:visual
```

Update visual baselines:

```bash
npm run test:visual:update
```

See `docs/playwright-visual-regression.md` for full workflow and stability tips.

## Pack system and how to add a pack
1. Add `packs/<pack-id>/manifest.json` with id/version/priority/dependencies.
2. Add entities (`races/classes/feats/items/skills/rules`).
3. Add `flows/character-creation.flow.json`.
4. Optional patches in `patches/*.json`.
5. Add `contracts/*.json` fixture for expected behavior.

## MVP Checklist
[ ] Monorepo scaffold (apps/web, packages/engine, packages/datapack, packages/schema, packages/contracts)
[ ] Data pack loader + dependency resolution
[ ] JSON schema validation
[ ] Engine core APIs implemented
[ ] DSL interpreter implemented (effects + constraints)
[ ] Provenance tracking implemented
[ ] Minimal SRD 3.5 pack created (Human + Fighter 1 + items + feats + rules)
[ ] Wizard UI end-to-end flow
[ ] JSON export
[ ] Unit tests + contract tests + CI

## Next TODO
- Add more SRD content (spells, more classes, more races)
- Add printable PDF export
- Add save/load multiple characters
- Add pack authoring UI
- Add localization (CN/EN)

## Roadmap (short)
- Expand data pack coverage while preserving deterministic behavior.
- Improve beginner guidance and explanations.
- Add full printable output and richer validation UX.
