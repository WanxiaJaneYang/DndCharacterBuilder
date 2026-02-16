import fs from "node:fs";
import path from "node:path";
import { ContractFixtureSchema } from "@dcb/schema";
import { resolvePackSet } from "@dcb/datapack";
import { applyChoice, finalizeCharacter, initialState, listChoices, validateState, type CharacterState } from "@dcb/engine";

function containsSubset(target: Record<string, unknown>, subset: Record<string, unknown>): boolean {
  return Object.entries(subset).every(([k, v]) => {
    const tv = target[k];
    if (typeof v === "object" && v !== null && typeof tv === "object" && tv !== null) return containsSubset(tv as Record<string, unknown>, v as Record<string, unknown>);
    return tv === v;
  });
}

export function runContracts(packsRoot: string): void {
  const packDirs = fs.readdirSync(packsRoot).map((name) => path.join(packsRoot, name));
  for (const packDir of packDirs) {
    const contractsDir = path.join(packDir, "contracts");
    if (!fs.existsSync(contractsDir)) continue;
    for (const file of fs.readdirSync(contractsDir).filter((f) => f.endsWith(".json"))) {
      const fixture = ContractFixtureSchema.parse(JSON.parse(fs.readFileSync(path.join(contractsDir, file), "utf8")));
      const resolved = resolvePackSet(packsRoot, fixture.enabledPacks);
      const context = { enabledPackIds: fixture.enabledPacks, resolvedData: resolved };
      let state: CharacterState = { ...initialState, ...(fixture.initialState as Partial<CharacterState>) };
      for (const action of fixture.actions) {
        state = applyChoice(state, action.choiceId, action.selection);
      }

      const choices = listChoices(state, context).flatMap((c) => c.options.map((o) => o.id));
      for (const expected of fixture.expected.availableChoicesContains ?? []) {
        if (!choices.includes(expected)) throw new Error(`Expected choice ${expected} not found in ${file}`);
      }

      const errors = validateState(state, context);
      const errorCodes = errors.map((e) => e.code);
      for (const expectedCode of fixture.expected.validationErrorCodes ?? []) {
        if (!errorCodes.includes(expectedCode)) throw new Error(`Expected validation code ${expectedCode} not found in ${file}`);
      }

      const final = finalizeCharacter(state, context) as unknown as Record<string, unknown>;
      if (fixture.expected.finalSheetSubset && !containsSubset(final, fixture.expected.finalSheetSubset)) {
        throw new Error(`Expected final sheet subset mismatch in ${file}`);
      }
    }
  }
}
