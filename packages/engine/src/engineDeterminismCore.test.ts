import {
  applyChoice,
  context,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it
} from "./engineTestSupport";

describe("engine determinism", () => {
  it("returns identical sheets for same inputs", () => {
    let state = applyChoice(initialState, "name", "Aric");
    state = applyChoice(state, "abilities", { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "human");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["power-attack"]);
    state = applyChoice(state, "equipment", ["longsword", "chainmail", "heavy-wooden-shield"]);

    const one = finalizeCharacter(state, context);
    const two = finalizeCharacter(state, context);

    expect(one).toEqual(two);
    expect(one.stats.ac).toBe(18);
    expect(one.stats.attackBonus).toBe(4);
    expect(one.stats.initiative).toBe(1);
    expect(one.phase1.combat.initiative.total).toBe(1);
    expect(one.phase1.combat.initiative.dex).toBe(1);
    expect(one.phase1.combat.initiative.misc).toBe(0);
    expect(one.phase1.identity.level).toBe(1);
    expect(one.phase1.combat.ac.touch).toBe(11);
    expect(one.phase1.combat.ac.flatFooted).toBe(17);
    expect(one.phase1.combat.attacks.melee.length).toBeGreaterThan(0);
    expect(one.phase2.feats.length).toBe(1);
    expect(one.phase2.feats[0]?.id).toBe("power-attack");
    expect(one.phase2.equipment.totalWeight).toBe(54);
    expect(one.phase2.movement.adjusted).toBe(20);
  });

  it("surfaces deferred mechanics from selected entities as deterministic unresolved rules", () => {
    let state = applyChoice(initialState, "name", "Durgan");
    state = applyChoice(state, "abilities", { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 });
    state = applyChoice(state, "race", "dwarf");
    state = applyChoice(state, "class", "fighter");
    state = applyChoice(state, "feat", ["acrobatic"]);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.unresolvedRules.map((rule) => rule.id)).toEqual([
      "srd-35e-minimal:classes:fighter:fighter-bonus-feat-runtime",
      "srd-35e-minimal:classes:fighter:fighter-proficiency-automation",
      "srd-35e-minimal:feats:acrobatic:acrobatic-benefit",
      "srd-35e-minimal:races:dwarf:dwarf-conditional-bonuses",
      "srd-35e-minimal:races:dwarf:dwarf-weapon-familiarity-proficiency"
    ]);
    expect(sheet.unresolvedRules).toEqual(expect.arrayContaining([
      {
        id: "srd-35e-minimal:feats:acrobatic:acrobatic-benefit",
        category: "feat-benefit",
        description: "GENERAL feat benefit is preserved from source text but not yet enforced by the current engine. You get a +2 bonus on all Jump checks and Tumble checks.",
        dependsOn: ["cap:feat-effect-runtime", "cap:character-sheet-feat-benefits"],
        impacts: ["skills:jump", "skills:tumble"],
        source: {
          entityType: "feats",
          entityId: "acrobatic",
          packId: "srd-35e-minimal"
        }
      },
      {
        id: "srd-35e-minimal:races:dwarf:dwarf-weapon-familiarity-proficiency",
        category: "proficiency",
        description: "Dwarven weapon familiarity is documented but not enforced by current equipment/proficiency mechanics.",
        dependsOn: ["cap:equipment-proficiency", "cap:equipment-validation"],
        impacts: ["proficiency:weapon:dwarven-waraxe", "proficiency:weapon:dwarven-urgrosh"],
        source: {
          entityType: "races",
          entityId: "dwarf",
          packId: "srd-35e-minimal"
        }
      }
    ]));
  });
});
