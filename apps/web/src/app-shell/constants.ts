import { loadMinimalPack } from "../loadMinimalPack";

export const embeddedPacks = [loadMinimalPack()];

export const STEP_ID_FEAT = "feat";
export const STEP_ID_SKILLS = "skills";
export const STEP_ID_ABILITIES = "abilities";
export const DEFAULT_EXPORT_NAME = "character";
export const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
export const DEFAULT_ABILITY_MIN = 3;
export const DEFAULT_ABILITY_MAX = 18;

export type Role = "dm" | "player" | null;
