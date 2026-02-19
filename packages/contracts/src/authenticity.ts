import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { AuthenticityLockSchema, type AuthenticityLock } from "@dcb/schema";

const LOCK_FILE = "authenticity.lock.json";

function sha256File(filePath: string): string {
  if (filePath.toLowerCase().endsWith(".json")) {
    // Normalize line endings so checksum validation is stable across Windows/Linux checkouts.
    const normalized = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    return createHash("sha256").update(Buffer.from(normalized, "utf8")).digest("hex");
  }
  const buffer = fs.readFileSync(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

function readLock(lockPath: string): AuthenticityLock {
  const raw = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  return AuthenticityLockSchema.parse(raw);
}

function authenticityFailure(packId: string, message: string, details: string): never {
  throw new Error(
    [
      `[authenticity] ${message}`,
      `  pack: ${packId}`,
      `  details: ${details}`
    ].join("\n")
  );
}

export function runAuthenticityChecks(packsRoot: string): void {
  const packDirs = fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name));

  for (const packDir of packDirs) {
    const lockPath = path.join(packDir, LOCK_FILE);
    if (!fs.existsSync(lockPath)) continue;
    const lock = readLock(lockPath);
    if (!lock.officialRuleset) continue;

    const actualPackId = path.basename(packDir);
    if (lock.packId !== actualPackId) {
      authenticityFailure(actualPackId, "Lock file packId mismatch", `lock packId=${lock.packId}`);
    }

    for (const artifact of lock.artifacts) {
      const artifactPath = path.join(packDir, artifact.path);
      if (!fs.existsSync(artifactPath)) {
        authenticityFailure(actualPackId, "Missing artifact referenced in lock", artifact.path);
      }
      const actualHash = sha256File(artifactPath);
      if (actualHash !== artifact.sha256) {
        authenticityFailure(
          actualPackId,
          "Artifact checksum mismatch",
          `${artifact.path} expected=${artifact.sha256} actual=${actualHash}`
        );
      }
    }
  }
}
