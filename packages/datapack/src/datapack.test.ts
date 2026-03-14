import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "./index";
import { resolveLoadedPacks, topoSortPacks } from "./core";
import { resolvePackSet } from "./node";

function makePack(id: string, priority: number, dependencies: string[] = []): LoadedPack {
  return {
    manifest: { id, name: id, version: "1.0.0", priority, dependencies },
    entities: {
      races: [],
      classes: [],
      feats: [],
      items: [],
      skills: [],
      rules: [{ id: `${id}-rule`, name: `${id}-rule`, entityType: "rules", summary: "Rule summary", description: "Rule description", portraitUrl: "assets/rules/rule-portrait.png", iconUrl: "assets/icons/rules/rule.png", effects: [] }]
    },
    flow: { steps: [{ id: "name", kind: "metadata", label: "Name", source: { type: "manual" } }] },
    pageSchemas: {},
    patches: [],
    packPath: id
  };
}

describe("resolvePackSet", () => {
  it("loads minimal pack and computes fingerprint", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    expect(resolved.entities.races?.human?.name).toBe("Human");
    expect(resolved.entities.races?.human?._source.packId).toBe("srd-35e-minimal");
    expect(resolved.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("loads abilities config from flow", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    const abilityStep = resolved.flow.steps.find((step) => step.id === "abilities");

    expect(abilityStep?.abilitiesConfig?.defaultMode).toBe("pointBuy");
    expect(abilityStep?.abilitiesConfig?.modes).toEqual(["pointBuy", "phb", "rollSets"]);
  });

  it("loads pack-owned page schemas and exposes them on the resolved pack set", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-page-schema-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.mkdirSync(path.join(packDest, "ui", "pages"), { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "ui", "pages", "character.metadata.page.json"),
      JSON.stringify({
        id: "character.metadata",
        root: {
          id: "metadata-root",
          componentId: "layout.singleColumn",
          children: [
            {
              id: "metadata-name-field",
              componentId: "metadata.nameField",
              slot: "main",
              dataSource: "page.metadata.nameField"
            }
          ]
        }
      })
    );

    fs.writeFileSync(
      path.join(packDest, "flows", "character-creation.flow.json"),
      JSON.stringify({
        steps: [
          {
            id: "name",
            kind: "metadata",
            label: "Identity",
            source: { type: "manual" },
            pageSchemaId: "character.metadata"
          }
        ]
      })
    );

    try {
      const resolved = resolvePackSet(tempRoot, ["srd-35e-minimal"]);

      expect(resolved.flow.steps[0]?.pageSchemaId).toBe("character.metadata");
      expect(resolved.pageSchemas["character.metadata"]?.root.componentId).toBe("layout.singleColumn");
      expect(resolved.pageSchemas["character.metadata"]?.root.children?.[0]?.slot).toBe("main");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails pack resolution when a flow step references a missing page schema id", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-missing-page-schema-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.mkdirSync(path.join(packDest, "ui", "pages"), { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "flows", "character-creation.flow.json"),
      JSON.stringify({
        steps: [
          {
            id: "abilities",
            kind: "abilities",
            label: "Ability Scores",
            source: { type: "manual" },
            pageSchemaId: "character.typoed-abilities"
          }
        ]
      })
    );

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"])).toThrow(
        /missing page schema/i,
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("loads the finalized phb feat catalog with preserved modeled mechanics", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    const featIds = Object.keys(resolved.entities.feats ?? {}).sort();

    expect(featIds.length).toBeGreaterThanOrEqual(107);
    expect(featIds).toContain("power-attack");
    expect(featIds).toContain("brew-potion");
    expect(featIds).toContain("widen-spell");
    expect(featIds).toContain("weapon-focus-longsword");

    expect(resolved.entities.feats?.["power-attack"]?.data).toMatchObject({
      featType: "GENERAL",
      prerequisite: "Str 13.",
      benefit: "On your action, before making attack rolls for a round, you may choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. This number may not exceed your base attack bonus. The penalty on attacks and bonus on damage apply until your next turn."
    });
    expect(resolved.entities.feats?.["power-attack"]?.description).toContain("POWER ATTACK [GENERAL]");
    expect(resolved.entities.feats?.["brew-potion"]?.data).toMatchObject({
      featType: "ITEM CREATION",
      deferredMechanics: expect.any(Array)
    });
    expect(resolved.entities.feats?.["widen-spell"]?.data).toMatchObject({
      featType: "METAMAGIC"
    });
    expect(resolved.entities.feats?.["weapon-focus-longsword"]?.effects).toContainEqual({
      kind: "add",
      targetPath: "stats.attackBonus",
      value: { const: 1 }
    });
    expect(resolved.entities.feats?.["weapon-focus-longsword"]?.data).toMatchObject({
      featType: "GENERAL",
      benefit: "You gain a +1 bonus on all attack rolls you make using the selected weapon."
    });
    expect(resolved.entities.feats?.["brew-potion"]?.description).not.toContain("Table 5");
  });

  it("loads the full SRD core skill list for the minimal pack", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    const skillIds = Object.keys(resolved.entities.skills ?? {}).sort();

    expect(skillIds).toEqual([
      "appraise",
      "balance",
      "bluff",
      "climb",
      "concentration",
      "craft",
      "decipher-script",
      "diplomacy",
      "disable-device",
      "disguise",
      "escape-artist",
      "forgery",
      "gather-information",
      "handle-animal",
      "heal",
      "hide",
      "intimidate",
      "jump",
      "knowledge-arcana",
      "knowledge-architecture-and-engineering",
      "knowledge-dungeoneering",
      "knowledge-geography",
      "knowledge-history",
      "knowledge-local",
      "knowledge-nature",
      "knowledge-nobility-and-royalty",
      "knowledge-religion",
      "knowledge-the-planes",
      "listen",
      "move-silently",
      "open-lock",
      "perform",
      "profession",
      "ride",
      "search",
      "sense-motive",
      "sleight-of-hand",
      "speak-language",
      "spellcraft",
      "spot",
      "survival",
      "swim",
      "tumble",
      "use-magic-device",
      "use-rope"
    ]);
  });

  it("loads an expanded SRD core equipment catalog with category-specific invariants", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);
    const items = Object.values(resolved.entities.items ?? {});
    const byCategory = {
      weapon: items.filter((item) => item.data?.category === "weapon"),
      armor: items.filter((item) => item.data?.category === "armor"),
      shield: items.filter((item) => item.data?.category === "shield"),
      gear: items.filter((item) => item.data?.category === "gear")
    };
    const canonicalDamagePattern = /^\d+d\d+(?:[+-]\d+)?$/;
    const canonicalCritPattern = /^\d{1,2}(?:-\d{1,2})?\/x\d+$/;
    const rangePattern = /^\d+\s*ft\.$/;

    expect(items).toHaveLength(80);
    expect(byCategory.weapon.length).toBeGreaterThanOrEqual(40);
    expect(byCategory.armor.length).toBeGreaterThanOrEqual(10);
    expect(byCategory.shield.length).toBeGreaterThanOrEqual(6);
    expect(byCategory.gear.length).toBeGreaterThanOrEqual(15);

    expect(byCategory.weapon.map((item) => item.id)).toEqual(expect.arrayContaining([
      "dagger",
      "heavy-crossbow",
      "greatsword",
      "composite-longbow"
    ]));
    expect(byCategory.armor.map((item) => item.id)).toEqual(expect.arrayContaining([
      "padded",
      "full-plate"
    ]));
    expect(byCategory.shield.map((item) => item.id)).toEqual(expect.arrayContaining([
      "buckler",
      "tower-shield"
    ]));
    expect(byCategory.gear.map((item) => item.id)).toEqual(expect.arrayContaining([
      "backpack",
      "pouch-belt",
      "rope-hempen"
    ]));

    for (const item of items) {
      expect(item.description).toContain(item.name);
      expect(item.description).toMatch(/\.$/);
      const data = item.data ?? {};
      const speedEffects = (item.effects ?? []).filter(
        (effect) => effect.kind === "set" && effect.targetPath === "stats.speed"
      );
      const acEffects = (item.effects ?? []).filter(
        (effect) => effect.kind === "add" && effect.targetPath === "stats.ac"
      );

      switch (data.category) {
        case "weapon":
          expect(["melee", "ranged"]).toContain(data.weaponType);
          expect(data.damage).toMatch(canonicalDamagePattern);
          expect(data.crit).toMatch(canonicalCritPattern);
          expect(data.armorCheckPenalty).toBeUndefined();
          expect(speedEffects).toEqual([]);
          if (data.range !== undefined) {
            expect(data.range).toMatch(rangePattern);
          }
          if (data.weaponType === "ranged") {
            expect(data.range).toMatch(rangePattern);
          }
          break;
        case "armor":
          expect(data.weaponType).toBeUndefined();
          expect(data.damage).toBeUndefined();
          expect(data.crit).toBeUndefined();
          expect(data.weight).toEqual(expect.any(Number));
          expect(data.armorCheckPenalty).toBeLessThanOrEqual(0);
          expect(acEffects).toHaveLength(1);
          expect(acEffects[0]).toMatchObject({
            kind: "add",
            targetPath: "stats.ac",
            value: { const: expect.any(Number) }
          });
          expect(acEffects[0]?.value.const).toBeGreaterThan(0);
          for (const effect of speedEffects) {
            expect(effect).toMatchObject({
              kind: "set",
              targetPath: "stats.speed",
              value: { const: 20 }
            });
          }
          break;
        case "shield":
          expect(data.weaponType).toBeUndefined();
          expect(data.damage).toBeUndefined();
          expect(data.crit).toBeUndefined();
          expect(data.range).toBeUndefined();
          expect(data.weight).toEqual(expect.any(Number));
          expect(data.armorCheckPenalty).toBeLessThanOrEqual(0);
          expect(acEffects).toHaveLength(1);
          expect(acEffects[0]).toMatchObject({
            kind: "add",
            targetPath: "stats.ac",
            value: { const: expect.any(Number) }
          });
          expect(acEffects[0]?.value.const).toBeGreaterThan(0);
          expect(speedEffects).toEqual([]);
          break;
        case "gear":
          expect(data.weaponType).toBeUndefined();
          expect(data.damage).toBeUndefined();
          expect(data.crit).toBeUndefined();
          expect(data.range).toBeUndefined();
          expect(data.armorCheckPenalty).toBeUndefined();
          expect(item.effects ?? []).toEqual([]);
          break;
        default:
          throw new Error(`Unexpected item category for ${item.id}: ${String(data.category)}`);
      }
    }
  });

  it("loads normalized deferred mechanics metadata from the SRD pack", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);

    expect(resolved.entities.races?.dwarf?.data?.deferredMechanics?.[0]).toMatchObject({
      dependsOn: ["cap:equipment-proficiency", "cap:equipment-validation"],
      impacts: ["proficiency:weapon:dwarven-waraxe", "proficiency:weapon:dwarven-urgrosh"]
    });
    expect(resolved.entities.classes?.barbarian?.data?.deferredMechanics?.[1]).toMatchObject({
      dependsOn: ["cap:alignment-validation", "cap:class-rule-runtime"],
      impacts: ["alignment:restriction"]
    });
    expect(resolved.entities.feats?.manyshot?.data?.deferredMechanics?.[0]).toMatchObject({
      dependsOn: ["cap:combat-attack-sequence", "cap:ammo-consumption"],
      impacts: ["combat:ranged-attack-roll", "attack:multi-projectile"]
    });
  });

  it("ensures all entities expose required UI metadata", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);

    const buckets = ["races", "classes", "feats", "items", "skills", "rules"] as const;
    for (const bucket of buckets) {
      const entities = Object.values(resolved.entities[bucket] ?? {});
      expect(entities.length).toBeGreaterThan(0);
      for (const entity of entities) {
        expect(entity.summary).toEqual(expect.any(String));
        expect(entity.description).toEqual(expect.any(String));
        expect(["string", "object", "undefined"]).toContain(typeof entity.portraitUrl);
        expect(["string", "object", "undefined"]).toContain(typeof entity.iconUrl);
      }
    }
  });

  it("includes all SRD 3.5 core races with baseline movement data", () => {
    const root = path.resolve(process.cwd(), "../../packs");
    const resolved = resolvePackSet(root, ["srd-35e-minimal"]);

    const raceIds = Object.keys(resolved.entities.races ?? {}).sort();
    expect(raceIds).toEqual([
      "dwarf",
      "elf",
      "gnome",
      "half-elf",
      "half-orc",
      "halfling",
      "human"
    ]);

    expect(resolved.entities.races?.dwarf?.data?.size).toBe("medium");
    expect(resolved.entities.races?.dwarf?.data?.vision?.darkvisionFeet).toBe(60);
    expect(resolved.entities.races?.elf?.data?.size).toBe("medium");
    expect(resolved.entities.races?.elf?.data?.vision?.lowLight).toBe(true);
    expect(resolved.entities.races?.elf?.data?.abilityModifiers).toEqual({ dex: 2, con: -2 });
    expect(resolved.entities.races?.elf?.data?.innateSpellLikeAbilities).toEqual([]);
    expect(resolved.entities.races?.gnome?.data?.size).toBe("small");
    expect(resolved.entities.races?.["half-elf"]?.data?.size).toBe("medium");
    expect(resolved.entities.races?.["half-orc"]?.data?.size).toBe("medium");
    expect(resolved.entities.races?.halfling?.data?.size).toBe("small");
    expect(resolved.entities.races?.human?.data?.size).toBe("medium");

    expect(resolved.entities.races?.dwarf?.effects).toContainEqual({
      kind: "set",
      targetPath: "stats.speed",
      value: { const: 20 }
    });
    expect(resolved.entities.races?.human?.effects).toContainEqual({
      kind: "set",
      targetPath: "stats.speed",
      value: { const: 30 }
    });
    expect(resolved.entities.races?.elf?.effects).toContainEqual({
      kind: "add",
      targetPath: "abilities.dex.score",
      value: { const: 2 }
    });
  });

  it("ignores non-directory entries under packs root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-packs-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "README.md"), "not a pack");

    try {
      const resolved = resolvePackSet(tempRoot, ["srd-35e-minimal"]);
      expect(resolved.orderedPackIds).toContain("srd-35e-minimal");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });


  it("fails with contextual error for invalid entity data", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-invalid-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(packDest, "entities", "races.json"), JSON.stringify([{ name: "Broken" }]));

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"]))
        .toThrow(/invalid entity file.*races\.json/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("surfaces malformed rule conditional modifiers through resolvePackSet with entity context", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-invalid-rule-conditional-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(packDest, "entities", "rules.json"), JSON.stringify([
      {
        id: "broken-conditional-rule",
        name: "Broken Conditional Rule",
        entityType: "rules",
        summary: "Broken",
        description: "Broken",
        portraitUrl: null,
        iconUrl: null,
        effects: [],
        data: {
          conditionalModifiers: [
            {
              id: "broken-skill-synergy",
              source: { type: "skillSynergy", ref: "tumble" },
              when: {
                op: "gte",
                left: { kind: "not-skill-ranks", id: "tumble" },
                right: 5
              },
              apply: {
                target: { kind: "skill", id: "balance" },
                bonus: 2
              }
            }
          ]
        }
      }
    ]));

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"]))
        .toThrow(/invalid entity file[\s\S]*rules\.json[\s\S]*broken-conditional-rule[\s\S]*conditionalModifiers/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("accepts legacy mixed-case conditional modifiers during pack resolution", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-legacy-rule-conditional-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(path.join(packDest, "entities", "rules.json"), JSON.stringify([
      {
        id: "legacy-conditional-rule",
        name: "Legacy Conditional Rule",
        entityType: "rules",
        summary: "Legacy",
        description: "Legacy",
        portraitUrl: null,
        iconUrl: null,
        effects: [],
        data: {
          conditionalModifiers: [
            {
              id: "legacy-skill-synergy",
              source: { type: "skillSynergy", ref: "tumble" },
              when: {
                op: "Or",
                args: [
                  {
                    op: "GTE",
                    left: { kind: "SKILLRANKS", id: "tumble" },
                    right: 5
                  },
                  {
                    op: "isProficient",
                    target: { kind: "SkIlL", id: "balance" }
                  }
                ]
              },
              apply: {
                target: { kind: "skill", id: "balance" },
                bonus: 2
              }
            }
          ]
        }
      }
    ]));

    try {
      const resolved = resolvePackSet(tempRoot, ["srd-35e-minimal"]);
      expect(resolved.entities.rules?.["legacy-conditional-rule"]?.id).toBe("legacy-conditional-rule");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });


  it("fails when entityType does not match entity file bucket", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dcb-entitytype-pack-"));
    const packsSrc = path.resolve(process.cwd(), "../../packs/srd-35e-minimal");
    const packDest = path.join(tempRoot, "srd-35e-minimal");

    fs.cpSync(packsSrc, packDest, { recursive: true });
    fs.writeFileSync(
      path.join(packDest, "entities", "races.json"),
      JSON.stringify([{
        id: "oops",
        name: "Oops",
        entityType: "classes",
        summary: "s",
        description: "d",
        portraitUrl: "p",
        iconUrl: "i",
        data: {
          skillPointsPerLevel: 2,
          classSkills: [],
          hitDie: 10,
          baseAttackProgression: "full",
          baseSaveProgression: { fort: "good", ref: "poor", will: "poor" },
          levelTable: [{ level: 1, bab: 1, fort: 2, ref: 0, will: 0 }]
        }
      }])
    );

    try {
      expect(() => resolvePackSet(tempRoot, ["srd-35e-minimal"]))
        .toThrow(/expected races/i);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("preserves dependency order even when priority conflicts", () => {
    const base = makePack("base", 100);
    const addon = makePack("addon", 1, ["base"]);
    const independent = makePack("independent", 0);

    const sorted = topoSortPacks([base, addon, independent], ["addon", "independent"]);
    const ids = sorted.map((pack) => pack.manifest.id);

    expect(ids.indexOf("base")).toBeLessThan(ids.indexOf("addon"));
    expect(ids).toEqual(["independent", "base", "addon"]);
  });

  it("tracks source pack metadata for overriding patches", () => {
    const base = makePack("base", 1);
    base.entities.rules = [{ id: "shared", name: "Shared", entityType: "rules", summary: "Shared rule", description: "Shared rule desc", portraitUrl: "assets/rules/shared-portrait.png", iconUrl: "assets/icons/rules/shared.png", effects: [] }];

    const override = makePack("override", 2, ["base"]);
    override.patches = [{ op: "mergeEntity", entityType: "rules", id: "shared", value: { name: "Overridden" } }];

    const resolved = resolveLoadedPacks([base, override], ["override"]);
    expect(resolved.entities.rules?.shared?.name).toBe("Overridden");
    expect(resolved.entities.rules?.shared?._source.packId).toBe("override");
    expect(resolved.entities.rules?.shared?._source.entityId).toBe("shared");
  });

  it("builds conditional skill modifier indexes from patched resolved entities", () => {
    const base = makePack("base", 1);
    base.entities.rules = [{
      id: "shared-conditional-rule",
      name: "Shared Conditional Rule",
      entityType: "rules",
      summary: "Shared conditional rule",
      description: "Shared conditional rule desc",
      portraitUrl: "assets/rules/shared-conditional-rule-portrait.png",
      iconUrl: "assets/icons/rules/shared-conditional-rule.png",
      effects: [],
      data: {
        conditionalModifiers: [{
          id: "climb-to-balance",
          source: { type: "skillSynergy", ref: "climb" },
          when: {
            op: "gte",
            left: { kind: "skillRanks", id: "climb" },
            right: 5
          },
          apply: {
            target: { kind: "skill", id: "balance" },
            bonus: 2
          }
        }]
      }
    }];

    const override = makePack("override", 2, ["base"]);
    override.patches = [{
      op: "mergeEntity",
      entityType: "rules",
      id: "shared-conditional-rule",
      value: {
        data: {
          conditionalModifiers: [{
            id: "climb-to-balance",
            source: { type: "skillSynergy", ref: "climb" },
            when: {
              op: "gte",
              left: { kind: "skillRanks", id: "climb" },
              right: 5
            },
            apply: {
              target: { kind: "skill", id: "balance" },
              bonus: 4,
              note: "patched"
            }
          }]
        }
      }
    }];

    const resolved = resolveLoadedPacks([base, override], ["override"]);

    expect(resolved.conditionalSkillModifiers).toEqual([
      expect.objectContaining({
        id: "climb-to-balance",
        sourceType: "skillSynergy",
        source: {
          packId: "override",
          entityType: "rules",
          entityId: "shared-conditional-rule"
        },
        apply: expect.objectContaining({
          targetSkillId: "balance",
          bonus: 4,
          note: "patched"
        })
      })
    ]);
  });
});
