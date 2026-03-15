import { buildSheetViewModel } from "./legacyRuntimeViewModel";
import {
  applyChoice,
  context,
  describe,
  expect,
  finalizeCharacter,
  initialState,
  it
} from "./engineTestSupport";

describe("attack-line identity and sequencing", () => {
  it("adds stable identity and sequence metadata to finalized attack lines", () => {
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
    state = applyChoice(state, "equipment", ["longsword"]);

    const sheet = finalizeCharacter(state, context);

    expect(sheet.sheetViewModel.combat.attacks[0]).toMatchObject({
      id: "melee:longsword:1",
      sequence: 1
    });
  });

  it("increments sequence metadata when the same attack source appears multiple times", () => {
    const viewModel = buildSheetViewModel({
      abilities: {
        str: { score: 16, mod: 3 },
        dex: { score: 12, mod: 1 },
        con: { score: 14, mod: 2 },
        int: { score: 10, mod: 0 },
        wis: { score: 10, mod: 0 },
        cha: { score: 8, mod: -1 }
      },
      phase1: {
        identity: {
          raceId: "human",
          classId: "fighter",
          level: 1,
          xp: 0,
          size: "medium",
          speed: { base: 30, adjusted: 30 }
        },
        combat: {
          ac: {
            total: 10,
            touch: 10,
            flatFooted: 10,
            breakdown: {
              armor: 0,
              shield: 0,
              dex: 0,
              size: 0,
              natural: 0,
              deflection: 0,
              misc: 0
            }
          },
          initiative: { total: 1, dex: 1, misc: 0 },
          grapple: { total: 4, bab: 1, str: 3, size: 0, misc: 0 },
          attacks: {
            melee: [
              { itemId: "longsword", name: "Longsword", attackBonus: 4, damage: "1d8", crit: "19-20/x2" },
              { itemId: "longsword", name: "Longsword", attackBonus: -1, damage: "1d8", crit: "19-20/x2" }
            ],
            ranged: []
          },
          saves: {
            fort: { total: 4, base: 2, ability: 2, misc: 0 },
            ref: { total: 1, base: 0, ability: 1, misc: 0 },
            will: { total: 0, base: 0, ability: 0, misc: 0 }
          },
          hp: {
            total: 12,
            breakdown: { hitDie: 10, con: 2, misc: 0 }
          }
        }
      },
      phase2: {
        feats: [],
        traits: [],
        skills: [],
        equipment: {
          selectedItems: ["longsword"],
          totalWeight: 4,
          loadCategory: "light",
          reducesSpeed: false
        },
        movement: {
          base: 30,
          adjusted: 30,
          reducedByArmorOrLoad: false
        }
      },
      skills: {},
      decisions: {
        featSelectionLimit: 1,
        favoredClass: "any",
        ignoresMulticlassXpPenalty: true,
        classSkills: [],
        ancestryTags: [],
        sizeModifiers: { ac: 0, attack: 0, hide: 0, carryingCapacityMultiplier: 1 },
        movementOverrides: { ignoreArmorSpeedReduction: false },
        racialSaveBonuses: [],
        racialAttackBonuses: [],
        racialAcBonuses: [],
        racialSpellDcBonuses: [],
        racialInnateSpellLikeAbilities: [],
        skillPoints: {
          basePerLevel: 2,
          racialBonusAtLevel1: 0,
          racialBonusPerLevel: 0,
          firstLevelMultiplier: 4,
          total: 8,
          spent: 0,
          remaining: 8
        }
      }
    });

    expect(viewModel.combat.attacks.map((attack) => ({
      id: attack.id,
      sequence: attack.sequence
    }))).toEqual([
      { id: "melee:longsword:1", sequence: 1 },
      { id: "melee:longsword:2", sequence: 2 }
    ]);
  });
});
