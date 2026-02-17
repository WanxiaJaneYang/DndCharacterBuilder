# AbilityAllocator Component

The `AbilityAllocator` component is responsible for collecting ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) from the user.  It should support different allocation methods depending on the flow configuration.

## Purpose

- Provide an intuitive interface for players to assign scores to abilities.
- Enforce the chosen allocation rules (point buy, manual entry, or other methods in future editions).
- Display derived ability modifiers immediately.

## Props

- `method: 'manual' | 'pointBuy' | string:` Determines the allocation method.  The string may include additional parameters (e.g. `pointBuy:32`).
- `initialScores?: Record<string, number>:` Optional starting values for each ability.
- `onChange: (scores: Record<string, number>) => void:` Callback triggered whenever the user updates an ability score.  The scores object maps ability names (e.g. `str`, `dex`) to numeric values.
- `pointBudget?: number:` For point buy, the total points available.

## Behaviour

### Manual Method

For manual allocation (common in D&D 3.5), the component should:

- Present six numeric inputs (one per ability) with min/max values (usually 3–18).
- Validate that values are within the allowed range.
- Display the ability modifier next to each input.

### Point Buy Method

For point buy (optional in 3.5 or other editions):

- Start with all abilities at an initial value (commonly 8).
- Provide controls (e.g. plus/minus buttons or sliders) to increase/decrease each ability.
- Show the remaining point budget.  Each increment costs a number of points based on the current score (e.g. using D&D point buy tables).  See flow configuration for the budget and cost rules.
- Disable controls when the budget is exhausted.

### Common Behaviour

- Each time a score changes, call `onChange` with the updated scores.
- Calculate and display the ability modifier using the standard formula `(score - 10) // 2`.

## TODO

- [ ] Implement point buy cost table for D&D 3.5 and configure via rule data.
- [ ] Add tooltips explaining what each ability does for beginners.
- [ ] Handle invalid states gracefully (e.g. negative budgets, missing config).

## Checklist

- [ ] Supports at least manual entry method for MVP.
- [ ] Point buy method is implemented or stubbed with clear TODO.
- [ ] Validation prevents illegal scores.
- [ ] Ability modifiers are calculated and displayed.