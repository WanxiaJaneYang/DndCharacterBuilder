# Frontend Development Guidelines

> AI-facing frontend guidance index for this repository.

---

## Source Of Truth

This Trellis index is a routing layer, not a replacement for the repo's frontend documentation.

- Canonical UI and component behavior docs live under `docs/ui/`.
- Canonical user-flow and UX intent docs live under `docs/ux/`.
- Canonical frontend testing expectations live in `docs/engineering/TESTING_STRATEGY.md`.
- If a file in this directory is still placeholder content, fall back to those repo docs and sync the relevant guidance back here later.

---

## Read In This Order

1. `docs/ui/README.md`
2. `docs/ui/UI_SPEC.md`
3. `docs/ux/README.md`
4. `docs/ux/steps/` docs relevant to the feature
5. `docs/engineering/TESTING_STRATEGY.md`

Then read the most relevant local Trellis files in this directory:

| Guide | Purpose | Current State |
|-------|---------|---------------|
| [Directory Structure](./directory-structure.md) | Frontend module organization and file placement | Bootstrap placeholder |
| [Component Guidelines](./component-guidelines.md) | Component patterns and composition rules | Bootstrap placeholder |
| [Hook Guidelines](./hook-guidelines.md) | Hook boundaries and data-flow rules | Bootstrap placeholder |
| [State Management](./state-management.md) | Local state and derived-state guidance | Bootstrap placeholder |
| [Quality Guidelines](./quality-guidelines.md) | Test and review expectations | Bootstrap placeholder |
| [Type Safety](./type-safety.md) | Frontend type boundaries and validation | Bootstrap placeholder |

---

## Working Rule

Document this repository's actual conventions here over time. Do not invent generic frontend rules that conflict with the existing docs or codebase.
