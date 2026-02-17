# MVP Scope

This document defines the minimal viable product boundaries for the DnDCharacterBuilder project. It ensures the team does not overbuild and focuses on essential functionality.

## Supported Edition

- **D&D 3.5 SRD** only.

## Supported Level

- **Level 1** character creation. No level‑up or multi‑class features are included in MVP.

## Flow Steps

1. **Version and Source selection** – only 3.5 available; base SRD pack locked.
2. **Race selection** – minimal set of races in `srd-35e-minimal`.
3. **Class selection** – minimal set of classes in `srd-35e-minimal`.
4. **Ability Score assignment** – either manual entry or 32‑point buy, method determined by flow JSON.
5. **Feat selection** – limited to feats provided in the minimal pack.
6. **Skill selection** – simplified 3.5 skill allocation: obey budget and max ranks.
7. **Equipment selection** – choose items from minimal pack; starting equipment mode recorded.
8. **Review & Export** – preview final character, derived stats and provenance; export JSON.

## What’s Out of Scope

- Multi‑level character progression.
- Multi‑class or prestige classes.
- Spells and advanced class features beyond level 1.
- Full 3.5 skill rules (synergy, cross‑class cost) – only basic budget enforcement.
- Rich hints, tooltips or AI guidance.
- Multi‑edition support (future tasks).
- PDF export (only JSON and HTML view for MVP).

## Success Metrics

- All steps read from JSON; no hardcoded lists.
- At least one race, class, feat, skill and item available.
- Wizard finishes without JavaScript errors.
- Export JSON is valid and includes pack fingerprint and provenance.

## TODO

- Define the exact point buy formula and manual entry range.
- Clarify which races and classes are included in the minimal pack.
- Define starting equipment modes and initial kits.
- Add success metrics for load performance and accessibility.

## Checklist

- [ ] Edition and level scope defined.
- [ ] MVP flow steps enumerated.
- [ ] Out‑of‑scope items listed.
- [ ] Success metrics listed.
- [ ] TODO items recorded.
