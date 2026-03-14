import type { CharacterSpec, CharacterState } from "./characterSpec";
import type { ComputeResultAssumptionEntry } from "./computeTypes";

type AbilityKey = keyof CharacterState["abilities"];

const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

const STEP_ID_TO_SPEC_PATH: Record<string, string> = {
  name: "meta.name",
  abilities: "abilities",
  race: "raceId",
  races: "raceId",
  class: "class.classId",
  classes: "class.classId",
  feat: "featIds",
  feats: "featIds",
  skills: "skillRanks",
  equipment: "equipmentIds",
  items: "equipmentIds"
};

export function mapStepIdToSpecPath(stepId: string): string | undefined {
  return STEP_ID_TO_SPEC_PATH[stepId];
}

export function buildComputeStateFromSpec(spec: CharacterSpec): CharacterState {
  const hasSkillRanks = Object.keys(spec.skillRanks ?? {}).length > 0;
  const classId = spec.class
    ? spec.class.level > 1
      ? `${spec.class.classId.replace(/-\d+$/, "")}-${spec.class.level}`
      : spec.class.classId.replace(/-\d+$/, "")
    : undefined;

  return {
    metadata: spec.meta.name?.length ? { name: spec.meta.name } : {},
    abilities: { ...spec.abilities },
    selections: {
      ...(spec.raceId ? { race: spec.raceId } : {}),
      ...(classId ? { class: classId } : {}),
      ...(hasSkillRanks ? { skills: spec.skillRanks } : {}),
      feats: spec.featIds ?? [],
      equipment: spec.equipmentIds ?? []
    }
  };
}

export function sanitizeStateForComputeOutput(
  state: CharacterState
): { state: CharacterState; assumptions: ComputeResultAssumptionEntry[] } {
  let nextState: CharacterState | undefined;
  const assumptions: ComputeResultAssumptionEntry[] = [];

  const toSanitizedAbilityScore = (
    value: unknown
  ): { valid: true; numeric: number } | { valid: false } => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? { valid: true, numeric: value } : { valid: false };
    }
    if (typeof value !== "string") return { valid: false };

    const trimmed = value.trim();
    if (!trimmed) return { valid: false };
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return { valid: false };

    try {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? { valid: true, numeric } : { valid: false };
    } catch {
      return { valid: false };
    }
  };

  for (const ability of ABILITY_KEYS) {
    const sanitized = toSanitizedAbilityScore(state.abilities[ability]);
    if (sanitized.valid) {
      if (sanitized.numeric === state.abilities[ability]) continue;
      nextState ??= {
        ...state,
        abilities: { ...state.abilities }
      };
      nextState.abilities[ability] = sanitized.numeric;
      continue;
    }

    nextState ??= {
      ...state,
      abilities: { ...state.abilities }
    };
    nextState.abilities[ability] = 10;
    assumptions.push({
      code: "SPEC_ABILITY_DEFAULTED",
      message: `${ability.toUpperCase()} was defaulted to 10 for compute output because the input value was not finite.`,
      path: `abilities.${ability}`,
      defaultUsed: 10
    });
  }

  return {
    state: nextState ?? state,
    assumptions
  };
}
