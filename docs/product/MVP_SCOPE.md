# MVP Scope

This document defines the minimal viable product boundaries for the DnDCharacterBuilder project. It keeps the team focused on essential functionality and helps prevent backlog drift from turning into accidental scope creep.

## Supported Edition

- **D&D 3.5 SRD** only.

## Supported Level

- **Level 1** character creation only. No level-up or multiclass progression is part of the MVP delivery.

## Flow Steps

1. **Version and Source selection**: only 3.5 is available in MVP; the base SRD pack is locked.
2. **Race selection**: minimal set of races in `srd-35e-minimal`.
3. **Class selection**: minimal set of classes in `srd-35e-minimal`.
4. **Ability Score assignment**: data-driven by flow JSON and edition pack config.
   - Point Buy (with configurable point-cap bounds)
   - PHB method
   - Roll Sets (generate 5 sets, pick one)
5. **Feat selection**: limited to feats provided in the minimal pack.
6. **Skill selection**: level-1 3.5 skill allocation with budget and max-rank enforcement.
   - Current implementation also covers class vs cross-class costs and level-1 max-rank enforcement.
7. **Equipment selection**: choose items from the minimal pack; starting equipment mode remains a follow-up.
8. **Review and Export**: preview final character, derived stats, unresolved rules, and provenance; export JSON.

## What Is Out of Scope

- Multi-level character progression.
- Multiclass or prestige-class progression.
- Spells and advanced class features beyond level 1.
- Full 3.5 skill-system coverage beyond level 1, including synergy, trained-only edge cases, and multiclass progression rules.
- Rich hints, tooltips, or AI guidance.
- Full custom point-buy table authoring and saved custom templates.
- PDF export.

## Success Metrics

- All steps read from JSON; no hardcoded lists remain.
- At least one race, class, feat, skill, and item path is fully playable.
- Wizard finishes without JavaScript errors.
- Export JSON is valid and includes pack fingerprint and provenance.

## TODO

- Define 3e and 5e default `abilitiesConfig` payloads in pack data.
- Clarify which races and classes are included in the minimal pack.
- Define starting equipment modes and initial kits.
- Add success metrics for load performance and accessibility.

## Checklist

- [ ] Edition and level scope defined.
- [ ] MVP flow steps enumerated.
- [ ] Out-of-scope items listed.
- [ ] Success metrics listed.
- [ ] TODO items recorded.
