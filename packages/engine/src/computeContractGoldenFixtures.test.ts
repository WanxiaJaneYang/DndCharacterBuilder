import {
  compute,
  context,
  describe,
  expect,
  fs,
  it
} from "./engineTestSupport";

const invalidNormalizationGoldenFixture = new URL(
  "./__fixtures__/compute-contract-invalid-normalization.golden.json",
  import.meta.url
);

describe("compute() golden fixtures", () => {
  it("produces deterministic validation and assumption ordering for invalid normalized CharacterSpec input", () => {
    const result = compute(
      {
        meta: { name: " ", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1.9 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    const contractSlice = {
      schemaVersion: result.schemaVersion,
      validationIssues: result.validationIssues,
      assumptions: result.assumptions
    };

    expect(contractSlice).toEqual(
      JSON.parse(fs.readFileSync(invalidNormalizationGoldenFixture, "utf8")) as typeof contractSlice
    );
  });
});
