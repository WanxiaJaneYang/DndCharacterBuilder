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
  locales/ (optional)
    zh.json
  patches/ (optional)
  contracts/
```

For official SRD-derived packs, `authenticity.lock.json` is used by automated tests to verify
that canonical SRD data artifacts (`entities/*.json`) match an approved checksum baseline.

`flows/*`, `locales/*`, and other presentation/configuration files are intentionally excluded
from authenticity locks so normal UI/UX iteration does not require lockfile churn.

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

## Locales (optional)

Packs can provide UI-facing localization data under `locales/<language>.json`.

Current supported locale payload keys:

- `flowStepLabels`: map of `stepId -> localized label`
- `entityNames`: nested map of `entityType -> entityId -> localized name`
- `entityText`: nested map of `entityType -> entityId -> textPath -> localized text`

At runtime, enabled packs are resolved in priority order and locale maps are merged with later packs overriding earlier values. This keeps step titles and entity labels data-driven and language-pack based instead of hardcoded in the frontend.

`entityText` is the reusable long-term format because it supports rich content, not just names. Example paths:

- `name`
- `summary`
- `description`
- `data.racialTraits.0.name`
- `data.racialTraits.0.description`

## Locale generation workflow

Use the template generator to extract all translatable strings for a pack:

```bash
npm run locale:template -- --pack packs/srd-35e-minimal --locale zh --out packs/srd-35e-minimal/locales/zh.template.json
```

To preserve existing translations while filling missing keys from source data:

```bash
npm run locale:template -- --pack packs/srd-35e-minimal --locale zh --merge packs/srd-35e-minimal/locales/zh.template.json --out packs/srd-35e-minimal/locales/zh.template.json
```
