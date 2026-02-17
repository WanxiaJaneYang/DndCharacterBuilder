# CardGridPicker Component

The `CardGridPicker` component displays a collection of selectable cards.  It is used for choosing races, classes and other entities that are represented visually.

## Purpose

- Present multiple options (entities) in a grid layout with images, names and summaries.
- Support single or multiple selection (though for races and classes only one choice is allowed; for feats or items multiple may be allowed in future).
- Provide a “view details” action to display extended information about an entity.

## Props

- `items: Array<{ id: string; name: string; summary: string; description: string; image?: string; disabled?: boolean; }>:`
  A list of selectable items.  The `id` uniquely identifies the entity; `name` is displayed on the card; `summary` is a short description; `description` is shown in the details modal; `image` is a URL or import path to the card image; `disabled` optionally marks an item as not selectable due to prerequisites.
- `selectedId?: string:` For single‑select mode, holds the currently selected item id.
- `onSelect: (id: string) => void:` Callback invoked when the user selects an item.
- `multiple?: boolean:` If true, allow selecting multiple items (not used in MVP for races/classes).

## States

- **Default** – all cards are rendered normally.
- **Selected** – the chosen card(s) show a highlighted border or checkmark.
- **Disabled** – cards that cannot be selected (due to unmet prerequisites) appear greyed out.

## Behaviours

- Clicking a **selectable** card marks it as selected and triggers `onSelect`.
- Clicking a **disabled** card should do nothing; optionally show a tooltip explaining why.
- Clicking the “view details” button or the card itself (depending on design) opens a `DetailsModal` with the full description.

## TODO

- [ ] Support keyboard navigation and selection for accessibility.
- [ ] Provide loading and error states if images fail to load.
- [ ] Explore using lazy loading for large numbers of items.

## Checklist

- [ ] Card layout adapts to screen size (responsive grid).
- [ ] Selected and disabled states are visually clear.
- [ ] View details modal displays the full description correctly.
- [ ] Callback functions are documented and triggered appropriately.