import {
  applyChoice,
  context,
  describe,
  expect,
  initialState,
  it
} from "./engineTestSupport";
import { evaluateConditionalModifierPredicate } from "./legacyRuntimeConditionalModifiers";
import {
  buildLegacyProficiencyState,
  resolveSkillArmorCheckPenalty
} from "./legacyRuntimeProficiencyState";

describe("legacy proficiency state seam", () => {
  it("builds an explicit proficiency-state bridge from current runtime inputs", () => {
    let state = applyChoice(initialState, "name", "Bridge");
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");

    const proficiencyState = buildLegacyProficiencyState(state, context);

    expect(proficiencyState.skillIds.has("climb")).toBe(true);
    expect(proficiencyState.skillIds.has("listen")).toBe(false);
  });

  it("prefers explicit proficiency-state input over class-skill fallback for isProficient predicates", () => {
    const predicate = {
      op: "isProficient",
      target: { kind: "skill", id: "climb" }
    } as Parameters<typeof evaluateConditionalModifierPredicate>[0];

    expect(evaluateConditionalModifierPredicate(predicate, {
      skillRanks: {},
      selectedFeatIds: new Set<string>(),
      selectedFeatureIds: new Set<string>(),
      classSkillIds: new Set(["climb"]),
      proficiencyState: { skillIds: new Set<string>() }
    })).toBe(false);
  });

  it("keeps ACP helper behavior stable while accepting proficiency-state input", () => {
    const climb = context.resolvedData.entities.skills?.climb;
    const listen = context.resolvedData.entities.skills?.listen;
    const proficiencyState = { skillIds: new Set<string>(["climb"]) };

    expect(resolveSkillArmorCheckPenalty(climb, -5, proficiencyState)).toEqual({
      acpApplied: true,
      acp: -5
    });
    expect(resolveSkillArmorCheckPenalty(listen, -5, proficiencyState)).toEqual({
      acpApplied: false,
      acp: 0
    });
  });
});
