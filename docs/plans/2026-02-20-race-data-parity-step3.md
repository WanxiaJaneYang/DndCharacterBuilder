# Race Data Parity - Step 3 (2026-02-20)

## Goal
Encode additional PHB race mechanics in `packs/srd-35e-minimal/entities/races.json` without waiting on schema-v2-only fields.

## Changes
- Dwarf: added racial attack bonus vs orcs/half-orcs.
- Gnome: corrected illusion save bonus from `+1` to `+2`.
- Halfling: added missing general `+1` save bonus (kept existing `+2 vs fear`).
- Half-orc: added explicit minimum-Intelligence race trait marker.
- Updated authenticity lock checksum/timestamp for modified `races.json`.
- Added contract assertions to prevent regression of these encoded mechanics.

## Tracker
- [x] Identify PHB parity gaps that fit current schema
- [x] Apply race data updates
- [x] Add regression contract test coverage
- [x] Validate contracts + typecheck
- [ ] Open MR for step 3
