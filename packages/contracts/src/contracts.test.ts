import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runAuthenticityChecks, runContracts } from "./index";

describe("pack contracts", () => {
  it("runs all contract fixtures", () => {
    expect(() => runContracts(path.resolve(process.cwd(), "../../packs"))).not.toThrow();
  });

  it("verifies authenticity locks for official packs", () => {
    expect(() => runAuthenticityChecks(path.resolve(process.cwd(), "../../packs"))).not.toThrow();
  });


  it("ignores non-directory entries under packs root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-contracts-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packSource, packDest, { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "README.md"), "not a pack dir");

    try {
      expect(() => runContracts(tempRoot)).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails authenticity checks when locked artifact changes", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-auth-"));
    const packSource = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");
    fs.cpSync(packSource, packDest, { recursive: true });

    const target = path.join(packDest, "entities/classes.json");
    fs.writeFileSync(target, `${fs.readFileSync(target, "utf8")}\n`);

    try {
      expect(() => runAuthenticityChecks(tempRoot)).toThrow(/checksum mismatch/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
