# D&D 3.5 Character Builder (Web, beginner-first)

A beginner-friendly, open-source MVP character builder for **D&D 3.5 SRD content**.

## What this is
- A guided step-by-step web wizard for creating a level 1 character.
- Deterministic, data‑driven rules engine with provenance for every derived number.
- Pack-based architecture so future expansions can be enabled/disabled as data packs.

## Legal note
- This repository is intended to include **only SRD/OGL-compatible content**.
- It does **not** include copyrighted full rulebook text.
- It does **not** scrape PDFs from the internet.
- User-uploaded private PDFs are out of scope and are not stored or redistributed.

## Why data‑driven
Rules are encoded as pack entities + DSL effects/constraints, not hardcoded in the UI. The UI is a thin client that calls engine APIs.

## Monorepo layout
The repository is a monorepo. Key top‑level folders include:

- **`apps/web`** – the React/Vite wizard UI (pure presentation).
- **`packages/engine`** – pure deterministic rules engine.
- **`packages/datapack`** – pack loader, dependency resolver, merge/patch and fingerprint.
- **`packages/schema`** – zod schemas for pack definitions and common types.
- **`packages/contracts`** – pack contract test runner.
- **`packs/srd-35e-minimal`** – minimal SRD demo pack with manifest, entities, flow and contracts.
- **`docs/`** – all product, UX, UI, data, figma and engineering documentation.

## Documentation structure
The `docs/` folder is organised by discipline. To work on a specific area, start with the README in the corresponding subfolder:

- **`docs/product/`** – product definitions and planning (PRD, MVP scope, decisions). Start with `docs/product/README.md`.
- **`docs/ux/`** – user journey and UX specifications. Start with `docs/ux/README.md`, then see `docs/ux/steps/` for per‑step details.
- **`docs/ui/`** – UI specifications and component guidelines. Start with `docs/ui/README.md`, then review `docs/ui/UI_SPEC.md` and docs under `docs/ui/components/`.
- **`docs/figma/`** – Figma hand‑off process, assets and token synchronisation. Start with `docs/figma/README.md`.
- **`docs/data/`** – pack/data format, schema definitions and examples. Start with `docs/data/README.md`.
- **`docs/engineering/`** – engineering process, work plans, ADRs and testing strategy. Start with `docs/engineering/README.md`.

Each documentation folder contains a todo list and a checklist to track progress. Use these to orient yourself and plan work.

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

## Pack system and how to add a pack
1. Add `packs/<pack-id>/manifest.json` with id/version/priority/dependencies.
2. Add entities (`races/classes/feats/items/skills/rules`).
3. Add `flows/character-creation.flow.json`.
4. Optional patches in `patches/*.json`.
5. Add `contracts/*.json` fixture for expected behaviour.

## MVP Checklist
[ ] Monorepo scaffold (apps/web, packages/engine, packages/datapack, packages/schema, packages/contracts)  
[ ] Data pack loader + dependency resolution  
[ ] JSON schema validation  
[ ] Engine core APIs implemented  
[ ] DSL interpreter implemented (effects + constraints)  
[ ] Provenance tracking implemented  
[ ] Minimal SRD 3.5 pack created (Human + Fighter 1 + items + feats + rules)  
[ ] Wizard UI end-to-end flow  
[ ] JSON export  
[ ] Unit tests + contract tests + CI  

## Next TODO
- Add more SRD content (spells, more classes, more races)
- Add printable PDF export
- Add save/load multiple characters
- Add pack authoring UI
- Add localisation (CN/EN)

## Roadmap (short)
- Expand data pack coverage while preserving deterministic behaviour.
- Improve beginner guidance and explanations.
- Add full printable output and richer validation UX.
