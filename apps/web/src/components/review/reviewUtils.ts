import { DEFAULT_STATS, type ComputeResult } from "@dcb/engine";

export const REVIEW_ABILITY_ORDER = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
] as const;

export const REVIEW_STAT_ORDER = [
  "hp",
  "ac",
  "initiative",
  "speed",
  "bab",
  "fort",
  "ref",
  "will",
] as const;

export function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function getReviewStatBaseDefaults() {
  return {
    hp: DEFAULT_STATS.hp,
    ac: DEFAULT_STATS.ac,
    initiative: DEFAULT_STATS.initiative,
    speed: DEFAULT_STATS.speed,
    bab: DEFAULT_STATS.bab,
    fort: DEFAULT_STATS.fort,
    ref: DEFAULT_STATS.ref,
    will: DEFAULT_STATS.will,
  } as const;
}

export function createFormatSourceLabel(
  sourceNameByEntityId: Map<string, string>,
  unresolvedLabel: string,
) {
  return (packId: string, entityId: string) =>
    sourceNameByEntityId.get(`${packId}:${entityId}`) ?? unresolvedLabel;
}

export type ReviewSkills = ComputeResult["sheetViewModel"]["data"]["skills"];
