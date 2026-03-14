import {
  canonicalComputeContractFixture,
  compute,
  context,
  describe,
  expect,
  fs,
  it
} from "./engineTestSupport";

describe("compute() contract", () => {
  it("moves legacy wizard/state runtime behind a dedicated legacy module", () => {
    const publicSource = fs.readFileSync(new URL("./public.ts", import.meta.url), "utf8");
    const legacySource = fs.readFileSync(new URL("./legacy.ts", import.meta.url), "utf8");
    const computeSourcePath = new URL("./compute.ts", import.meta.url);
    const legacyRuntimeSourcePath = new URL("./legacyRuntime.ts", import.meta.url);

    expect(fs.existsSync(computeSourcePath)).toBe(true);
    expect(fs.existsSync(legacyRuntimeSourcePath)).toBe(true);

    const computeSource = fs.readFileSync(computeSourcePath, "utf8");
    const legacyRuntimeSource = fs.readFileSync(legacyRuntimeSourcePath, "utf8");

    expect(publicSource).toContain('from "./compute"');
    expect(legacySource).toContain('from "./legacyRuntime"');
    expect(computeSource).toContain("export function compute(");
    expect(computeSource).not.toContain("export function listChoices(");
    expect(legacyRuntimeSource).not.toContain("export function listChoices(");
    expect(legacyRuntimeSource).not.toContain("export function finalizeCharacter(");
  });

  it("keeps compute() off the legacy bridge exports", () => {
    const engineSource = fs.readFileSync(new URL("./compute.ts", import.meta.url), "utf8");
    const computeStart = engineSource.indexOf("export function compute(");
    const computeSource = engineSource.slice(computeStart);

    expect(computeStart).toBeGreaterThanOrEqual(0);
    expect(computeSource).not.toContain("characterSpecToState(");
    expect(computeSource).not.toContain("validateState(");
    expect(computeSource).not.toContain("finalizeCharacter(");
  });

  it("returns versioned ComputeResult for a canonical CharacterSpec", () => {
    const result = compute(
      {
        meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(result.schemaVersion).toBe("0.1");
    expect(result.sheetViewModel.schemaVersion).toBe("0.1");
    expect(result.sheetViewModel.data.combat.ac.total).toBe(18);
    expect(result.validationIssues).toEqual([]);
    expect(result.unresolved).toEqual(expect.any(Array));
    expect(result.assumptions).toEqual(expect.any(Array));
  });

  it("projects review context and skill metadata through the public ComputeResult contract", () => {
    const result = compute(
      {
        meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
        featIds: ["power-attack"],
        equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(result.sheetViewModel.data.review.rulesDecisions.featSelectionLimit).toBe(3);
    expect(result.sheetViewModel.data.skills.find((skill) => skill.id === "climb")).toMatchObject({
      classSkill: true,
      costPerRank: 1,
      maxRanks: 4
    });
  });

  it("does not apply flow-default point-buy validation to flow-independent CharacterSpec abilities", () => {
    const result = compute(
      {
        meta: { name: "Rolled Case", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: 18, dex: 18, con: 18, int: 8, wis: 8, cha: 8 },
        featIds: ["power-attack"],
        skillRanks: { climb: 4 }
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(result.validationIssues.some((issue) => issue.code === "ABILITY_POINTBUY_EXCEEDED")).toBe(false);
  });

  it("sanitizes malformed ability inputs and records assumptions", () => {
    const result = compute(
      {
        meta: { name: "NaN Case", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
        raceId: "human",
        class: { classId: "fighter", level: 1 },
        abilities: { str: Number.NaN, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        featIds: ["power-attack"],
        skillRanks: { climb: 4 }
      },
      { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds }
    );

    expect(JSON.parse(JSON.stringify(result)).sheetViewModel.data.review.abilities.str).toEqual({ score: 10, mod: 0 });
    expect(result.assumptions).toEqual(expect.arrayContaining([expect.objectContaining({ code: "SPEC_ABILITY_DEFAULTED", path: "abilities.str" })]));
  });

  it("maps validation paths to CharacterSpec fields and records normalization assumptions", () => {
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

    expect(result.validationIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "NAME_REQUIRED", path: "meta.name" }),
      expect.objectContaining({ code: "SPEC_CLASS_LEVEL_INVALID", path: "class.level" })
    ]));
    expect(result.assumptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SPEC_CLASS_LEVEL_CLAMPED", path: "class.level", defaultUsed: 1 })
    ]));
  });

  it("produces deterministic contract snapshot for same spec + rulepack", () => {
    const spec = {
      meta: { name: "Aric", rulesetId: "dnd35e", sourceIds: ["srd-35e-minimal"] },
      raceId: "human",
      class: { classId: "fighter", level: 1 },
      abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
      skillRanks: { climb: 4, jump: 3, diplomacy: 0.5 },
      featIds: ["power-attack"],
      equipmentIds: ["longsword", "chainmail", "heavy-wooden-shield"]
    };
    const rulepack = { resolvedData: context.resolvedData, enabledPackIds: context.enabledPackIds };

    const one = compute(spec, rulepack);
    const two = compute(spec, rulepack);
    const contractSlice = {
      schemaVersion: one.schemaVersion,
      sheetViewModelSchemaVersion: one.sheetViewModel.schemaVersion,
      ac: one.sheetViewModel.data.combat.ac,
      firstAttack: one.sheetViewModel.data.combat.attacks[0],
      firstThreeSkills: ["climb", "diplomacy", "jump"].map((id) => one.sheetViewModel.data.skills.find((skill) => skill.id === id)).filter(Boolean),
      review: one.sheetViewModel.data.review,
      validationIssueCodes: one.validationIssues.map((issue) => issue.code),
      unresolvedCodes: one.unresolved.map((entry) => entry.code)
    };

    expect(one).toEqual(two);
    expect(contractSlice).toEqual(JSON.parse(fs.readFileSync(canonicalComputeContractFixture, "utf8")) as typeof contractSlice);
  });
});
