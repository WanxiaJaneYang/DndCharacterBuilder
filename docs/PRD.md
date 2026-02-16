# PRD — Data-Driven D&D Character Builder (Web)

**Version:** v0.1 (MVP: D&D 3.5 SRD)  
**Status:** Draft  
**Owner:** Product/Engineering  
**Last updated:** 2026-02-16

---

## 1) Problem statement

Creating a D&D character is intimidating for newcomers: too many unfamiliar terms, too many choices, and many hidden constraints. Existing builders often assume rules knowledge or hardcode a single edition flow. We need a **beginner-first, edition-aware wizard** where:

- Users can pick a **rules version** and **rule sources** (base book + optional expansions).
- The wizard renders a **checklist / guided flow** that changes by edition and enabled sources.
- Each step provides **short explanations** and a **“view details”** panel for full descriptions (richer hints can come later).
- All content must be **JSON-configurable** to support future expansions without rewriting UI logic.

---

## 2) Target users

### Primary: New players (no D&D knowledge)
**Needs**
- Clear step-by-step guidance
- “What is this?” explanations in plain language
- Only legal options shown, with constraints handled automatically
- Confidence the character is complete and playable

### Secondary: Returning/casual players
**Needs**
- Fast creation with minimal clicks
- Easy revision of choices with immediate stat recalculation
- Exportable sheet to use during play

### Tertiary: DM / table admin (later)
**Needs (future)**
- Enable/disable expansions
- House rule packs
- Shared templates for a campaign

---

## 3) MVP scope (D&D 3.5 SRD only)

### In scope (MVP)
- Web wizard for **Level 1** character creation.
- Edition selection UI exists, but **only 3.5** is enabled in MVP.
- Sources selection UI:
  - Base source (PHB/SRD) is **selected by default** and **cannot be unselected**.
  - Optional sources are displayed (if available) and can be toggled on/off (MVP: can be empty or disabled).
- Flow-driven wizard based on JSON.
- Output:
  - **Export JSON** character sheet (includes pack set + fingerprint)
  - Clean HTML “sheet view” (PDF export later)

### Out of scope (MVP)
- AI assistant
- Account system / cloud sync
- Non-SRD copyrighted rulebook content
- PDF scraping from the internet

---

## 4) Product principles

1) **Edition-aware flow:** wizard steps are configured by JSON per rules version.  
2) **Data-driven UI:** races/classes/feats/items/skills are defined in JSON, including image + summary + details text.  
3) **Validity by construction:** show only legal options; block “Next” when requirements aren’t met.  
4) **Transparent math:** derived stats show provenance (“why”).  
5) **Reproducible results:** export includes enabled pack IDs + versions + fingerprint hash.

---

## 5) User experience (UX) flow

### 5.1 Rules setup: version + sources (first screen)

**Goal:** select edition and sources; render the flow checklist.

**UI**
- Version selector (dropdown/cards)
  - MVP: only “D&D 3.5 (SRD)” enabled
- Sources checklist:
  - Base (PHB/SRD) locked ON
  - Optional expansions listed if found in local packs (future: discoverable)
- Checklist panel: shows upcoming steps from resolved flow JSON (read-only)

**Acceptance criteria**
- Base source cannot be deselected.
- Selecting version + sources resolves a flow and shows its checklist.
- Continue enters step 1 of the flow.

---

### 5.2 Race step (card grid)

**UI**
- Cards: image + race name + short explanation
- “View details” opens full description (traits, bonuses, notes)
- Select exactly 1 (unless flow says otherwise)

**Acceptance criteria**
- Race list is driven from JSON pack entities.
- Details content comes from JSON (not hardcoded).
- Selection updates derived stats and validation state.

---

### 5.3 Class step (card grid)

Same interaction pattern as race.

**Acceptance criteria**
- Class list is driven from pack entities JSON.
- Details content comes from JSON.
- Class selection affects derived stats (BAB, saves, hp, proficiencies, etc.).

---

### 5.4 Ability scores step

MVP method should be **configurable by flow**. Suggested default for beginners: **32 point-buy**.

**UI**
- Choose method (if flow provides multiple), or single method (MVP)
- For point-buy: UI shows remaining points and constraints
- Show short explanations of STR/DEX/CON/INT/WIS/CHA (richer hints later)

**Acceptance criteria**
- Validates method rules (e.g., point budget).
- Updates ability modifiers live.
- Errors are displayed clearly.

---

### 5.5 Feats step

**UI**
- Cards or list: name + short summary + details
- Filtered by prerequisites (BAB, ability, other feats, etc.)
- Show selection count and remaining picks

**Acceptance criteria**
- Only legal feats are selectable.
- Clear validation errors if prerequisites not met.

---

### 5.6 Skills step

**UI**
- Skills list with points allocation UI
- Show remaining points
- Apply edition-specific rules (3.5): class vs cross-class costs and max ranks (MVP can start simplified but must be explicit)

**Acceptance criteria**
- Prevent overspending points.
- Enforce max ranks rules (at least basic).

---

### 5.7 Equipment steps (weapon/armor + other items)

**UI**
- Weapon & armor selection (cards/list with stats)
- Other gear list (optional)
- (MVP) starting gold rules can be simplified if documented

**Acceptance criteria**
- Equipping armor/shield updates AC and speed penalties if applicable.
- Attack bonus/damage updates for chosen weapon.

---

### 5.8 Review + export

**UI**
- Summary of selections
- Key derived stats
- Provenance view: expand any stat to see contributing modifiers and sources
- Export button: downloads JSON

**Acceptance criteria**
- Export JSON includes:
  - version
  - enabled packs (id+version)
  - pack fingerprint hash
  - final derived sheet
  - provenance entries

---

## 6) Edition variability (future requirement)

Different editions have different required steps and entity types. Example: **5r (2024)** includes background feats (出身专长), while **3.5** does not.

**Requirement:** the wizard flow must be defined by JSON per edition and modified by enabled packs.

- Packs may add/replace steps
- Packs may add new entity types and step renderers
- The app should not contain edition-specific branching logic beyond rendering supported step types

---

## 7) Data-driven system requirements

### 7.1 Data packs

A pack is a versioned bundle of JSON files.

**Pack folder**
- `manifest.json`: id, name, version, dependencies, priority, compatible engine range (optional)
- `entities/*.json`: races, classes, feats, items, skills, rules
- `flows/*.json`: wizard step definitions
- `patches/*.json` (optional): overrides

**MVP:** packs are local under `/packs`.

### 7.2 Entity requirements (rules + UI metadata)

Each entity should include:

- `id` (stable unique id)
- `name`
- `summary` (short explanation for cards)
- `description` (full details text)
- `image` (path/url)
- `prerequisites` (if applicable)
- `effects/modifiers` (structured DSL; no eval)

### 7.3 Engine interfaces (stable contract)

The UI interacts with the engine only through:

- `listChoices(state, ctx) -> Choice[]`
- `applyChoice(state, choiceId, selection) -> state`
- `validateState(state, ctx) -> errors[]`
- `finalizeCharacter(state, ctx) -> sheet + provenance`

State stores **only selections**; derived stats are computed.

---

## 8) Functional requirements (MVP)

- FR1: version & sources selection
- FR2: flow-driven step checklist and navigation
- FR3: race selection (cards + details)
- FR4: class selection (cards + details)
- FR5: ability score assignment (configured method)
- FR6: feat selection with prerequisites
- FR7: skills allocation with validation
- FR8: equipment selection affecting derived stats
- FR9: review + provenance + export JSON

---

## 9) Non-functional requirements

- Deterministic: same inputs + same pack set => same output
- Offline-first (MVP should run without network)
- Maintainable boundaries: engine pure, packs are data, UI renders flow
- Testable: unit tests + pack contract tests + CI green

---

## 10) Success metrics (MVP)

- A brand-new player can create a Level 1 3.5 character in under 5 minutes.
- Wizard steps and entity content are fully JSON-driven.
- Derived stats show provenance for key fields (AC, saves, attack bonus, damage, ability mods).
- CI passes on every PR: typecheck + unit + contracts.

---

## 11) Milestones

### M1 — Data-driven foundation
- Pack loader + schema validation
- Minimal 3.5 SRD pack
- Engine finalize + provenance (core stats)
- Flow-driven wizard skeleton

### M2 — MVP completeness
- Ability score method implemented
- Feats + skills + equipment steps implemented
- Export JSON + HTML view

### M3 — Multi-edition readiness (future)
- Flow extension/override hardened
- Placeholder 5r flow skeleton (steps only)

---

## 12) Open questions (defer decisions but record them)

- Ability score method default: point buy vs manual vs rolling (MVP can start with one method; keep flow-configurable)
- Skills rules depth in 3.5:
  - MVP (Level 1 creation): implement enough to prevent overspending and enforce basic max ranks
  - Post-creation leveling: after a Level 1 character is created, allow the user to add levels; at each level-up, allow cross-class skill investments as permitted by the rules and enabled packs
- Starting equipment rules: must be selectable (flow-configurable), e.g. “starting gold” vs “class kit/default loadout”; document which mode is active for a character export
- Localization: CN/EN strategy for entity text and UI strings
