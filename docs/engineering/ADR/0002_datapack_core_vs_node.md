# ADR 0002: Split Datapack into Core and Node Modules

## Status

Proposed

## Context

The `datapack` package currently contains both **pure functions** (e.g. pack merging, topological sort of dependencies) and **Node‑specific code** for loading packs from the file system (`fs`, `path`, `crypto`).  This mixing complicates bundling for browser environments and increases the risk that UI code accidentally imports Node modules.  Additionally, bundlers may fail when encountering built‑in Node modules in a browser context.

## Decision

Split the `datapack` package into two separate modules:

1. **`datapack-core`:**  Contains pure, framework‑agnostic functions.  Exposes:
   - Type definitions for loaded and resolved packs.
   - `topoSortPacks`, `resolveLoadedPacks`, `mergeEntities`, `stableSerialize`, `fingerprintPackSet` (pure hashing).
   - No Node built‑ins or side effects.

2. **`datapack-node`:**  Contains Node‑specific functions for reading packs from the file system.  Exposes:
   - `loadPackFromDisk`, `resolvePackSet` (which uses `fs` and `path`).
   - Functions to read JSON files and compute file hashes.
   - Depends on `datapack-core` for merging and resolving.

The root `datapack` package will re‑export `datapack-core` by default for browser environments and provide a `node` entry point for Node usage via `package.json` exports.

## Rationale

1. **Separation of Concerns:**  The pure logic can be used in browser and server contexts alike without dragging in Node dependencies.  Node code remains where it belongs.
2. **Bundle Safety:**  Browser bundlers (e.g. Vite) will not include Node built‑ins when only `datapack-core` is imported.  This prevents runtime errors in the browser.
3. **Developer Clarity:**  Developers can see at a glance which functions are safe for the browser and which require Node.  The package exports clarify usage.
4. **Future Flexibility:**  Additional environments (e.g. Deno or Web Workers) can implement their own loaders on top of `datapack-core` without modification.

## Consequences

1. **Refactoring Required:**  We must move functions into the appropriate module and update import paths in the app and tests.
2. **Updated Package Configuration:**  `package.json` will need exports fields to direct bundlers to the correct entry points.
3. **Slight Complexity:**  Two packages instead of one may add some overhead, but the benefits outweigh the complexity.

## Alternatives Considered

**Single Package with Conditional Imports:**  We could keep one package and rely on conditional `require()` or dynamic imports to load Node functionality only when available.  However, this is brittle and confuses tree shaking.

**Ignore Browser Compatibility:**  Continue mixing Node code and rely on bundler configuration to shim built‑ins.  This pushes complexity onto the build tool and may still cause runtime issues.

## TODO

- Extract pure functions to a new `datapack-core` package and update imports in engine and UI.
- Move file system loaders to `datapack-node` and import them only in tests and CLI scripts.
- Configure `package.json` exports fields accordingly.
- Update tests to import the correct modules.
- Document usage in engineering README.

## References

- See the original `datapack` implementation for context.
- `docs/architecture.md` in the original monorepo for further discussion.