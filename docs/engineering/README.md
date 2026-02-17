# Engineering Documentation Hub

This folder contains engineering documentation for the DnDCharacterBuilder project.  It explains how the codebase is organised, how to contribute, and how to verify that changes align with the product requirements.  Engineering docs are intended for developers working on the project and should be kept up to date as the architecture evolves.

## Contents

- `WORK_PLAN.md` – a living task list and progress tracker for engineers.
- `TESTING_STRATEGY.md` – guidelines on how to test the engine, data packs and UI.
- `PRD_ALIGNMENT_CHECKLIST.md` – a checklist mapping product requirements to implementation tasks.
- `ADR/` – architecture decision records.  Each ADR captures a significant technical decision, its rationale, and its consequences.

## Development Guidelines

1. **Keep core logic pure.**  The engine and pack loader should remain free of UI code and side effects.  This makes them easy to test and reason about.
2. **Write tests first.**  When adding a new feature or fixing a bug, create or update tests before changing the implementation.  Aim for deterministic tests that cover both success and failure cases.
3. **Small commits.**  Break work into small, coherent commits.  Each commit should compile and pass tests.
4. **Follow the docs.**  When implementing features, consult the PRD, UX docs and UI specs.  If a document is unclear, raise an issue and update the docs as needed.
5. **Use ADRs.**  When making significant architecture decisions (e.g. splitting modules, changing state management), create a new ADR in `engineering/ADR` summarising the decision.
6. **Respect licensing.**  Do not commit copyrighted rulebook content.  All data must come from SRD/OGL sources or user‑provided packs.

## To‑Do

- Set up continuous integration to run all tests on every pull request.
- Document code formatting and linting rules.
- Add guidance on code review practices.
- Expand the ADR directory with more decisions as they are made.

## Checklist

- [ ] Work plan created and up to date.
- [ ] Testing strategy documented.
- [ ] PRD alignment checklist drafted.
- [ ] ADR directory populated.