# StepChecklist Component

The `StepChecklist` component renders the list of wizard steps.  It helps users orient themselves and navigate through the character creation process.

## Purpose

- Display each step defined in the flow JSON in the order specified.
- Indicate the status of each step: pending, active, completed or error.
- Provide navigation to previous steps while preventing skipping ahead to future steps.

## Props

- `steps: Array<{ id: string; label: string; status: 'pending' | 'active' | 'done' | 'error'; }>:`
  An array of objects representing each step.  The `id` corresponds to the step id in the flow JSON; `label` is a human‑friendly title; `status` indicates the current progress state.
- `currentStepId: string:` The id of the currently active step.  Used to highlight the active entry.
- `onStepClick?: (stepId: string) => void:` Callback when the user clicks on a completed or active step.  Should navigate to that step if allowed.

## States

- **Default** – steps are displayed in their defined order with no special highlights.
- **Active** – the current step is highlighted (e.g. accent colour or bold).  Only one step can be active at a time.
- **Done** – completed steps may be marked with a checkmark or green highlight.
- **Error** – steps containing validation errors may be marked with a warning icon and red colour.

## Behaviours

- Clicking on a **done** step navigates back to that step, allowing the user to review or change earlier choices.
- Clicking on the **active** step does nothing (already on that step).
- Clicking on a **pending** step ahead of the active one is disabled to prevent skipping mandatory steps.  Show a tooltip explaining why if the user tries.

## TODO

- [ ] Determine the best icons and colours for each status state.
- [ ] Implement keyboard accessibility: arrow keys navigate between steps.
- [ ] Consider horizontal vs vertical orientation for different screen sizes.

## Checklist

- [ ] Props are documented and type definitions match implementation.
- [ ] The component renders correctly with various status states.
- [ ] Navigation callback prevents skipping ahead.
- [ ] Accessibility guidelines are followed (ARIA roles and labels).