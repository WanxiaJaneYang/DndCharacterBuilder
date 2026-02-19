# Pack Format

Pack folders must follow:

```text
packs/<pack-id>/
  manifest.json
  authenticity.lock.json (required for official rulesets)
  entities/
    races.json
    classes.json
    feats.json
    items.json
    skills.json
    rules.json
  flows/
    character-creation.flow.json
  patches/ (optional)
  contracts/
```

For official SRD-derived packs, `authenticity.lock.json` is used by automated tests to verify
that critical data artifacts match an approved checksum baseline.

## Entity validation

All entities are validated by `EntitySchema`.

### Required UI metadata on every entity

Each entity record across all buckets must include:

- `summary`
- `description`

And may optionally include image fields:

- `portraitUrl` (string or `null`)
- `iconUrl` (string or `null`)

Use `null` (or omit) when no real asset exists.

### Race entity expectations

`entities/races.json` entries must include a full race metadata block in `data`:

- baseline stats (`size`, `baseSpeed`, `abilityModifiers`)
- senses (`vision.lowLight`, `vision.darkvisionFeet`)
- language package (`automaticLanguages`, `bonusLanguages`)
- class affinity (`favoredClass`)
- trait text (`racialTraits`)
- optional modifier lists (`skillBonuses`, `saveBonuses`, `attackBonuses`)
- optional innate spell-like abilities (`innateSpellLikeAbilities`)

This enables both engine-facing mechanics (via `effects`) and richer UI/rules content from pack data.
