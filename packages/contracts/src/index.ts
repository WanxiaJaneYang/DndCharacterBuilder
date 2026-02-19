import fs from "node:fs";
import path from "node:path";
import { ContractFixtureSchema } from "@dcb/schema";
import { resolvePackSet } from "@dcb/datapack/node";
import { applyChoice, finalizeCharacter, initialState, listChoices, validateState, type CharacterState } from "@dcb/engine";
export { runAuthenticityChecks } from "./authenticity";

function containsSubset(target: Record<string, unknown>, subset: Record<string, unknown>): boolean {
  return Object.entries(subset).every(([k, v]) => {
    const tv = target[k];
    if (typeof v === "object" && v !== null && typeof tv === "object" && tv !== null) return containsSubset(tv as Record<string, unknown>, v as Record<string, unknown>);
    return tv === v;
  });
}

function shortSnippet(value: unknown): string {
  const text = JSON.stringify(value, null, 2);
  return text.length > 360 ? `${text.slice(0, 360)}…` : text;
}

function contractFailure(packId: string, fixtureFile: string, message: string, expected: unknown, actual: unknown): never {
  throw new Error([
    `[contracts] ${message}`,
    `  pack: ${packId}`,
    `  fixture: ${fixtureFile}`,
    `  expected: ${shortSnippet(expected)}`,
    `  actual: ${shortSnippet(actual)}`
  ].join("\n"));
}

export function runContracts(packsRoot: string): void {
  const packDirs = fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name));
  for (const packDir of packDirs) {
    const packId = path.basename(packDir);
    const contractsDir = path.join(packDir, "contracts");
    if (!fs.existsSync(contractsDir)) continue;
    for (const file of fs.readdirSync(contractsDir).filter((f) => f.endsWith(".json"))) {
      const fixturePath = path.join(contractsDir, file);
      const fixture = ContractFixtureSchema.parse(JSON.parse(fs.readFileSync(fixturePath, "utf8")));
      const resolved = resolvePackSet(packsRoot, fixture.enabledPacks);
      const context = { enabledPackIds: fixture.enabledPacks, resolvedData: resolved };
      let state: CharacterState = { ...initialState, ...(fixture.initialState as Partial<CharacterState>) };
      for (const action of fixture.actions) {
        state = applyChoice(state, action.choiceId, action.selection, context);
      }

      const choices = listChoices(state, context).flatMap((c) => c.options.map((o) => o.id));
      for (const expected of fixture.expected.availableChoicesContains ?? []) {
        if (!choices.includes(expected)) {
          contractFailure(packId, file, "Expected choice was not available", expected, choices);
        }
      }

      const errors = validateState(state, context);
      const errorCodes = errors.map((e) => e.code);
      for (const expectedCode of fixture.expected.validationErrorCodes ?? []) {
        if (!errorCodes.includes(expectedCode)) {
          contractFailure(packId, file, "Expected validation code was not produced", expectedCode, errorCodes);
        }
      }

      const final = finalizeCharacter(state, context) as unknown as Record<string, unknown>;
      if (fixture.expected.finalSheetSubset && !containsSubset(final, fixture.expected.finalSheetSubset)) {
        contractFailure(packId, file, "Final sheet subset mismatch", fixture.expected.finalSheetSubset, final);
      }
    }
  }
}
