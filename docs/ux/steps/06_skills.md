# UX Step 06 - Skill Selection

This document covers the **Skill聽selection** step in the wizard.  Skills represent learned abilities like Diplomacy, Stealth or Knowledge.  In D&D聽3.5, the number of skill points available and the maximum ranks per skill depend on class, Intelligence modifier and level.

## Goal

Allow the user to allocate skill points to various skills while respecting the budget and per鈥憇kill maximums.  Provide clarity on class skills vs cross鈥慶lass skills, and show live updates of ranks and modifiers.

## User Intent

- **New聽Player:** Needs to understand how many skill points they have and what each skill does.  Should be prevented from overspending or violating rank limits.
- **Returning聽Player:** May know how many points they have and which skills they want; needs quick allocation and ability to see the resulting modifiers.

## Layout & Interaction

The skills step uses a **table or list** with adjustable ranks:

- Each skill row shows:
  - Skill name.
  - Class skill indicator (yes/no; class skills cost 1聽point per rank; cross鈥慶lass skills cost 2聽points per rank and maximum rank is half the level + 3).
  - Description (accessible via tooltip or details view).
  - Current ranks (number input or up/down controls).
  - Modifier (ability modifier + ranks).
- Above the table, display the total skill points available and points remaining.
- When the user adjusts ranks, update the points remaining and highlight if overspent.
- Validation must ensure:
  - Total spent points 鈮?budget.
  - Ranks for class skills 鈮?level + 3 (for level聽1, max聽=聽4); ranks for cross鈥慶lass skills 鈮?(level + 3)/2 (for level聽1, max聽=聽2).

For MVP we simplify: treat all skills as class skills or allow cross鈥慶lass ranks but enforce the 1鈥憄oint cost per rank.  The exact rules should be defined in the engine and data spec.

## Data Requirements

From `entities/skills.json` the UI uses:

- `id` 鈥?stable skill identifier.
- `name` 鈥?display name.
- `description` 鈥?description or summary for tooltip.
- `ability` 鈥?which ability modifier applies (e.g. Dexterity for Stealth).
- `class_skills` 鈥?list of classes for which the skill is considered a class skill (optional; can be part of class definition instead).

The engine must know:
- Total skill points available at level聽1 = (class skill points + Int modifier) 脳 4.
- Which skills are class skills for the selected class.
- How many ranks cost 1聽point vs 2聽points.

## Validation & Gating

- Spend 鈮?available points.
- Max ranks per skill obey level + 3 (class) or (level + 3)/2 (cross鈥慶lass).  For MVP we may treat all skills as having a simple max.
- No negative ranks or fractional points.
- The user cannot proceed until all points are assigned or left intentionally unused; if unused points remain, warn the user.

## Acceptance Criteria

- Skills list is generated from JSON; no hardcoded skills.
- Users can allocate skill points within the allowed budget and per鈥憇kill limits.
- Points remaining updates live and prevents overspend.
- The engine stores the selected ranks and uses them to compute derived modifiers.
- The 鈥淣ext鈥?button is disabled until validation passes.

## TODO

- Define the skill schema to include class skill information and ability associations.
- Decide whether to implement simplified skill rules for MVP (e.g. equal cost for all skills).
- Implement the skill table UI with live updates and validation.
- Create tests for skill point calculation and validation logic.

## Checklist

- [ ] Skill schema fields defined and populated.
- [ ] UI allows allocating skill points and shows points remaining.
- [ ] Validation enforces budget and per鈥憇kill maximums.
- [ ] Engine computes modifiers using ability scores and ranks.
- [ ] Tests cover point calculation and gating logic.
