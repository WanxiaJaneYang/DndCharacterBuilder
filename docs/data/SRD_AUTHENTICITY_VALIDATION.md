# SRD Authenticity Auto-Validation

## Goal

Ensure official-rule datasets stay faithful to the official SRD without relying on manual review for every change.

## What is implemented now

An automated lockfile-based integrity check for official packs:

1. Each official pack can include `authenticity.lock.json`.
2. The lock records:
   - official source authorities
   - the expected SHA-256 hash for each canonical SRD entity artifact (`entities/*.json`)
3. `@dcb/contracts` now validates these hashes during test runs.
4. Any drift in locked files fails CI with a clear checksum mismatch error.

This is enforced by:

- `packages/contracts/src/authenticity.ts`
- `packages/contracts/src/contracts.test.ts`
- `packs/srd-35e-minimal/authenticity.lock.json`

## Scope policy (important)

To reduce false-positive churn, authenticity locks should include only canonical SRD data files:

- `entities/races.json`
- `entities/classes.json`
- `entities/feats.json`
- `entities/items.json`
- `entities/skills.json`
- `entities/rules.json`

Do **not** include UI/presentation artifacts like `flows/*` or `locales/*` in authenticity locks.

## Why this helps

- Prevents silent accidental edits to official SRD data.
- Makes authenticity checks deterministic and CI-friendly.
- Creates a tamper-evident baseline for official packs.

## Current limitation

Checksum validation proves "unchanged from approved baseline", not "correct against SRD text" by itself.

To fully validate SRD correctness automatically, we need source-text comparison in addition to lockfiles.

## Recommended next phase (automatic source fidelity)

1. Add normalized source snapshots:
   - Store canonical SRD extracts per entity in `packs/<id>/sources/`.
2. Add extractor/parser pipeline:
   - Convert source snapshots into normalized rule facts.
3. Add semantic equivalence checks:
   - Compare normalized facts to pack entities/effects.
4. Gate lockfile regeneration:
   - Lock updates should require explicit command + reviewer acknowledgement.

## Suggested CI policy

1. Run contract tests (includes authenticity checks).
2. Block merge on any lock mismatch.
3. Require dedicated "authenticity update" commit when lockfiles change.

