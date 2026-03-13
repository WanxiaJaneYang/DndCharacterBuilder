import fs from "node:fs";
import path from "node:path";
import { ContractFixtureSchema, type ContractFixture } from "@dcb/schema";
import { resolvePackSet } from "@dcb/datapack/node";
import { compute, type CharacterSpec } from "@dcb/engine";
import { applyChoice, finalizeCharacter, initialState, listChoices, validateState, type CharacterState } from "@dcb/engine/legacy";
export { runAuthenticityChecks } from "./authenticity";
import { assertPackReferenceIntegrity } from "./references";

const NON_ASCII_PATTERN = /[^\x00-\x7F]/;
const BIDI_CONTROL_PATTERN = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findBidiControlPath(value: unknown, currentPath = "$"): string | null {
  if (typeof value === "string") {
    return BIDI_CONTROL_PATTERN.test(value) ? currentPath : null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findBidiControlPath(value[index], `${currentPath}[${index}]`);
      if (nestedPath) return nestedPath;
    }
    return null;
  }

  if (isRecord(value)) {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nestedPath = findBidiControlPath(nestedValue, `${currentPath}.${key}`);
      if (nestedPath) return nestedPath;
    }
  }

  return null;
}

function containsSubset(target: unknown, subset: unknown): boolean {
  if (Array.isArray(subset)) {
    return Array.isArray(target) &&
      target.length === subset.length &&
      subset.every((value, index) => containsSubset(target[index], value));
  }

  if (isRecord(subset)) {
    return isRecord(target) &&
      Object.entries(subset).every(([key, value]) => containsSubset(target[key], value));
  }

  return target === subset;
}

export function assertContractFixturesUseAscii(packsRoot: string): void {
  const packDirs = fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsRoot, entry.name));

  for (const packDir of packDirs) {
    const contractsDir = path.join(packDir, "contracts");
    if (!fs.existsSync(contractsDir)) continue;

    for (const file of fs.readdirSync(contractsDir).filter((entry) => entry.endsWith(".json"))) {
      const fixturePath = path.join(contractsDir, file);
      const fixtureText = fs.readFileSync(fixturePath, "utf8");
      if (NON_ASCII_PATTERN.test(fixtureText)) {
        contractFailure(path.basename(packDir), file, "Contract fixtures must be ASCII-only", "ASCII text", "non-ASCII content detected");
      }

      const bidiPath = findBidiControlPath(JSON.parse(fixtureText));
      if (bidiPath) {
        contractFailure(
          path.basename(packDir),
          file,
          "Contract fixtures must not contain bidirectional control characters",
          "No bidi control characters",
          `bidi control character detected at ${bidiPath}`
        );
      }
    }
  }
}

function shortSnippet(value: unknown): string {
  const text = JSON.stringify(value, null, 2);
  return text.length > 360 ? `${text.slice(0, 360)}…` : text;
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

type ComputeContractFixture = Extract<ContractFixture, { characterSpec: Record<string, unknown> }>;
type LegacyContractFixture = Extract<ContractFixture, { initialState: Record<string, unknown> }>;

function isComputeContractFixture(fixture: ContractFixture): fixture is ComputeContractFixture {
  return "characterSpec" in fixture;
}

function isLegacyContractFixture(fixture: ContractFixture): fixture is LegacyContractFixture {
  return "initialState" in fixture;
}

export function runContracts(packsRoot: string): void {
  assertContractFixturesUseAscii(packsRoot);
  assertPackReferenceIntegrity(packsRoot);
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

      if (isComputeContractFixture(fixture)) {
        const result = compute(fixture.characterSpec as unknown as CharacterSpec, context);
        const validationIssueCodes = result.validationIssues.map((issue) => issue.code);
        const expectedValidationIssueCodes = fixture.expected.validationIssueCodes;
        if (expectedValidationIssueCodes && !arraysEqual(validationIssueCodes, expectedValidationIssueCodes)) {
          contractFailure(packId, file, "Validation issue codes mismatch", expectedValidationIssueCodes, validationIssueCodes);
        }

        if (fixture.expected.computeResultSubset && !containsSubset(result as unknown as Record<string, unknown>, fixture.expected.computeResultSubset)) {
          contractFailure(packId, file, "ComputeResult subset mismatch", fixture.expected.computeResultSubset, result);
        }
        continue;
      }

      if (!isLegacyContractFixture(fixture)) {
        contractFailure(packId, file, "Unsupported contract fixture shape", "legacy or compute fixture", fixture);
      }

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
      const expectedErrorCodes = fixture.expected.validationErrorCodes;
      if (expectedErrorCodes && !arraysEqual(errorCodes, expectedErrorCodes)) {
        contractFailure(packId, file, "Validation error codes mismatch", expectedErrorCodes, errorCodes);
      }

      const final = finalizeCharacter(state, context) as unknown as Record<string, unknown>;
      if (fixture.expected.finalSheetSubset && !containsSubset(final, fixture.expected.finalSheetSubset)) {
        contractFailure(packId, file, "Final sheet subset mismatch", fixture.expected.finalSheetSubset, final);
      }
    }
  }
}
