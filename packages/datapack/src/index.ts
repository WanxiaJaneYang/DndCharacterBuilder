import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { FlowSchema, ManifestSchema, type Entity, type Flow, type Manifest } from "@dcb/schema";

export interface LoadedPack {
  manifest: Manifest;
  entities: Record<string, Entity[]>;
  flow: Flow;
  patches: Array<{ op: "mergeEntity"; entityType: string; id: string; value: Partial<Entity> }>;
  packPath: string;
}

export interface ResolvedPackSet {
  orderedPackIds: string[];
  manifests: Manifest[];
  entities: Record<string, Record<string, Entity>>;
  flow: Flow;
  fingerprint: string;
}

const ENTITY_FILES = ["races", "classes", "feats", "items", "skills", "rules"];

export function loadPack(packPath: string): LoadedPack {
  const manifest = ManifestSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "manifest.json"), "utf8")));
  const entities: Record<string, Entity[]> = {};

  for (const entityFile of ENTITY_FILES) {
    const filePath = path.join(packPath, "entities", `${entityFile}.json`);
    const list = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
    entities[entityFile] = list;
  }

  const flow = FlowSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "flows", "character-creation.flow.json"), "utf8")));

  const patchesDir = path.join(packPath, "patches");
  const patchFiles = fs.existsSync(patchesDir) ? fs.readdirSync(patchesDir).filter((f) => f.endsWith(".json")) : [];
  const patches = patchFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(patchesDir, file), "utf8")));

  return { manifest, entities, flow, patches, packPath };
}

export function topoSortPacks(packs: LoadedPack[], enabledPackIds: string[]): LoadedPack[] {
  const byId = new Map(packs.map((p) => [p.manifest.id, p]));
  const enabled = new Set(enabledPackIds);
  const sorted: LoadedPack[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (!enabled.has(id)) return;
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Dependency cycle detected at ${id}`);
    const pack = byId.get(id);
    if (!pack) throw new Error(`Missing dependency pack ${id}`);
    visiting.add(id);
    for (const dep of pack.manifest.dependencies) visit(dep);
    visiting.delete(id);
    visited.add(id);
    sorted.push(pack);
  };

  for (const id of enabledPackIds) visit(id);

  return sorted.sort((a, b) => a.manifest.priority - b.manifest.priority);
}

export function resolveLoadedPacks(loaded: LoadedPack[], enabledPackIds: string[]): ResolvedPackSet {
  const sorted = topoSortPacks(loaded, enabledPackIds);

  const entities: Record<string, Record<string, Entity>> = {};
  let flow: Flow | undefined;

  for (const pack of sorted) {
    for (const [entityType, list] of Object.entries(pack.entities)) {
      entities[entityType] ??= {};
      for (const entity of list) {
        entities[entityType][entity.id] = { ...entity, entityType };
      }
    }
    for (const patch of pack.patches) {
      if (patch.op === "mergeEntity") {
        const prev = entities[patch.entityType]?.[patch.id];
        if (prev) {
          entities[patch.entityType][patch.id] = { ...prev, ...patch.value };
        }
      }
    }
    flow = pack.flow;
  }

  if (!flow) throw new Error("No flow found for enabled packs");

  const fingerprint = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        packs: sorted.map((p) => ({ id: p.manifest.id, version: p.manifest.version, priority: p.manifest.priority })),
        entities,
        flow
      })
    )
    .digest("hex");

  return {
    orderedPackIds: sorted.map((p) => p.manifest.id),
    manifests: sorted.map((p) => p.manifest),
    entities,
    flow,
    fingerprint
  };
}


export function resolvePackSet(allPacksRoot: string, enabledPackIds: string[]): ResolvedPackSet {
  const packDirs = fs
    .readdirSync(allPacksRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(allPacksRoot, d.name));
  const loaded = packDirs.map(loadPack);
  return resolveLoadedPacks(loaded, enabledPackIds);
}
