# Race Engine Support - Step 2 (2026-02-20)

## Goal
Add engine support for race mechanics that are already encoded in race JSON but previously ignored at runtime.

## Scope
- apply size-based AC/attack modifiers from race size (with optional explicit size override support)
- expose encoded race bonus datasets in `decisions` so data is not dropped:
  - save bonuses
  - attack bonuses
  - AC bonuses
  - spell DC bonuses
  - innate spell-like abilities
  - ancestry tags
  - movement overrides

## Tracker
- [x] TDD RED: add failing tests for size modifiers + race bonus dataset exposure
- [x] GREEN: implement engine parsing/support and make tests pass
- [x] Validate engine tests
- [x] Validate workspace typecheck
- [ ] Open MR for step 2
