# AbilityAllocator Component

The Ability step allocator is responsible for collecting ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) from the user. Behavior is fully driven by flow data (`abilitiesConfig`) and can vary by edition.

## Purpose

- Provide an intuitive interface for players to assign scores to abilities.
- Enforce the chosen allocation rules (point buy, PHB, roll sets).
- Display derived ability modifiers immediately.
- Display existing modifiers already granted by selected race/class/rules.

## Inputs

- `abilitiesConfig`: Data-driven mode/rule config from flow (`modes`, `defaultMode`, point buy settings, PHB settings, roll-set settings).
- `initialScores?: Record<string, number>`: Optional starting values for each ability.
- `onChange: (scores: Record<string, number>) => void`: Callback triggered whenever the user updates an ability score.
- `abilityMeta?`: Selected mode and mode-specific metadata (e.g. point cap, roll-set selection).

## Behavior

### Point Buy

- Show point-cap control (bounded by config min/max/step).
- Show spent and remaining points from configured cost table.
- Validate total cost does not exceed selected cap.

### PHB

- Render according to configured PHB method type.
- Validate assigned scores against configured PHB rules.

### Roll Sets

- Render generated sets from configured roll method.
- Require choosing one set and using that selection for assigned scores.

### Common

- Each time a score changes, call `onChange` with updated scores.
- Calculate and display the ability modifier using `(score - 10) // 2`.
- Show base score, existing modifiers, final score, and final modifier for each ability.

## Checklist

- [x] Supports point buy / PHB / roll-set modes from flow config.
- [x] Point-buy cap and costs are data-driven.
- [x] Validation prevents illegal/invalid mode states.
- [x] Ability modifiers and existing adjustments are visible during allocation.
