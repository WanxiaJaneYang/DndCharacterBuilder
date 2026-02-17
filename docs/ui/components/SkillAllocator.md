# UI Component – SkillAllocator

This component handles the allocation of **skill points** for the character.  In D&D 3.5, each class grants a number of skill points that players can distribute among various skills at each level.  The SkillAllocator must provide a clear interface for entering these values and enforce budget constraints.

## Purpose

Allow users to assign skill ranks within their available budget.  The component should support both class skills and cross‑class skills.  It should prevent overspending and respect the maximum ranks allowed for level 1 characters.

## Props

| Name | Type | Description |
| --- | --- | --- |
| `skills` | `SkillEntity[]` | The list of skills available for the current class/edition.  Each skill includes its `id`, display `name`, whether it is a class skill, and any description. |
| `allocated` | `Record<string, number>` | A mapping of skill IDs to the current number of ranks allocated. |
| `budget` | `number` | The total number of skill points the user can spend for this level. |
| `maxRanks` | `number` | The maximum ranks allowed per skill at this level (1 for class skills, 0.5 for cross‑class in 3.5).  For simplified MVP, cross‑class may share the same max. |
| `onChange` | `(updated: Record<string, number>) => void` | Callback when the user updates the allocation. |
| `disabled` | `boolean` | If true, the allocator is read‑only and cannot be edited. |

## States & Behaviour

### States

- **Default:** The component renders a table or list of skills with input fields (e.g. number inputs or stepper controls) showing the current allocation.  An available points counter is visible.
- **Over Budget:** If the sum of allocated points exceeds the budget, the component highlights the overage (e.g. with a red counter) and disables the Next button until corrected.
- **Invalid Rank:** If a skill’s allocated ranks exceed `maxRanks`, highlight the input field and display an error.  The validation prevents the user from saving invalid values.
- **Read‑Only:** When `disabled` is true, inputs are disabled and show the allocated ranks without editing controls.

### Behaviour

1. **Rendering Skills:**  List each skill with its name.  If class skills and cross‑class skills behave differently, group or mark them.  An optional tooltip can display the skill description.
2. **Editing Ranks:**  Users can increase or decrease ranks using plus/minus buttons or a number input.  Changing a value triggers `onChange` with the updated mapping.
3. **Budget Enforcement:**  The component calculates the sum of all allocated ranks and subtracts this from the budget.  Overages are highlighted and must be corrected.
4. **Max Rank Enforcement:**  Each skill may have a maximum rank for level 1.  Inputs should clamp to this maximum or display an error.
5. **Accessibility:**  Input elements should be keyboard accessible and include appropriate labels.

## TODO

- Decide how cross‑class skills are handled (0.5 ranks increments vs simplified equal cost).  For MVP, a simplified model may treat all skills with the same cost and max.
- Define whether skills should be grouped or sorted (e.g. alphabetically, class skills first).
- Determine visual style for tables vs lists (see UI guidelines).  Figma designs will guide layout.
- Implement error states and messaging consistent with the validation banner component.
- Write unit tests for budget and rank validation logic.

## Checklist

- [ ] Skill list renders with names and editable inputs.
- [ ] Budget counter updates when ranks change.
- [ ] Max rank enforcement implemented.
- [ ] Over‑budget state highlighted and blocks progression.
- [ ] `onChange` callback emits updated mapping.
- [ ] Component styled to match design tokens and responsive layout.