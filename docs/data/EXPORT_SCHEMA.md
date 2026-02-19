# Export Schema (Character Sheet JSON)

This document defines the target JSON model for final character-sheet export.

## Current Status

The engine currently exports a deterministic sheet with:
- metadata/name
- abilities (score/mod)
- base stats map
- selections
- skills breakdown
- decision summary
- provenance
- pack fingerprint

The sections below define the phased target model needed for SRD-style parity.

## Phase 1 Target (Core Playability)

```json
{
  "metadata": {
    "name": "Aric",
    "alignment": "neutral-good",
    "level": 1,
    "xp": 0
  },
  "identity": {
    "raceId": "human",
    "classId": "fighter-1",
    "size": "medium",
    "speed": {
      "base": 30,
      "adjusted": 30
    }
  },
  "abilities": {
    "str": { "score": 16, "mod": 3 }
  },
  "combat": {
    "ac": {
      "total": 18,
      "touch": 11,
      "flatFooted": 17,
      "breakdown": {
        "armor": 6,
        "shield": 2,
        "dex": 1,
        "size": 0,
        "natural": 0,
        "deflection": 0,
        "misc": 0
      }
    },
    "initiative": { "total": 1, "dex": 1, "misc": 0 },
    "grapple": { "total": 4, "bab": 1, "str": 3, "size": 0, "misc": 0 },
    "attacks": {
      "melee": [
        {
          "itemId": "longsword",
          "name": "Longsword",
          "attackBonus": 4,
          "damage": "1d8+3",
          "crit": "19-20/x2"
        }
      ],
      "ranged": []
    },
    "saves": {
      "fort": { "total": 4, "base": 2, "ability": 2, "misc": 0 },
      "ref": { "total": 1, "base": 0, "ability": 1, "misc": 0 },
      "will": { "total": 0, "base": 0, "ability": 0, "misc": 0 }
    },
    "hp": {
      "total": 12,
      "breakdown": {
        "hitDie": 10,
        "con": 2,
        "misc": 0
      }
    }
  }
}
```

## Phase 2 Target (Non-caster completeness)

Add:
- `traits`: racial traits and passive senses/resistances summary.
- `feats`: selected feats with short effect summary.
- `skills[*].misc`: explicit misc modifier channel.
- `equipment`: equipped slots, carry weight, load category, speed impact.
- `movement`: detailed movement modes when present.

## Phase 3 Target (Caster + progression)

Add:
- `classes[]`: multiclass breakdown with per-class levels.
- `spellcasting[]`: class-specific caster level, spell ability, DC basis, spells/day and known/prepared data.
- `defenses`: expanded resistances/immunities and conditional notes.

## Constraints

- Export must remain deterministic for identical input state + enabled packs.
- Every derived number should be explainable by provenance records.
- Keys must be stable to avoid downstream parser breakage.
