import fs from "node:fs";
import path from "node:path";
import { EntitySchema, FlowSchema, ManifestSchema, PackLocaleSchema, PageSchema, type Entity, type Page } from "@dcb/schema";
import { resolveLoadedPacks, type LoadedPack, type PackLocale, type ResolvedPackSet } from "./core";

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

function loadPageSchemas(packPath: string): Record<string, Page> {
  const pagesDir = path.join(packPath, "ui", "pages");
  if (!fs.existsSync(pagesDir)) return {};

  const pageFiles = fs.readdirSync(pagesDir).filter((file) => file.endsWith(".page.json"));
  const pageSchemas: Record<string, Page> = {};

  for (const file of pageFiles) {
    const filePath = path.join(pagesDir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const parsed = PageSchema.parse(raw);
      pageSchemas[parsed.id] = parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid page schema file at ${filePath}: ${message}`);
    }
  }

  return pageSchemas;
}


export function loadPack(packPath: string): LoadedPack {
  const manifest = ManifestSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "manifest.json"), "utf8")));
  const entities: Record<string, Entity[]> = {};

  for (const entityFile of ENTITY_FILES) {
    const filePath = path.join(packPath, "entities", `${entityFile}.json`);
    entities[entityFile] = parseEntityList(filePath, entityFile);
  }

  const flow = FlowSchema.parse(JSON.parse(fs.readFileSync(path.join(packPath, "flows", "character-creation.flow.json"), "utf8")));
  const pageSchemas = loadPageSchemas(packPath);

  const patchesDir = path.join(packPath, "patches");
  const patchFiles = fs.existsSync(patchesDir) ? fs.readdirSync(patchesDir).filter((f) => f.endsWith(".json")) : [];
  const patches = patchFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(patchesDir, file), "utf8")));

  const localesDir = path.join(packPath, "locales");
  const localeFiles = fs.existsSync(localesDir)
    ? fs.readdirSync(localesDir).filter((f) => f.endsWith(".json") && !f.endsWith(".template.json"))
    : [];
  const locales: Record<string, PackLocale> = {};
  for (const file of localeFiles) {
    const language = path.basename(file, ".json");
    const filePath = path.join(localesDir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      locales[language] = PackLocaleSchema.parse(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid locale file at ${filePath}: ${message}`);
    }
  }

  return { manifest, entities, flow, pageSchemas, patches, locales, packPath };
}

export function resolvePackSet(packsRoot: string, enabledPackIds: string[]): ResolvedPackSet {
  const packDirs = fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name));

  const loaded = packDirs.map((dir) => loadPack(dir));
  return resolveLoadedPacks(loaded, enabledPackIds);
}
