import fs from "node:fs";
import path from "node:path";
import { EntitySchema, FlowSchema, ManifestSchema, type Entity } from "@dcb/schema";
import { resolveLoadedPacks, type LoadedPack, type ResolvedPackSet } from "./core";

const ENTITY_FILES = ["races", "classes", "feats", "items", "skills", "rules"];

function parseEntityList(filePath: string, entityType: string): Entity[] {
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const parsed = EntitySchema.array().parse(raw);

    for (const entity of parsed) {
      if (entity.entityType !== entityType) {
        throw new Error(`Entity ${entity.id} has entityType=${entity.entityType}, expected ${entityType}`);
      }
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid entity file at ${filePath}: ${message}`);
  }
}


export function loadPack(packPath: string): LoadedPack {
  const manifest = ManifestSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "manifest.json"), "utf8")));
  const entities: Record<string, Entity[]> = {};

  for (const entityFile of ENTITY_FILES) {
    const filePath = path.join(packPath, "entities", `${entityFile}.json`);
    entities[entityFile] = parseEntityList(filePath, entityFile);
  }

  const flow = FlowSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "flows", "character-creation.flow.json"), "utf8")));

  const patchesDir = path.join(packPath, "patches");
  const patchFiles = fs.existsSync(patchesDir) ? fs.readdirSync(patchesDir).filter((f) => f.endsWith(".json")) : [];
  const patches = patchFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(patchesDir, file), "utf8")));

  return { manifest, entities, flow, patches, packPath };
}

export function resolvePackSet(packsRoot: string, enabledPackIds: string[]): ResolvedPackSet {
  const packDirs = fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name));

  const loaded = packDirs.map((dir) => loadPack(dir));
  return resolveLoadedPacks(loaded, enabledPackIds);
}
