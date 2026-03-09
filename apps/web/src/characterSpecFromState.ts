import type { CharacterSpec, CharacterState } from "@dcb/engine";

type CharacterSpecFromStateInput = {
  state: CharacterState;
  rulesetId: string;
  sourceIds: string[];
};

function toClassSelection(value: unknown): CharacterSpec["class"] {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^(.*)-(\d+)$/);
  if (!match) {
    return { classId: trimmed, level: 1 };
  }

  const [, classId, levelText] = match;
  if (!classId) {
    return { classId: trimmed, level: 1 };
  }
  const level = Number(levelText);
  return {
    classId,
    level: Number.isInteger(level) && level > 0 ? level : 1,
  };
}

export function characterSpecFromState({
  state,
  rulesetId,
  sourceIds,
}: CharacterSpecFromStateInput): CharacterSpec {
  const classSelection = toClassSelection(state.selections.class);

  return {
    meta: {
      ...(state.metadata.name ? { name: state.metadata.name } : {}),
      rulesetId,
      sourceIds,
    },
    ...(typeof state.selections.race === "string"
      ? { raceId: state.selections.race }
      : {}),
    ...(classSelection ? { class: classSelection } : {}),
    abilities: {
      str: Number(state.abilities.str),
      dex: Number(state.abilities.dex),
      con: Number(state.abilities.con),
      int: Number(state.abilities.int),
      wis: Number(state.abilities.wis),
      cha: Number(state.abilities.cha),
    },
    ...(state.selections.skills &&
    typeof state.selections.skills === "object" &&
    !Array.isArray(state.selections.skills)
      ? { skillRanks: state.selections.skills as Record<string, number> }
      : {}),
    ...(Array.isArray(state.selections.feats)
      ? { featIds: state.selections.feats as string[] }
      : {}),
    ...(Array.isArray(state.selections.equipment)
      ? { equipmentIds: state.selections.equipment as string[] }
      : {}),
  };
}
