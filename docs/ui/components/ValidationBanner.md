# UI Component – ValidationBanner

The **ValidationBanner** component displays validation messages to the user.  It is used on wizard steps to alert the user when something is invalid (e.g. missing selection, overspent points) and to prevent progression until the issue is resolved.  This component centralises error messaging and encourages consistent styling across the application.

## Purpose

Provide a prominent but unobtrusive alert area where validation errors are displayed.  It should draw attention without overwhelming the user.  The banner is typically shown at the top or bottom of a step and collapses when there are no errors.

## Props

| Name | Type | Description |
| --- | --- | --- |
| `errors` | `string[]` | A list of human‑readable validation messages to display.  When empty, the banner is hidden. |
| `type` | `'error' | 'warning'` | Severity of the messages; affects icon and colour.  Default to `'error'`.  Future enhancements may include `'info'` or `'success'` types. |
| `onDismiss` | `() => void` | Optional callback to dismiss the banner manually.  If provided, the banner shows a close icon. |

## States & Behaviour

### States

- **Hidden:** When `errors` is empty, the banner is not rendered or is visually collapsed.
- **Visible:** When there are one or more messages, the banner becomes visible.  It displays an icon appropriate for `type` and lists all messages.  For multiple messages, list them vertically or combine them into a summary sentence.
- **Dismissed:** If `onDismiss` is provided and the user clicks the close icon, the banner triggers `onDismiss` and hides.  This does not clear the underlying validation state; it merely hides the banner UI.

### Behaviour

1. **Dynamic Visibility:**  The parent step passes the current list of validation errors.  The banner monitors changes to `errors` and toggles visibility accordingly.
2. **Content Rendering:**  When visible, the banner displays an appropriate icon and a message string.  For multiple messages, consider displaying the first message and an indicator of more (e.g. “and 2 more issues”).
3. **Dismissal:**  If a dismiss callback is provided, the banner includes a close button.  Clicking the button calls `onDismiss`.
4. **Styling:**  Use the design tokens for colours, spacing and typography.  Error banners use a red background; warnings use an amber background.

## TODO

- Decide on the exact placement of the banner in the step layout (top vs bottom; margin sizes) based on Figma designs.
- Implement animation or transitions for showing/hiding the banner.
- Determine how multiple error messages should be aggregated or prioritised.
- Explore internationalisation/localisation for error messages.
- Write unit tests to ensure the banner hides when errors clear and emits `onDismiss` correctly.

## Checklist

- [ ] Banner shows when there are errors and hides when there are none.
- [ ] Correct icon and styling applied based on error type.
- [ ] Dismiss button triggers callback and hides banner.
- [ ] Accessible: banner content can be read by screen readers.
- [ ] Styling uses design tokens for colours and spacing.