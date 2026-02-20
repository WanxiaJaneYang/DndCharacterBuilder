# Race Schema V2 And Parity Plan (2026-02-20)

## Scope
Step 1 only:
- extend race schema expressiveness for PHB race-rule concepts not yet first-class
- add schema tests for new fields
- add a race parity checklist that maps PHB traits to schema/data/runtime status

No runtime behavior changes in this step.

## Sequence
1. Add failing schema tests for new race-data fields.
2. Extend `RaceDataSchema` with backward-compatible optional fields.
3. Re-run schema tests until green.
4. Add migration checklist document for all 7 PHB core races.
5. Open a dedicated MR for this step.

## Step Tracker
- [x] TDD RED: new race-schema tests fail first
- [x] GREEN: schema supports new optional fields
- [x] REFACTOR: keep naming and docs consistent
- [x] Add parity checklist document
- [x] Validate (`npm --workspace @dcb/schema run test`, `npm run typecheck`)
