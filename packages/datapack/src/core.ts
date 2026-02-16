import { type Entity, type Flow, type Manifest } from "@dcb/schema";

export interface LoadedPack {
  manifest: Manifest;
  entities: Record<string, Entity[]>;
  flow: Flow;
  patches: Array<{ op: "mergeEntity"; entityType: string; id: string; value: Partial<Entity> }>;
  packPath: string;
}

export interface EntitySourceMetadata {
  packId: string;
  entityId: string;
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

export function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`);

  return `{${entries.join(",")}}`;
}

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function getDefined(values: ReadonlyArray<number> | Uint32Array, index: number, label: string): number {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`Out-of-range ${label} index: ${index}`);
  }
  return value;
}

function sha256Hex(input: string): string {
  const h: [number, number, number, number, number, number, number, number] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ] as const;

  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;

  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let t = 0; t < 16; t += 1) {
      w[t] = view.getUint32(offset + t * 4, false);
    }

    for (let t = 16; t < 64; t += 1) {
      const w15 = getDefined(w, t - 15, "message schedule");
      const w2 = getDefined(w, t - 2, "message schedule");
      const w16 = getDefined(w, t - 16, "message schedule");
      const w7 = getDefined(w, t - 7, "message schedule");
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[t] = (((w16 + s0) | 0) + ((w7 + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;

    for (let t = 0; t < 64; t += 1) {
      const kt = getDefined(k, t, "round constant");
      const wt = getDefined(w, t, "message schedule");
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((hh + s1) | 0) + ((ch + kt) | 0)) | 0) + wt) | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }

  return h.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
}

export function fingerprintStableValue(value: unknown): string {
  return sha256Hex(stableSerialize(value));
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
          _source: { packId: pack.manifest.id, entityId: entity.id, version: pack.manifest.version }
        };
      }
    }
    for (const patch of pack.patches) {
      if (patch.op === "mergeEntity") {
        const entityBucket = entities[patch.entityType];
        const prev = entityBucket?.[patch.id];
        if (entityBucket && prev) {
          // Note: Spread operation assumes patch.value properties are defined.
          // A more robust implementation would filter out undefined values or validate patches.
          entityBucket[patch.id] = {
            ...prev,
            ...patch.value,
            _source: { packId: pack.manifest.id, entityId: patch.id, version: pack.manifest.version }
          } as ResolvedEntity;
        }
      }
    }
    flow = pack.flow;
  }

  if (!flow) throw new Error("No flow found while resolving packs");

  const fingerprintPayload = {
    orderedPackIds: sorted.map((p) => p.manifest.id),
    entities,
    flow
  };

  const fingerprint = fingerprintStableValue(fingerprintPayload);

  return {
    orderedPackIds: sorted.map((p) => p.manifest.id),
    manifests: sorted.map((p) => p.manifest),
    entities,
    flow,
    fingerprint
  };
}
