# Product Decisions

This document records important product decisions and the rationale behind them. Keeping track of decisions helps the team stay aligned and understand the evolution of the product.

## Decisions Recorded

### Data‑Driven Architecture

We decided to build the entire rule system and UI flows on a data‑driven architecture. Rule packs define entities and flows in JSON. The engine applies deterministic modifiers and records provenance. This allows new editions and house rules to be added without code changes.

**Rationale:** Scalability and maintainability across multiple editions; easier to audit and test.

### Edition Selection & Source Checklist

We chose to present a version selection page at the start of the wizard. Users can enable optional packs, but the base SRD pack is always locked on. This respects licensing requirements and ensures a consistent baseline.

**Rationale:** Allows future expansions and house rules to be toggled; informs the engine which packs to load.

### Race and Class Cards with Details

Races and classes will be shown as cards with images and short summaries. Users can click for full details. All UI metadata (summary, description, image) comes from JSON.

**Rationale:** Improves discoverability for new players and keeps the interface uncluttered.

### Two Ability Assignment Methods

The flow JSON can specify either manual entry or a point‑buy system. We start with 32‑point buy because it guides new players, but manual entry remains available in data.

**Rationale:** Balances guidance for beginners with flexibility for veterans.

### MCP-Based Data Services for Localization and Content Ingestion

We will treat localization and all large-scale data generation as responsibilities of external MCP servers rather than ad-hoc scripts inside the app. MCP services will:

- Extract and translate pack-localizable strings into `PackLocale` data using an official-terms glossary where available.
- Convert SRD-like structured datasets into our canonical pack format.
- In future, read rulebook sources (e.g. PDFs) to propose structured entities and flows.
- Detect mechanics that are not expressible in the current data model and propose schema and flow/review updates instead of hardcoding special cases.

**Rationale:** Keeps the core engine and UI purely data-driven, scales to large and user-uploaded datasets, and centralises complex automation and model evolution logic behind a deterministic service boundary.

## Pending Decisions (TODO)

- Determine whether to include racial ability adjustments in the point‑buy calculation or apply them separately.
- Decide the default starting equipment mode (kit vs gold) in 3.5.
- Decide how skill synergies and cross‑class costs will be handled post MVP.

## Checklist

- [x] Data‑driven architecture recorded.
- [x] Edition selection decision recorded.
- [x] Race/class UI decision recorded.
- [x] Ability method decision recorded.
- [x] MCP-based localization and data services decision recorded.
- [ ] Pending decisions listed.
- [ ] Future decisions to be updated here.
