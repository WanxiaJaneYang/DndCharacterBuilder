import {
  applyChoice,
  describe,
  expect,
  initialState,
  it,
  listChoices,
  makePack,
  resolveLoadedPacks
} from "./engineTestSupport";

describe("legacy runtime choice constraints", () => {
  it("allows levelMin-gated feat choices when the selected class encodes a higher level", () => {
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

    const context = {
      enabledPackIds: ["gated-feat-pack"],
      resolvedData: resolveLoadedPacks([makePack("base", 1), gatedFeatPack], ["gated-feat-pack"])
    };
    const state = applyChoice(initialState, "class", "fighter-3");
    const featChoice = listChoices(state, context).find((choice) => choice.stepId === "feat");

    expect(featChoice?.options.map((option) => option.id)).toContain("spring-attack");
  });
});
