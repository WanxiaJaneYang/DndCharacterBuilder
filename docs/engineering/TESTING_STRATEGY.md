# Testing Strategy

Robust testing ensures that our data‑driven architecture works predictably and guards against regression.  This document outlines the testing strategy for each layer of the DnDCharacterBuilder project.

## Goals

- Verify that packs load and merge deterministically.
- Ensure the engine produces correct derived stats and provenance.
- Validate that the wizard UI renders and enforces rules as expected.
- Catch regressions early through automated tests run on each commit/PR.

## Test Types

### 1. Unit Tests

Unit tests focus on isolated functions and modules without external dependencies.

**Datapack**

- **Schema validation:** Verify that pack manifests, entities, flows and exports conform to their JSON schemas.
- **Pack loading:** Test the pack loader with different combinations of packs, ensuring dependencies and priority order are honoured.
- **Merge logic:** Ensure that overrides and patches produce the expected resolved data.

**Engine**

- **Determinism:** Running `finalizeCharacter` with the same input state and pack set always produces the same output.
- **Modifier application:** Test individual modifier types (add, set, multiply, conditional) and their interactions.
- **Validation:** Verify that `validateState` catches missing selections, overspent skills, invalid feats, etc.

**UI Components**

- **Rendering:** Components render correctly with given props (e.g. StepChecklist, CardGridPicker, AbilityAllocator, SkillAllocator, ValidationBanner).
- **Events:** Components emit the correct events and call callbacks (e.g. `onSelect`, `onChange`).
- **Accessibility:** Basic accessibility attributes exist (labels, focus handling).  Optional in MVP.

### 2. Contract Tests

Contract tests live with each pack in `packs/<pack>/contracts/`.  They describe example state transitions and expected outcomes.  The contract runner loads the packs, applies a series of choices and asserts the final state.

**Example:**

```json
{
  "enabledPacks": ["srd-35e-minimal"],
  "choices": [
    {"stepId": "race", "value": "human"},
    {"stepId": "class", "value": "fighter"},
    {"stepId": "abilities", "value": {"str": 16, "dex": 14, "con": 14, "int": 10, "wis": 10, "cha": 8}},
    {"stepId": "feat", "value": "powerAttack"},
    {"stepId": "skills", "value": {"climb": 4, "jump": 4}},
    {"stepId": "equipment", "value": ["longsword", "chainmail", "shield"]},
    {"stepId": "equipmentMode", "value": "kit"}
  ],
  "expected": {
    "sheet": {"hp": 12, "ac": 16},
    "errors": []
  }
}
```

Contract tests ensure that data packs and engine logic work together correctly.  They serve as living documentation and regression tests.

### 3. Integration Tests

Integration tests combine multiple modules and simulate user flows.  These may be implemented using a headless browser framework (e.g. Playwright or Vitest with React Testing Library) to test the wizard UI end‑to‑end.  For the MVP, integration tests are optional but recommended for critical flows.

### 4. Static Analysis

Use TypeScript’s type checker and ESLint to catch type mismatches and common errors.  Configure Prettier or an equivalent formatter to enforce code style.

## Running Tests

Add the following scripts in the root `package.json`:

```json
{
  "scripts": {
    "test": "npm -ws run test",
    "test:watch": "npm -ws run test --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Use `npm test` to run all unit tests across packages.  Contract tests are executed via `npm run contracts` in the contracts package.  Integration tests (if added) can have their own script.

## TODO

- Finalise JSON schemas and add schema validation tests to the datapack package.
- Create contract fixtures for common character builds and run them in CI.
- Add UI integration tests once the wizard components stabilise.
- Document how to run tests and interpret failure messages in the README.
- Explore mutation testing or property‑based testing for engine logic.

## Checklist

- [ ] Unit tests cover pack loader, engine and core UI components.
- [ ] Contract tests exist for minimal SRD pack and additional packs.
- [ ] Integration tests added (optional for MVP).
- [ ] CI configured to run tests on every PR.