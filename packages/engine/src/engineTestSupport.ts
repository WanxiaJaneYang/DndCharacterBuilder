import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { LoadedPack } from "@dcb/datapack";
import { resolveLoadedPacks } from "@dcb/datapack";
import { resolvePackSet } from "@dcb/datapack/node";
import * as enginePublicApi from "./public";
import * as engineLegacyApi from "./legacy";
import { compute, normalizeCharacterSpec, validateCharacterSpec } from "./public";
import { applyChoice, finalizeCharacter, initialState, listChoices, validateState } from "./legacy";
import { characterSpecToState } from "./characterSpec";

const resolved = resolvePackSet(path.resolve(process.cwd(), "../../packs"), ["srd-35e-minimal"]);
const context = { enabledPackIds: ["srd-35e-minimal"], resolvedData: resolved };
const canonicalComputeContractFixture = new URL(
  "./__fixtures__/compute-contract-human-fighter-1.golden.json",
  import.meta.url
);

function makePack(id: string, priority: number, dependencies: string[] = []): LoadedPack {
  return {
    manifest: { id, name: id, version: "1.0.0", priority, dependencies },
    entities: {
      races: [{ id: "human", name: "Human", entityType: "races", summary: "Human", description: "Human race", portraitUrl: "assets/races/human-portrait.png", iconUrl: "assets/icons/races/human.png", effects: [], data: { size: "medium", baseSpeed: 30, abilityModifiers: {}, vision: { lowLight: false, darkvisionFeet: 0 }, automaticLanguages: ["Common"], bonusLanguages: ["Any"], favoredClass: "any", racialTraits: [] } }],
      classes: [{ id: "fighter", name: "Fighter", entityType: "classes", summary: "Fighter", description: "Fighter class", portraitUrl: "assets/classes/fighter-portrait.png", iconUrl: "assets/icons/classes/fighter.png", effects: [] }],
      feats: [],
      items: [],
      skills: [],
      rules: [{ id: "base-ac", name: "Base AC", entityType: "rules", summary: "Base AC", description: "Base AC rule", portraitUrl: "assets/rules/base-ac-portrait.png", iconUrl: "assets/icons/rules/base-ac.png", effects: [{ kind: "set", targetPath: "stats.ac", value: { const: 10 } }] }]
    },
    flow: {
      steps: [
        { id: "name", kind: "metadata", label: "Name", source: { type: "manual" } },
        { id: "abilities", kind: "abilities", label: "Ability Scores", source: { type: "manual" } },
        { id: "race", kind: "race", label: "Race", source: { type: "entityType", entityType: "races", limit: 1 } },
        { id: "class", kind: "class", label: "Class", source: { type: "entityType", entityType: "classes", limit: 1 } }
      ]
    },
    patches: [],
    packPath: id
  };
}

export {
  applyChoice,
  canonicalComputeContractFixture,
  characterSpecToState,
  compute,
  context,
  describe,
  engineLegacyApi,
  enginePublicApi,
  expect,
  finalizeCharacter,
  fs,
  initialState,
  it,
  listChoices,
  makePack,
  normalizeCharacterSpec,
  resolveLoadedPacks,
  validateCharacterSpec,
  validateState
};
