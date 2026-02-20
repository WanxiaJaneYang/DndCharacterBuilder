# Race Parity Checklist (PHB 3.5 Core Races)

Status legend:
- `encoded`: present in `packs/srd-35e-minimal/entities/races.json`
- `structured`: has a dedicated schema field (not text-only)
- `runtime`: currently applied by engine
- `pending`: not yet structured and/or not yet runtime-applied

## Human
- [x] Size / base speed (`encoded`, `structured`, `runtime`)
- [x] Bonus feat (`encoded`, `runtime`)
- [x] Extra skill points (`encoded`, `runtime`)
- [ ] Favored-class multiclass rule (`encoded`, `runtime`) - verify full XP penalty system in later step

## Dwarf
- [x] Ability modifiers / speed / darkvision / languages / favored class (`encoded`, `structured`)
- [x] Save bonuses vs poison and spells (`encoded`, `structured`)
- [x] Movement exception (no speed reduction in medium/heavy armor) (`structured`)
- [ ] Stonecunning mechanics beyond text (`pending`)
- [ ] Stability mechanics beyond text (`pending`)
- [ ] Weapon familiarity mechanics beyond text (`pending`)

## Elf
- [x] Ability modifiers / low-light vision / languages / favored class (`encoded`, `structured`)
- [x] Save bonus vs enchantments (`encoded`, `structured`)
- [x] Listen/Search/Spot bonuses (`encoded`, `structured`, `runtime`)
- [ ] Sleep immunity represented as machine rule (`pending`)
- [ ] Secret-door detection by proximity (`pending`)
- [ ] Weapon proficiency package from race (`pending`)

## Gnome
- [x] Ability modifiers / speed / darkvision / languages / favored class (`encoded`, `structured`)
- [x] Attack/save/skill bonuses + SLA list (`encoded`, `structured`)
- [x] Small-size derived modifiers represented structurally (`structured`)
- [x] Spell DC bonuses for illusion school (`structured`)
- [ ] Creature-type conditional bonuses fully runtime-applied (`pending`)

## Half-Elf
- [x] Core fields + diplomacy/gather-info/listen/search/spot bonuses (`encoded`, `structured`)
- [x] Elven-blood race tag semantics as first-class data (`structured`)
- [ ] Sleep immunity as machine rule (`pending`)

## Half-Orc
- [x] Core fields (`encoded`, `structured`)
- [x] Orc-blood race tag semantics as first-class data (`encoded`, `structured`)
- [ ] Intelligence floor edge rule (`pending`)

## Halfling
- [x] Core fields + bonuses (`encoded`, `structured`)
- [x] Small-size derived modifiers represented structurally (`structured`)
- [ ] Thrown/sling and fear bonuses runtime-applied (`pending`)

