# Testing Strategy

## 1) Engine unit tests
- Determinism test: same state/context => same final sheet.
- Snapshot-like assertions for known selections.

## 2) Datapack validation tests
- Schema validation via zod.
- Dependency cycle detection in resolver.
- Basic integrity checks through resolver loading.

## 3) Pack contract tests
- Each pack ships fixtures under `packs/<id>/contracts/*.json`.
- Fixture defines packs, actions, and expected subset checks.
- Runner applies actions through engine APIs and asserts outcomes.

## 4) Minimal E2E
- Web wizard happy-path in `apps/web/src/App.test.tsx`.
- Validates user can progress through steps and see final output.

## Adding a new contract fixture
1. Create `packs/<id>/contracts/<name>.json`.
2. Specify `enabledPacks`, `initialState`, `actions`, `expected`.
3. Run `npm test`.
