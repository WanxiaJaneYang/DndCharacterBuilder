import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContractFixtureSchema } from "@dcb/schema";

describe("unresolved-rules fixture", () => {
  it("covers the current race/class/feat unresolved rule surfaces deterministically", () => {
    const fixturePath = path.resolve(process.cwd(), "../../packs/srd-35e-minimal/contracts/unresolved-rules.json");
    const fixture = ContractFixtureSchema.parse(JSON.parse(fs.readFileSync(fixturePath, "utf8")));

    expect("initialState" in fixture).toBe(true);

    if (!("initialState" in fixture)) {
      throw new Error("Expected unresolved-rules fixture to use the legacy action fixture shape");
    }

    expect(fixture.actions).toEqual([
      {
        choiceId: "race",
        selection: "dwarf"
      },
      {
        choiceId: "class",
        selection: "wizard"
      },
      {
        choiceId: "abilities",
        selection: {
          str: 16,
          dex: 12,
          con: 14,
          int: 10,
          wis: 10,
          cha: 8
        }
      },
      {
        choiceId: "feat",
        selection: ["alertness"]
      },
      {
        choiceId: "name",
        selection: "Durgan"
      }
    ]);

    expect(fixture.contractClarifications).toMatchObject({
      unresolvedCoverage:
        "This fixture intentionally spans race, class, and feat deferred-mechanics surfaces so unresolved-rules ordering and source/category mappings stay regression-tested."
    });

    expect(fixture.expected.finalSheetSubset?.unresolvedRules).toEqual([
      {
        id: "srd-35e-minimal:classes:wizard:wizard-bonus-feat-runtime",
        category: "class-feature",
        source: {
          entityType: "classes",
          entityId: "wizard",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:classes:wizard:wizard-familiar-runtime",
        category: "class-feature",
        source: {
          entityType: "classes",
          entityId: "wizard",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:classes:wizard:wizard-spellbook-runtime",
        category: "spellcasting",
        source: {
          entityType: "classes",
          entityId: "wizard",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:feats:alertness:alertness-benefit",
        category: "feat-benefit",
        source: {
          entityType: "feats",
          entityId: "alertness",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:races:dwarf:dwarf-conditional-bonuses",
        category: "situational-bonus",
        source: {
          entityType: "races",
          entityId: "dwarf",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:races:dwarf:dwarf-weapon-familiarity-proficiency",
        category: "proficiency",
        source: {
          entityType: "races",
          entityId: "dwarf",
          packId: "srd-35e-minimal"
        }
      }
    ]);
  });
});
