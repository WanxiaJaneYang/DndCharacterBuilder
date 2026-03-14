import {
  applyChoice,
  describe,
  expect,
  initialState,
  it,
  listChoices,
  makePack,
  resolveLoadedPacks,
  validateState
} from "./engineTestSupport";

function buildGatedFeatContext() {
  const gatedFeatPack = makePack("gated-feat-pack", 2);
  gatedFeatPack.entities.feats = [{
    id: "spring-attack",
    name: "Spring Attack",
    entityType: "feats",
    summary: "Requires level 2.",
    description: "Test feat gated by level.",
    portraitUrl: "assets/feats/spring-attack-portrait.png",
    iconUrl: "assets/icons/feats/spring-attack.png",
    constraints: [{ kind: "levelMin", level: 2 }],
    effects: []
  }];
  gatedFeatPack.flow.steps.push({
    id: "feat",
    kind: "feat",
    label: "Feat",
    source: { type: "entityType", entityType: "feats", limit: 1 }
  });

  return {
    enabledPackIds: ["gated-feat-pack"],
    resolvedData: resolveLoadedPacks([makePack("base", 1), gatedFeatPack], ["gated-feat-pack"])
  };
}

describe("legacy runtime choice constraints", () => {
  it("allows levelMin-gated feat choices when the selected class encodes a higher level", () => {
    const context = buildGatedFeatContext();
    const state = applyChoice(initialState, "class", "fighter-3");
    const featChoice = listChoices(state, context).find((choice) => choice.stepId === "feat");

    expect(featChoice?.options.map((option) => option.id)).toContain("spring-attack");
  });

  it("keeps selected levelMin-gated feats off the prerequisite failure list at higher levels", () => {
    let state = applyChoice(initialState, "class", "fighter-3");
    state = applyChoice(state, "feat", ["spring-attack"]);

    const errors = validateState(state, buildGatedFeatContext());

    expect(errors.some((error) => error.code === "PREREQ_FAILED" && error.stepId === "feat")).toBe(false);
  });
});
