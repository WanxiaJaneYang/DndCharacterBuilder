# DetailsModal Component

The `DetailsModal` component displays detailed information about a selected entity (race, class, feat, item, etc.).  It is opened from card pickers or lists and should provide rich descriptive content without leaving the wizard flow.

## Purpose

- Present full descriptions, abilities and traits of an entity when the user requests more information.
- Keep the user in context; they should be able to close the modal and continue the selection process without losing progress.

## Props

- `open: boolean:` Controls whether the modal is visible.
- `onClose: () => void:` Callback to close the modal.
- `entity: { id: string; name: string; description: string; packId?: string; sourceLink?: string; }:`
  The entity to display.  `description` may include formatted text (Markdown or HTML) from the pack; `packId` identifies which pack the entity came from and can be used for provenance; `sourceLink` could provide a link to the SRD or rule reference for advanced users (future feature).

## Behaviour

- When open, the modal overlays the page and traps focus.  The background content should be inert and not scrollable.
- It should include a header with the entity name, a scrollable content area for the description, and a close button.
- Optionally display badges for source pack or other metadata.

## TODO

- [ ] Decide on Markdown vs HTML rendering for descriptions.
- [ ] Implement keyboard accessibility (Esc closes modal, Tab stays within modal).
- [ ] Support additional tabs or sections for long descriptions (e.g. spells, class features).

## Checklist

- [ ] Modal open/close behaviour works with both mouse and keyboard.
- [ ] Content area supports scrolling and long text.
- [ ] Entity metadata (pack id) is displayed if available.