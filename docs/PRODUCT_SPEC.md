# Product Spec — Data-Driven D&D Character Builder (Web)

**Doc version:** v0.2 (extends PRD v0.1)  
**Scope:** Product + UX + UI handoff + data model (MVP = D&D 3.5 SRD)  
**Audience:** Product, designers, engineers

This document **complements** `docs/PRD.md`. PRD defines *what* to build; this spec defines *how it should feel*, *how UI is structured for Figma handoff*, and *what data schemas must exist* to keep the product data-driven across editions.

---

## 1) Product goals

### 1.1 MVP goal
A complete beginner can create a **Level 1** D&D 3.5 SRD character using a guided wizard, without knowing the rules.

### 1.2 Architecture goal
All content and the wizard flow are **JSON-configurable** (packs + flows). UI renders from data; engine computes deterministically and outputs provenance.

### 1.3 Future goal
Support multiple editions (e.g., 5r/2024) where steps differ (e.g., Background Feat ). Edition differences must be represented in **flow + schema**, not hardcoded UI branching.

---

## 2) Users & jobs-to-be-done

### New player (primary)
- **Job:** “Help me create a playable character without reading the rulebook.”
- Needs: plain-language hints, safe defaults, no dead-ends, validation that blocks illegal builds.

### Returning player (secondary)
- **Job:** “Let me make a character quickly, and edit choices easily.”
- Needs: fast browsing, quick comparisons, undo/back, export.

### DM/admin (future)
- **Job:** “Enable/disable allowed sources, enforce campaign rules.”
- Needs: pack selection, pack presets, auditability.

---

## 3) MVP scope definition

### In scope (MVP)
- Edition selection UI exists, but only **3.5** enabled.
- Source selection UI exists:
  - Base pack locked ON (SRD/PHB-equivalent)
  - Optional packs list rendered (can be empty in MVP).
- Wizard steps (3.5 default flow):
  1. Rules setup (version + sources)
  2. Race
  3. Class
  4. Ability scores (flow-configurable method; MVP can ship one method)
  5. Feats
  6. Skills (basic budget + basic max ranks)
  7. Weapon & armor
  8. Other gear
  9. Review + export
- Output JSON includes version + enabled packs + fingerprint + selections + derived stats + provenance + equipment mode.

### Explicitly out of scope (MVP)
- AI assistant
- Online PDF scraping
- Accounts/cloud sync
- Full SRD coverage (we can keep minimal seed data)

### Post-MVP commitments (planned)
- Level-up after Level 1: user can add levels; cross-class skill investment is permitted at level-up where rules apply.
- Starting equipment rule **mode is selectable** (kit vs gold); MVP may only fully implement “kit”, but mode is persisted.

---

## 4) UX behavior requirements (no visuals yet)

### 4.1 Global wizard behavior
- **Back/Next navigation** always available (except on first step).
- **Step checklist** visible (current step highlighted).
- **Validation gating:** Next is disabled if the current step has blocking errors.
- **Editability:** user can go back to earlier steps; later derived stats recalculate.
- **Consistency:** the wizard never shows illegal options; if an option becomes invalid due to edits, the UI must prompt the user to resolve it.

### 4.2 Rules setup step
- User selects: `edition` + `sources`.
- Base source is locked on.
- Show “What this affects” helper text:
  - “Your edition determines the steps and available rules.”
  - “Sources add optional races/classes/feats/items.”
- After selection, show resolved flow checklist (read-only preview).

### 4.3 Browsing steps (race/class/feat/item)
- Show **cards**:
  - image placeholder
  - name
  - short summary
  - quick “Key effects” chips (optional)
- “View details” opens modal/drawer:
  - full description
  - mechanical traits (structured)
  - prerequisites (if any)
- Provide filters (later): role, complexity, theme, etc.

### 4.4 Ability scores
- Method must be **flow-configurable**.
- MVP can ship:
  - Point Buy 32 (recommended for beginners), OR
  - Manual entry (quickest for engineering)
- UI must show:
  - remaining points/budget (if point buy)
  - live modifiers (+2/-1 etc.)
  - minimal “what does this do” tooltip per ability

### 4.5 Skills
- Must prevent overspend.
- Must show remaining points.
- Must enforce basic max ranks (MVP rule).
- Level-up design (future): allocate skill points per level step, allow cross-class.

### 4.6 Starting equipment mode
- User selects mode: **kit** vs **gold**.
- Mode is stored and shown in Review.
- MVP implementation guidance:
  - implement “kit” with predefined loadouts first
  - “gold shopping” can be placeholder but mode must exist

### 4.7 Review + export
- Show summary of choices + key derived stats.
- **Provenance panel** for core numbers (AC, attack bonus, damage, saves, initiative, HP).
- Export JSON includes pack fingerprint and provenance.

---

## 5) Product constraints
- SRD/OGL-compatible content only.
- No network dependency in normal operation.
- All edition differences expressed via packs/flows.

---

## 6) Deliverables checklist (docs + design + build)
- [ ] `docs/UX_JOURNEY.md` (detailed journey + edge cases)
- [ ] `docs/UI_SPEC.md` (component map + states + content rules)
- [ ] `docs/FIGMA_HANDOFF.md` (token + component naming + dev handoff)
- [ ] `docs/DATA_SCHEMA.md` (schemas + examples)
- [ ] `docs/FLOW_SCHEMA.md` (flow step types + examples per edition)
- [ ] `docs/WORK_PLAN.md` (agentic execution tracker + progress log format)
