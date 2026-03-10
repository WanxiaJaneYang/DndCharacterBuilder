# Frontend Quality Guidelines

> Repo-specific frontend quality rules for the DndCharacterBuilder UI.

---

## Overview

The frontend is a thin, data-driven wizard UI.

- UI flow and option surfaces should come from pack data and flow definitions, not from hardcoded rule logic in React.
- Engine validation and compute contracts are the authority for legality, derived values, unresolved mechanics, and provenance-backed explanations.
- Frontend work must preserve mobile readability, deterministic rendering, and the review-page contract documented in `docs/ui/UI_SPEC.md`.

Read alongside:

- `docs/ui/UI_SPEC.md`
- `docs/ux/README.md` and the relevant step docs
- `docs/engineering/TESTING_STRATEGY.md`

---

## Forbidden Patterns

- Re-deriving game rules in UI code when the engine or contract should provide the value.
- Hardcoding edition-specific or pack-specific rule data directly into React components.
- Treating provenance as required for UI correctness. Provenance is optional; the UI must still render correctly without it.
- Hiding or swallowing engine validation issues instead of surfacing them through the page's validation/error UI.
- Expanding `App.tsx` or other orchestration components with large blocks of rules math, pack normalization, or derived-stat reconstruction.
- Shipping a user-visible flow or review-page change without updating the relevant docs when the contract or behavior changed.

---

## Required Patterns

- Keep UI logic focused on rendering, local interaction state, and thin mapping from contract data to components.
- Prefer JSON-driven rendering and engine-provided contracts over ad hoc UI branching.
- Surface blocking validation and unresolved-mechanics information clearly rather than guessing hidden defaults in the UI.
- Keep step behavior aligned with the UX step docs and the UI spec, especially for navigation gating, mobile layout, and review-page structure.
- When adding or changing complex UI behavior, preserve accessibility basics: labels, focus flow, semantic controls, and visible validation states.

---

## Testing Requirements

- Run frontend typecheck for frontend changes.
- Add or update Vitest/RTL coverage for component behavior, user interaction, and validation states when changing wizard UI behavior.
- Add or update integration-style coverage for critical multi-step wizard behavior when the change affects flow, gating, or review rendering.
- Use visual regression coverage when the change materially alters layout or important review/step UI surfaces.
- Prefer deterministic test inputs tied to pack/config data rather than brittle timing or incidental DOM structure.

---

## Code Review Checklist

- Does the change keep rules logic in engine/contracts instead of re-implementing it in the UI?
- Does the UI still behave as a thin client over pack data, flow config, and compute results?
- Are validation, unresolved, and assumption surfaces still shown in a user-comprehensible way?
- Does the change preserve mobile readability and the current review-page contract?
- Are tests and docs updated for any behavior or contract-facing change?
