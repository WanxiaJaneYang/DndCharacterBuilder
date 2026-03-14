import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ConditionalModifier = {
  id?: string;
  source?: { ref?: string };
  when?: { left?: { id?: string }; right?: number };
  apply?: { target?: { id?: string }; bonus?: number; note?: string };
};

describe("skill synergy dataset", () => {
  it("includes the full unconditional PHB 3.5 core skill synergy set supported by the current engine", () => {
    const rulesPath = path.resolve(
      process.cwd(),
      "../../packs/srd-35e-minimal/entities/rules.json",
    );
    const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8")) as Array<{
      id?: string;
      data?: { conditionalModifiers?: ConditionalModifier[] };
    }>;
    const synergyRule = rules.find((rule) => rule.id === "skill-synergy-core");
    const modifiers = synergyRule?.data?.conditionalModifiers ?? [];
    const byId = new Map(modifiers.map((modifier) => [modifier.id, modifier]));

    const expectedIds = [
      "synergy-tumble-balance",
      "synergy-tumble-jump",
      "synergy-jump-tumble",
      "synergy-bluff-diplomacy",
      "synergy-bluff-intimidate",
      "synergy-bluff-sleight-of-hand",
      "synergy-sense-motive-diplomacy",
      "synergy-handle-animal-ride",
      "synergy-knowledge-arcana-spellcraft",
      "synergy-knowledge-local-gather-information",
      "synergy-knowledge-nobility-and-royalty-diplomacy",
      "synergy-survival-knowledge-nature",
    ];

    expect(modifiers).toHaveLength(expectedIds.length);

    for (const id of expectedIds) {
      expect(byId.has(id), `missing synergy rule ${id}`).toBe(true);
      expect(byId.get(id)?.apply?.note).toMatch(/PHB 3\.5 Table 4-5/i);
      expect(byId.get(id)?.when?.right).toBe(5);
      expect(byId.get(id)?.apply?.bonus).toBe(2);
      expect(byId.get(id)?.source?.ref).toBe(byId.get(id)?.when?.left?.id);
    }
  });
});
