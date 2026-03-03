import fs from "node:fs";
import path from "node:path";

const NON_ASCII_PATTERN = /[^\x00-\x7F]/;
const packsRoot = path.resolve(process.cwd(), "packs");

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
  }
}
