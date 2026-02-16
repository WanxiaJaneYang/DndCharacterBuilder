import path from "node:path";
import { describe, expect, it } from "vitest";
import { runContracts } from "./index";

describe("pack contracts", () => {
  it("runs all contract fixtures", () => {
    expect(() => runContracts(path.resolve(process.cwd(), "../../packs"))).not.toThrow();
  });
});
