import fs from "node:fs";
import path from "node:path";

const NON_ASCII_PATTERN = /[^\x00-\x7F]/;
const BIDI_CONTROL_PATTERN = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/;
const packsRoot = path.resolve(process.cwd(), "packs");

function findBidiControlPath(value, currentPath = "$") {
  if (typeof value === "string") {
    return BIDI_CONTROL_PATTERN.test(value) ? currentPath : null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findBidiControlPath(value[index], `${currentPath}[${index}]`);
      if (nestedPath) return nestedPath;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nestedPath = findBidiControlPath(nestedValue, `${currentPath}.${key}`);
      if (nestedPath) return nestedPath;
    }
  }

  return null;
}

for (const entry of fs.readdirSync(packsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const contractsDir = path.join(packsRoot, entry.name, "contracts");
  if (!fs.existsSync(contractsDir)) continue;

  for (const file of fs.readdirSync(contractsDir)) {
    if (!file.endsWith(".json")) continue;

    const fixturePath = path.join(contractsDir, file);
    const fixtureText = fs.readFileSync(fixturePath, "utf8");
    if (NON_ASCII_PATTERN.test(fixtureText)) {
      console.error(`Non-ASCII contract fixture content detected: ${path.relative(process.cwd(), fixturePath)}`);
      process.exit(1);
    }

    const bidiPath = findBidiControlPath(JSON.parse(fixtureText));
    if (bidiPath) {
      console.error(
        `Bidirectional control character detected in contract fixture: ${path.relative(process.cwd(), fixturePath)} at ${bidiPath}`
      );
      process.exit(1);
    }
  }
}
