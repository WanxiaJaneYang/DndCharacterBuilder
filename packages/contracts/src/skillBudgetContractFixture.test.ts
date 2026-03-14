import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContractFixtureSchema } from "@dcb/schema";

describe("skill budget compute fixture", () => {
  it("covers higher-level skill budget invariants for human fighter progression", () => {
    const fixturePath = path.resolve(
      process.cwd(),
      "../../packs/srd-35e-minimal/contracts/human-fighter-3-skill-budget-compute.json"
    );
    const fixture = ContractFixtureSchema.parse(JSON.parse(fs.readFileSync(fixturePath, "utf8")));

    expect("characterSpec" in fixture).toBe(true);

    if (!("characterSpec" in fixture)) {
      throw new Error("Expected skill-budget contract fixture to use the compute fixture shape");
    }

    expect(fixture.characterSpec).toMatchObject({
      meta: {
        name: "Aric III",
        rulesetId: "dnd35e",
        sourceIds: ["srd-35e-minimal"]
      },
      raceId: "human",
      class: {
        classId: "fighter",
        level: 3
      },
      abilities: {
        int: 12
      },
      skillRanks: {
        climb: 6,
        listen: 3
      }
    });

    expect(fixture.contractClarifications).toMatchObject({
      skillBudget:
        "This fixture locks level-scaled skill budget totals plus class/cross-class spend invariants for compute(spec, rulepack)."
    });

    expect(fixture.expected.computeResultSubset).toMatchObject({
      sheetViewModel: {
        data: {
          review: {
            skillBudget: {
              total: 24,
              spent: 12,
              remaining: 12
            }
          }
        }
      }
    });
  });
});
