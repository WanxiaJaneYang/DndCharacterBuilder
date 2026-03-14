import {
  applyChoice,
  context,
  describe,
  expect,
  finalizeCharacter,
  fs,
  initialState,
  it
} from "./engineTestSupport";

const finalizeCharacterSheetSpecSliceGoldenFixture = new URL(
  "./__fixtures__/finalize-character-sheet-spec-slice-human-fighter-1.golden.json",
  import.meta.url
);

function buildCanonicalFinalizeCharacterSheetSpecSlice() {
  let state = applyChoice(initialState, "name", "Aric");
  state = applyChoice(state, "abilities", {
    str: 16,
    dex: 12,
    con: 14,
    int: 10,
    wis: 10,
    cha: 8
  });
  state = applyChoice(state, "race", "human");
  state = applyChoice(state, "class", "fighter");
  state = applyChoice(state, "skills", { climb: 4, jump: 3, diplomacy: 0.5 }, context);
  state = applyChoice(state, "feat", ["power-attack"], context);
  state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"], context);

  const sheet = finalizeCharacter(state, context);

  return {
    metadata: sheet.metadata,
    identity: sheet.phase1.identity,
    abilities: sheet.abilities,
    combat: sheet.phase1.combat,
    skills: sheet.phase2.skills.map((skill) => {
      const detail = sheet.skills[skill.id];

      return {
        id: skill.id,
        name: skill.name,
        ability: detail?.ability ?? "int",
        classSkill: detail?.classSkill ?? detail?.isClassSkill ?? false,
        ranks: skill.ranks,
        maxRanks: detail?.maxRanks ?? skill.ranks,
        costPerRank: detail?.costPerRank ?? 1,
        costSpent: detail?.costSpent ?? skill.ranks,
        breakdown: {
          abilityMod: detail?.abilityMod ?? skill.ability,
          racial: detail?.racialBonus ?? skill.racial,
          misc: detail?.miscBonus ?? skill.misc,
          acp: skill.acp
        },
        total: skill.total
      };
    }),
    feats: sheet.phase2.feats,
    rules: {
      decisions: sheet.decisions,
      provenance: sheet.provenance,
      packSetFingerprint: sheet.packSetFingerprint
    },
    unresolved: sheet.unresolvedRules
  };
}

describe("engine sheet-spec contract snapshot", () => {
  it("matches the canonical mapped finalizeCharacter() sheet-spec slice for the equipped human fighter", () => {
    const contractSlice = buildCanonicalFinalizeCharacterSheetSpecSlice();

    expect(contractSlice).toEqual(
      JSON.parse(fs.readFileSync(finalizeCharacterSheetSpecSliceGoldenFixture, "utf8")) as ReturnType<typeof buildCanonicalFinalizeCharacterSheetSpecSlice>
    );
  });
});
