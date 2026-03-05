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
    .map((entry) => path.join(packsRoot, entry.name));
}

function listEntityFiles(packDir: string): Array<{ entityType: string; filePath: string; relativePath: string }> {
  const entitiesDir = path.join(packDir, "entities");
  if (!fs.existsSync(entitiesDir)) return [];

  return fs
    .readdirSync(entitiesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
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

function buildGlobalIdIndex(packsRoot: string): Map<string, Set<string>> {
  const byType = new Map<string, Set<string>>();

  for (const packDir of listPackDirs(packsRoot)) {
    for (const file of listEntityFiles(packDir)) {
      const ids = byType.get(file.entityType) ?? new Set<string>();
      const entries = parseEntityArray(file.filePath);
      for (const entry of entries) {
        if (typeof entry.id === "string" && entry.id.length > 0) {
          ids.add(entry.id);
        }
      }
      byType.set(file.entityType, ids);
    }
  }

  return byType;
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
  const globalIdsByType = buildGlobalIdIndex(packsRoot);
  const missing: MissingReference[] = [];

  for (const packDir of listPackDirs(packsRoot)) {
    const packId = path.basename(packDir);
    for (const file of listEntityFiles(packDir)) {
      const rules = RULES.filter((rule) => rule.sourceType === file.entityType);
      if (!rules.length) continue;

      const entities = parseEntityArray(file.filePath);
      for (let entityIndex = 0; entityIndex < entities.length; entityIndex += 1) {
        const entity = entities[entityIndex]!;
        for (const rule of rules) {
          const knownIds = globalIdsByType.get(rule.targetType) ?? new Set<string>();
          for (const ref of rule.extract(entity, entityIndex)) {
            if (!knownIds.has(ref.value)) {
              missing.push({
                packId,
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
    throw new Error(formatFailure(missing));
  }
}
