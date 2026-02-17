# UI Documentation Hub

This folder contains documentation related to the visual design and user interface (UI) of the D&D Character Builder.  The UI is intentionally kept thin and data‑driven: it renders whatever steps and entities are defined by the rule packs and flows.  These documents capture how the application should look and behave from the user’s perspective.

## Purpose

* Outline the overarching design principles and visual style of the wizard.
* Describe each UI component and its states so that developers and designers have a shared reference.
* Provide guidance on accessibility, responsiveness, and internationalisation.
* Serve as the entry point to more detailed UI specifications under this directory.

## Contents

- **UI_SPEC.md** – high‑level specification of the user interface including page layouts, component requirements and visual states.
- **components/** – per‑component documentation; each Markdown file here explains the intent, props, states and examples for a specific component (e.g. card grid, ability allocator, etc.).
- **tokens/** – design tokens and guidelines, such as colour palettes, spacing scales and typography settings.

## Guidelines

1. **Data‑driven rendering** – UI should never hardcode rule data.  All options, labels and flows must come from JSON configuration.  This ensures that new rule packs or editions can be supported without changing the UI code.
2. **Responsive design** – Interfaces should work on both desktop and mobile.  Use flexible layouts (e.g. CSS grid/flexbox) and avoid fixed widths.
3. **Accessibility** – Provide sufficient contrast, keyboard navigation, and ARIA labels.  Use semantic HTML whenever possible.
4. **Modularity** – Components should be reusable and isolated.  Each component should accept props for data and emit events for user actions.
5. **Consistency** – Use design tokens defined in `ui/tokens/DESIGN_TOKENS.md` for colours, fonts and spacing.

## TODO

The UI documentation is a living document.  As the project evolves, expand this folder with new components and update existing specs.

* [ ] Add high‑level UI flow diagrams for the wizard (e.g. sequence of pages).
* [ ] Define base styles and typography tokens in `ui/tokens`.
* [ ] Document accessibility requirements (keyboard navigation, ARIA labels).
* [ ] Add state diagrams for complex components (e.g. skill allocator).  

## Checklist

Use this checklist to track the completion of UI documentation during development.

- [ ] `UI_SPEC.md` summarises all major pages and describes their layout.
- [ ] Component docs exist for every custom component used in the wizard.
- [ ] Design tokens are defined and documented.
- [ ] The README links to all relevant documents and guidelines.