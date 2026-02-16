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

export interface EntitySourceMetadata {
  packId: string;
  version: string;
}

export type ResolvedEntity = Entity & { _source: EntitySourceMetadata };

export interface ResolvedPackSet {
  orderedPackIds: string[];
  manifests: Manifest[];
  entities: Record<string, Record<string, ResolvedEntity>>;
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

function priorityComparator(a: LoadedPack, b: LoadedPack): number {
  if (a.manifest.priority !== b.manifest.priority) return a.manifest.priority - b.manifest.priority;
  return a.manifest.id.localeCompare(b.manifest.id);
}

function collectRequiredPackIds(byId: Map<string, LoadedPack>, enabledPackIds: string[]): Set<string> {
  const required = new Set<string>();
  const visiting = new Set<string>();

  const visit = (id: string): void => {
    if (required.has(id)) return;
    if (visiting.has(id)) throw new Error(`Dependency cycle detected at ${id}`);
    const pack = byId.get(id);
    if (!pack) throw new Error(`Missing dependency pack ${id}`);
    visiting.add(id);
    for (const dep of pack.manifest.dependencies) {
      visit(dep);
    }
    visiting.delete(id);
    required.add(id);
  };

  for (const enabledId of enabledPackIds) visit(enabledId);
  return required;
}

export function topoSortPacks(packs: LoadedPack[], enabledPackIds: string[]): LoadedPack[] {
  const byId = new Map(packs.map((pack) => [pack.manifest.id, pack]));
  const requiredPackIds = collectRequiredPackIds(byId, enabledPackIds);

  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const packId of requiredPackIds) {
    const pack = byId.get(packId);
    if (!pack) throw new Error(`Missing dependency pack ${packId}`);
    indegree.set(packId, 0);
    dependents.set(packId, []);
  }

  for (const packId of requiredPackIds) {
    const pack = byId.get(packId);
    if (!pack) throw new Error(`Missing dependency pack ${packId}`);
    for (const dep of pack.manifest.dependencies) {
      if (!requiredPackIds.has(dep)) continue;
      indegree.set(packId, (indegree.get(packId) ?? 0) + 1);
      dependents.get(dep)?.push(packId);
    }
  }

  const queue = Array.from(requiredPackIds)
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .map((id) => byId.get(id)!)
    .sort(priorityComparator);

  const sorted: LoadedPack[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const dependentId of dependents.get(current.manifest.id) ?? []) {
      const nextIndegree = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, nextIndegree);
      if (nextIndegree === 0) {
        const dependent = byId.get(dependentId);
        if (!dependent) throw new Error(`Missing dependency pack ${dependentId}`);
        queue.push(dependent);
        queue.sort(priorityComparator);
      }
    }
  }

  if (sorted.length !== requiredPackIds.size) {
    const unresolved = Array.from(requiredPackIds).filter((id) => !sorted.some((pack) => pack.manifest.id === id));
    throw new Error(`Dependency cycle detected among packs: ${unresolved.join(", ")}`);
  }

  return sorted;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`);

  return `{${entries.join(",")}}`;
}

export function resolveLoadedPacks(loaded: LoadedPack[], enabledPackIds: string[]): ResolvedPackSet {
  const sorted = topoSortPacks(loaded, enabledPackIds);

  const entities: Record<string, Record<string, ResolvedEntity>> = {};
  let flow: Flow | undefined;

  for (const pack of sorted) {
    for (const [entityType, list] of Object.entries(pack.entities)) {
      entities[entityType] ??= {};
      for (const entity of list) {
        entities[entityType][entity.id] = {
          ...entity,
          entityType,
          _source: { packId: pack.manifest.id, version: pack.manifest.version }
        };
      }
    }
    for (const patch of pack.patches) {
      if (patch.op === "mergeEntity") {
        const entityBucket = entities[patch.entityType];
        const prev = entityBucket?.[patch.id];
        if (entityBucket && prev) {
          entityBucket[patch.id] = {
            ...prev,
            ...patch.value,
            _source: { packId: pack.manifest.id, version: pack.manifest.version }
          };
        }
      }
    }
    flow = pack.flow;
  }

  if (!flow) throw new Error("No flow found for enabled packs");

  const fingerprint = crypto
    .createHash("sha256")
    .update(
      stableSerialize({
        packs: sorted.map((pack) => ({ id: pack.manifest.id, version: pack.manifest.version, priority: pack.manifest.priority })),
        entities,
        flow
      })
    )
    .digest("hex");

  return {
    orderedPackIds: sorted.map((pack) => pack.manifest.id),
    manifests: sorted.map((pack) => pack.manifest),
    entities,
    flow,
    fingerprint
  };
}

export function resolvePackSet(allPacksRoot: string, enabledPackIds: string[]): ResolvedPackSet {
  const packDirs = fs
    .readdirSync(allPacksRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(allPacksRoot, dirent.name));
  const loaded = packDirs.map(loadPack);
  return resolveLoadedPacks(loaded, enabledPackIds);
}
