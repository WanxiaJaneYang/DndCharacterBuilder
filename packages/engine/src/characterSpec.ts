type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface CharacterState {
  metadata: { name?: string };
  abilities: Record<string, number>;
  selections: Record<string, unknown>;
}

export interface CharacterSpecMeta {
  name?: string;
  rulesetId: string;
  sourceIds: string[];
}

export interface CharacterSpecClassSelection {
  classId: string;
  level: number;
}

export interface CharacterSpec {
  meta: CharacterSpecMeta;
  raceId?: string;
  class?: CharacterSpecClassSelection;
  abilities: Record<AbilityKey, number>;
  skillRanks?: Record<string, number>;
  featIds?: string[];
  equipmentIds?: string[];
  overrides?: Record<string, unknown>;
}

export interface CharacterSpecValidationIssue {
  code: string;
  message: string;
  path?: string;
}

function normalizeSkillId(id: string): string {
  return id.trim().toLowerCase();
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseFiniteSkillRank(value: unknown): number | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return undefined;
  return Math.floor(numeric * 2) / 2;
}

function normalizeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeUniqueIdList(values: string[] | undefined): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  const normalized = values
    .map((value) => normalizeId(value))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

function normalizeClassSelection(
  value: CharacterSpecClassSelection | undefined
): CharacterSpecClassSelection | undefined {
  if (!value) return undefined;
  const classId = normalizeId(value.classId);
  if (!classId) return undefined;
  const level = Number(value.level);
  return {
    classId,
    level: Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1
  };
}

function toClassSelectionId(selection: CharacterSpecClassSelection | undefined): string | undefined {
  if (!selection) return undefined;
  const baseClassId = selection.classId.replace(/-\d+$/, "");
  return selection.level > 1 ? `${baseClassId}-${selection.level}` : baseClassId;
}

export function normalizeCharacterSpec(spec: CharacterSpec): CharacterSpec {
  const skillRanks = Object.fromEntries(
    Object.entries(spec.skillRanks ?? {})
      .map(([skillId, value]) => {
        const normalizedSkillId = normalizeSkillId(skillId);
        const parsed = parseFiniteSkillRank(value);
        if (!normalizedSkillId || parsed === undefined) return undefined;
        return [normalizedSkillId, parsed] as const;
      })
      .filter((entry): entry is readonly [string, number] => Boolean(entry))
  );

  const normalizedMeta: CharacterSpecMeta = {
    ...(spec.meta.name !== undefined ? { name: normalizeString(spec.meta.name) } : {}),
    rulesetId: normalizeId(spec.meta.rulesetId) ?? "",
    sourceIds: normalizeUniqueIdList(spec.meta.sourceIds) ?? []
  };

  const normalized: CharacterSpec = {
    meta: normalizedMeta,
    abilities: { ...spec.abilities },
    skillRanks,
    featIds: normalizeUniqueIdList(spec.featIds) ?? [],
    equipmentIds: normalizeUniqueIdList(spec.equipmentIds) ?? []
  };

  const normalizedRaceId = normalizeId(spec.raceId);
  if (normalizedRaceId) {
    normalized.raceId = normalizedRaceId;
  }

  const normalizedClass = normalizeClassSelection(spec.class);
  if (normalizedClass) {
    normalized.class = normalizedClass;
  }

  if (spec.overrides !== undefined) {
    normalized.overrides = spec.overrides;
  }

  return normalized;
}

export function validateCharacterSpec(spec: CharacterSpec): CharacterSpecValidationIssue[] {
  const normalized = normalizeCharacterSpec(spec);
  const issues: CharacterSpecValidationIssue[] = [];

  if (normalized.meta.rulesetId.length === 0) {
    issues.push({
      code: "SPEC_META_RULESET_REQUIRED",
      message: "meta.rulesetId is required.",
      path: "meta.rulesetId"
    });
  }

  if (!Array.isArray((spec as { meta?: { sourceIds?: unknown } }).meta?.sourceIds)) {
    issues.push({
      code: "SPEC_META_SOURCEIDS_INVALID",
      message: "meta.sourceIds must be an array.",
      path: "meta.sourceIds"
    });
  }

  for (const ability of ABILITY_KEYS) {
    const value = normalized.abilities[ability];
    if (!Number.isFinite(value)) {
      issues.push({
        code: "SPEC_ABILITIES_INVALID",
        message: `abilities.${ability} must be a finite number.`,
        path: `abilities.${ability}`
      });
    }
  }

  if (spec.class !== undefined && spec.class !== null && typeof spec.class === "object") {
    const rawLevel = Number((spec.class as { level?: unknown }).level);
    if (!Number.isInteger(rawLevel) || rawLevel < 1) {
      issues.push({
        code: "SPEC_CLASS_LEVEL_INVALID",
        message: "class.level must be an integer >= 1.",
        path: "class.level"
      });
    }
  }

  return issues;
}

export function characterSpecToState(spec: CharacterSpec): CharacterState {
  const normalized = normalizeCharacterSpec(spec);
  const hasSkillRanks = Object.keys(normalized.skillRanks ?? {}).length > 0;
  return {
    metadata: normalized.meta.name?.length ? { name: normalized.meta.name } : {},
    abilities: { ...normalized.abilities },
    selections: {
      ...(normalized.raceId ? { race: normalized.raceId } : {}),
      ...(toClassSelectionId(normalized.class) ? { class: toClassSelectionId(normalized.class) } : {}),
      ...(hasSkillRanks ? { skills: normalized.skillRanks } : {}),
      feats: normalized.featIds ?? [],
      equipment: normalized.equipmentIds ?? []
    }
  };
}
