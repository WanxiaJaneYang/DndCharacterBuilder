#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { pack: "", locale: "zh", out: "", merge: "", blank: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--pack" && next) {
      args.pack = next;
      i += 1;
      continue;
    }
    if (token === "--locale" && next) {
      args.locale = next;
      i += 1;
      continue;
    }
    if (token === "--out" && next) {
      args.out = next;
      i += 1;
      continue;
    }
    if (token === "--merge" && next) {
      args.merge = next;
      i += 1;
      continue;
    }
    if (token === "--blank") {
      args.blank = true;
      continue;
    }
  }
  if (!args.pack) {
    throw new Error("Missing required --pack <pack-dir> argument.");
  }
  return args;
}

function collectStringLeaves(value, prefix, out) {
  if (typeof value === "string") {
    out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectStringLeaves(item, `${prefix}.${index}`, out);
    });
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    collectStringLeaves(child, `${prefix}.${key}`, out);
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildTemplate(packDir, blank) {
  const flowPath = path.join(packDir, "flows", "character-creation.flow.json");
  const entitiesDir = path.join(packDir, "entities");
  const template = {
    flowStepLabels: {},
    entityText: {}
  };

  const flow = loadJson(flowPath);
  for (const step of flow.steps ?? []) {
    template.flowStepLabels[step.id] = blank ? "" : String(step.label ?? "");
  }

  const entityFiles = fs.existsSync(entitiesDir)
    ? fs.readdirSync(entitiesDir).filter((file) => file.endsWith(".json")).sort((a, b) => a.localeCompare(b))
    : [];

  for (const file of entityFiles) {
    const entityType = path.basename(file, ".json");
    const list = loadJson(path.join(entitiesDir, file));
    template.entityText[entityType] = {};
    for (const entity of list) {
      const entityId = String(entity.id ?? "");
      if (!entityId) continue;
      const pathMap = {};
      if (typeof entity.name === "string") pathMap.name = blank ? "" : entity.name;
      if (typeof entity.summary === "string") pathMap.summary = blank ? "" : entity.summary;
      if (typeof entity.description === "string") pathMap.description = blank ? "" : entity.description;
      if (entity.data !== undefined) {
        const dataMap = {};
        collectStringLeaves(entity.data, "data", dataMap);
        for (const [k, v] of Object.entries(dataMap)) {
          pathMap[k] = blank ? "" : v;
        }
      }
      template.entityText[entityType][entityId] = pathMap;
    }
  }

  return template;
}

function mergeTemplate(template, existing) {
  const merged = JSON.parse(JSON.stringify(template));
  if (existing?.flowStepLabels) {
    for (const [stepId, value] of Object.entries(existing.flowStepLabels)) {
      if (typeof value === "string" && value.length > 0) merged.flowStepLabels[stepId] = value;
    }
  }

  if (existing?.entityText) {
    for (const [entityType, entityMap] of Object.entries(existing.entityText)) {
      merged.entityText[entityType] ??= {};
      for (const [entityId, textMap] of Object.entries(entityMap)) {
        merged.entityText[entityType][entityId] ??= {};
        for (const [textPath, value] of Object.entries(textMap)) {
          if (typeof value === "string" && value.length > 0) {
            merged.entityText[entityType][entityId][textPath] = value;
          }
        }
      }
    }
  }

  return merged;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const packDir = path.resolve(process.cwd(), args.pack);
  const template = buildTemplate(packDir, args.blank);
  const existing = args.merge ? loadJson(path.resolve(process.cwd(), args.merge)) : null;
  const output = existing ? mergeTemplate(template, existing) : template;
  const serialized = `${JSON.stringify(output, null, 2)}\n`;

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, serialized, "utf8");
    console.log(`Wrote locale template: ${outPath}`);
    return;
  }

  process.stdout.write(serialized);
}

main();
