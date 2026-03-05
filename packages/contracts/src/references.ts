import fs from "node:fs";
import path from "node:path";

type EntityRecord = {
  id?: unknown;
  data?: unknown;
};

type MissingReference = {
  packId: string;
  file: string;
  path: string;
  expected: string;
  missing: string;
};

type PackManifest = {
  id: string;
  dependencies?: unknown;
};

type PackInfo = {
  id: string;
  dir: string;
  dependencies: string[];
  idsByType: Map<string, Set<string>>;
};

type Rule = {
  sourceType: string;
  targetType: string;
  extract: (entity: EntityRecord, entityIndex: number) => Array<{ path: string; value: string }>;
};

const RULES: Rule[] = [
  {
    sourceType: "races",
    targetType: "classes",
    extract: (entity, entityIndex) => {
      const favoredClass = readString((entity.data as { favoredClass?: unknown } | undefined)?.favoredClass);
      if (!favoredClass) return [];
      if (favoredClass === "any") return [];
      return [{ path: `$[${entityIndex}].data.favoredClass`, value: favoredClass }];
    }
  }
];

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function listPackDirs(packsRoot: string): string[] {
  return fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function listEntityFiles(packDir: string): Array<{ entityType: string; filePath: string; relativePath: string }> {
  const entitiesDir = path.join(packDir, "entities");
  if (!fs.existsSync(entitiesDir)) return [];

  return fs
    .readdirSync(entitiesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const filePath = path.join(entitiesDir, entry.name);
      return {
        entityType: entry.name.replace(/\.json$/i, ""),
        filePath,
        relativePath: path.relative(packDir, filePath).replace(/\\/g, "/")
      };
    });
}

function parseEntityArray(filePath: string): EntityRecord[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(parsed) ? (parsed as EntityRecord[]) : [];
}

function parsePackManifest(packDir: string): PackManifest {
  const manifestPath = path.join(packDir, "manifest.json");
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PackManifest;
}

function buildPackInfos(packsRoot: string): PackInfo[] {
  const packs: PackInfo[] = [];

  for (const packDir of listPackDirs(packsRoot)) {
    const manifest = parsePackManifest(packDir);
    const idsByType = new Map<string, Set<string>>();
    for (const file of listEntityFiles(packDir)) {
      const ids = idsByType.get(file.entityType) ?? new Set<string>();
      const entries = parseEntityArray(file.filePath);
      for (const entry of entries) {
        if (typeof entry.id === "string" && entry.id.length > 0) {
          ids.add(entry.id);
        }
      }
      idsByType.set(file.entityType, ids);
    }
    packs.push({
      id: manifest.id,
      dir: packDir,
      dependencies: Array.isArray(manifest.dependencies)
        ? manifest.dependencies.filter((dep): dep is string => typeof dep === "string" && dep.length > 0)
        : [],
      idsByType
    });
  }

  return packs.sort((left, right) => left.id.localeCompare(right.id));
}

function unionIdsForType(target: Set<string>, source?: Set<string>): void {
  if (!source) return;
  for (const id of source) {
    target.add(id);
  }
}

function buildClosureIdsByPack(packs: PackInfo[]): Map<string, Map<string, Set<string>>> {
  const packsById = new Map(packs.map((pack) => [pack.id, pack]));
  const memo = new Map<string, Map<string, Set<string>>>();

  const resolve = (packId: string, active: Set<string>): Map<string, Set<string>> => {
    const cached = memo.get(packId);
    if (cached) return cached;
    if (active.has(packId)) return new Map();

    const pack = packsById.get(packId);
    if (!pack) return new Map();

    const nextActive = new Set(active);
    nextActive.add(packId);

    const merged = new Map<string, Set<string>>();
    for (const [entityType, ids] of pack.idsByType.entries()) {
      merged.set(entityType, new Set(ids));
    }

    for (const depId of pack.dependencies) {
      const depResolved = resolve(depId, nextActive);
      for (const [entityType, depIds] of depResolved.entries()) {
        const current = merged.get(entityType) ?? new Set<string>();
        unionIdsForType(current, depIds);
        merged.set(entityType, current);
      }
    }

    memo.set(packId, merged);
    return merged;
  };

  for (const pack of packs) {
    resolve(pack.id, new Set());
  }

  return memo;
}

function formatFailure(missing: MissingReference[]): string {
  return [
    "[contracts] Pack reference integrity check failed",
    ...missing.map((item) =>
      `  pack=${item.packId} file=${item.file} path=${item.path} expected=${item.expected} missing=${item.missing}`
    )
  ].join("\n");
}

export function assertPackReferenceIntegrity(packsRoot: string): void {
  const packInfos = buildPackInfos(packsRoot);
  const closureIdsByPack = buildClosureIdsByPack(packInfos);
  const missing: MissingReference[] = [];

  for (const pack of packInfos) {
    const availableIds = closureIdsByPack.get(pack.id) ?? new Map<string, Set<string>>();
    for (const file of listEntityFiles(pack.dir)) {
      const rules = RULES.filter((rule) => rule.sourceType === file.entityType);
      if (!rules.length) continue;

      const entities = parseEntityArray(file.filePath);
      for (let entityIndex = 0; entityIndex < entities.length; entityIndex += 1) {
        const entity = entities[entityIndex]!;
        for (const rule of rules) {
          const knownIds = availableIds.get(rule.targetType) ?? new Set<string>();
          for (const ref of rule.extract(entity, entityIndex)) {
            if (!knownIds.has(ref.value)) {
              missing.push({
                packId: pack.id,
                file: file.relativePath,
                path: ref.path,
                expected: `${rule.targetType}.id`,
                missing: ref.value
              });
            }
          }
        }
      }
    }
  }

  if (missing.length) {
    const sortedMissing = [...missing].sort((left, right) =>
      `${left.packId}|${left.file}|${left.path}`.localeCompare(`${right.packId}|${right.file}|${right.path}`)
    );
    throw new Error(formatFailure(sortedMissing));
  }
}
