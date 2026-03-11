const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
const DEFAULT_ABILITY_MAX = 18;

export type AbilityMode = "pointBuy" | "phb" | "rollSets";

export type AbilityStepConfig = {
  modes?: AbilityMode[];
  defaultMode?: AbilityMode;
  pointBuy?: {
    costTable?: Record<string, number>;
    defaultPointCap?: number;
    minPointCap?: number;
    maxPointCap?: number;
    pointCapStep?: number;
    minScore?: number;
    maxScore?: number;
  };
  phb?: {
    methodType?: "standardArray" | "manualRange";
    standardArray?: number[];
    manualRange?: { minScore?: number; maxScore?: number };
  };
  rollSets?: {
    setsCount?: number;
    rollFormula?: string;
    scoresPerSet?: number;
    assignmentPolicy?: "assign_after_pick";
  };
};

export type AbilityPresentationConfig = {
  showExistingModifiers?: boolean;
  groupBy?: "sourceType";
  hideZeroEffectGroups?: boolean;
  sourceTypeLabels?: Record<string, string>;
  modeUi?: Partial<
    Record<AbilityMode, { labelKey?: string; hintKey?: string }>
  >;
};

export type SkillBudgetSummary = {
  total: number;
  spent: number;
  remaining: number;
};

export type LocalSkillUiDetail = {
  classSkill: boolean;
  costPerRank: number;
  costSpent: number;
  maxRanks: number;
  racialBonus: number;
};

const DEFAULT_ABILITY_MIN = 3;
const SRD_MEDIUM_LOAD_TABLE: Array<
  { light: number; medium: number; heavy: number } | null
> = [
  null,
  { light: 3, medium: 6, heavy: 10 },
  { light: 6, medium: 13, heavy: 20 },
  { light: 10, medium: 20, heavy: 30 },
  { light: 13, medium: 26, heavy: 40 },
  { light: 16, medium: 33, heavy: 50 },
  { light: 20, medium: 40, heavy: 60 },
  { light: 23, medium: 46, heavy: 70 },
  { light: 26, medium: 53, heavy: 80 },
  { light: 30, medium: 60, heavy: 90 },
  { light: 33, medium: 66, heavy: 100 },
  { light: 38, medium: 76, heavy: 115 },
  { light: 43, medium: 86, heavy: 130 },
  { light: 50, medium: 100, heavy: 150 },
  { light: 58, medium: 116, heavy: 175 },
  { light: 66, medium: 133, heavy: 200 },
  { light: 76, medium: 153, heavy: 230 },
  { light: 86, medium: 173, heavy: 260 },
  { light: 100, medium: 200, heavy: 300 },
  { light: 116, medium: 233, heavy: 350 },
  { light: 133, medium: 266, heavy: 400 },
  { light: 153, medium: 306, heavy: 460 },
  { light: 173, medium: 346, heavy: 520 },
  { light: 200, medium: 400, heavy: 600 },
  { light: 233, medium: 466, heavy: 700 },
  { light: 266, medium: 533, heavy: 800 },
  { light: 306, medium: 613, heavy: 920 },
  { light: 346, medium: 693, heavy: 1040 },
  { light: 400, medium: 800, heavy: 1200 },
  { light: 466, medium: 933, heavy: 1400 },
];

const FIRST_LEVEL_SKILL_MULTIPLIER = 4;

export function getEntityDataRecord(
  entity: { data?: unknown } | undefined,
): Record<string, unknown> {
  if (!entity?.data || typeof entity.data !== "object" || Array.isArray(entity.data)) {
    return {};
  }
  return entity.data as Record<string, unknown>;
}

export function getEntityDataNumber(
  entity: { data?: unknown } | undefined,
  key: string,
  fallback = 0,
): number {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getEntityDataString(
  entity: { data?: unknown } | undefined,
  key: string,
): string {
  const value = getEntityDataRecord(entity)[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getClassSkillIds(
  classEntity: { data?: unknown } | undefined,
): Set<string> {
  const raw = getEntityDataRecord(classEntity).classSkills;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map((entry) => String(entry ?? "").trim()).filter(Boolean));
}

export function getCharacterLevel(
  classSelection: { level: number } | undefined,
): number {
  const level = Number(classSelection?.level ?? 0);
  return Number.isInteger(level) && level > 0 ? level : 0;
}

export function getSkillMaxRanksForLevel(
  level: number,
  classSkill: boolean,
): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  return classSkill ? level + 3 : (level + 3) / 2;
}

export function getRacialTraitIds(
  raceEntity: { data?: unknown } | undefined,
): Set<string> {
  const raw = getEntityDataRecord(raceEntity).racialTraits;
  if (!Array.isArray(raw)) return new Set();
  return new Set(
    raw
      .map((entry) =>
        entry && typeof entry === "object" && !Array.isArray(entry)
          ? String((entry as Record<string, unknown>).id ?? "").trim()
          : "",
      )
      .filter(Boolean),
  );
}

export function getRacialSkillBonuses(
  raceEntity: { data?: unknown } | undefined,
): Map<string, number> {
  const raw = getEntityDataRecord(raceEntity).skillBonuses;
  const bonuses = new Map<string, number>();
  if (!Array.isArray(raw)) return bonuses;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const skillId = String(record.skill ?? "").trim();
    const bonus = Number(record.bonus ?? 0);
    if (!skillId || !Number.isFinite(bonus)) continue;
    bonuses.set(skillId, (bonuses.get(skillId) ?? 0) + bonus);
  }
  return bonuses;
}

export function getSrdMediumLoadLimits(strScore: number): {
  light: number;
  medium: number;
  heavy: number;
} {
  const normalizedScore = Number.isFinite(strScore)
    ? Math.max(1, Math.floor(strScore))
    : 10;
  if (normalizedScore < SRD_MEDIUM_LOAD_TABLE.length) {
    return SRD_MEDIUM_LOAD_TABLE[normalizedScore] ?? {
      light: 0,
      medium: 0,
      heavy: 0,
    };
  }
  const baseEntry = SRD_MEDIUM_LOAD_TABLE[20]!;
  const incrementsOfTen = Math.floor((normalizedScore - 20) / 10);
  const remainderScore = normalizedScore - incrementsOfTen * 10;
  const remainderEntry = SRD_MEDIUM_LOAD_TABLE[remainderScore] ?? baseEntry;
  const multiplier = 4 ** incrementsOfTen;
  return {
    light: remainderEntry.light * multiplier,
    medium: remainderEntry.medium * multiplier,
    heavy: remainderEntry.heavy * multiplier,
  };
}

export function getCarryingCapacityMultiplier(size: string): number {
  const normalized = size.trim().toLowerCase();
  if (normalized === "small") return 0.75;
  if (normalized === "large") return 2;
  return 1;
}

export function deriveValueFromProvenance(
  records: Array<{ delta?: number; setValue?: unknown }>,
  fallback: number,
): number {
  let value = fallback;
  for (const record of records) {
    if (record.setValue !== undefined) {
      const nextValue = Number(record.setValue);
      if (Number.isFinite(nextValue)) {
        value = nextValue;
      }
      continue;
    }
    const delta = Number(record.delta ?? 0);
    if (Number.isFinite(delta)) {
      value += delta;
    }
  }
  return value;
}

export function buildSkillBudgetSummary(input: {
  classEntity: { data?: unknown } | undefined;
  classSelection: { level: number } | undefined;
  raceEntity: { data?: unknown } | undefined;
  intMod: number;
  skillRanks: Record<string, number>;
  classSkillIds: Set<string>;
}): SkillBudgetSummary {
  const characterLevel = getCharacterLevel(input.classSelection);
  const classSkillPointsPerLevel = Math.max(
    0,
    Math.floor(getEntityDataNumber(input.classEntity, "skillPointsPerLevel", 0)),
  );
  const racialTraitIds = getRacialTraitIds(input.raceEntity);
  const racialBonusAtLevel1 = racialTraitIds.has("extra-skill-points") ? 4 : 0;
  const racialBonusPerLevel = racialTraitIds.has("extra-skill-points") ? 1 : 0;
  const baseSkillPointsPerLevelWithInt = Math.max(
    1,
    classSkillPointsPerLevel + input.intMod,
  );
  const total = Array.from({ length: characterLevel }).reduce<number>(
    (sum, _, index) => {
      const level = index + 1;
      const levelPoints =
        level === 1
          ? baseSkillPointsPerLevelWithInt * FIRST_LEVEL_SKILL_MULTIPLIER +
            racialBonusAtLevel1
          : baseSkillPointsPerLevelWithInt + racialBonusPerLevel;
      return sum + Math.max(0, levelPoints);
    },
    0,
  );
  const spent = Object.entries(input.skillRanks).reduce<number>(
    (sum, [skillId, ranks]) => {
      const costPerRank = input.classSkillIds.has(skillId) ? 1 : 2;
      return sum + ranks * costPerRank;
    },
    0,
  );
  return {
    total,
    spent,
    remaining: total - spent,
  };
}

function rollScoreByFormula(formula: string): number {
  if (formula !== "4d6_drop_lowest") return 10;
  const rolls = Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 6) + 1,
  ).sort((a, b) => a - b);
  return rolls.slice(1).reduce((sum, value) => sum + value, 0);
}

export function generateRollSets(config: AbilityStepConfig["rollSets"]): number[][] {
  const setsCount = Math.max(1, Number(config?.setsCount ?? 1));
  const scoresPerSet = Math.max(
    1,
    Number(config?.scoresPerSet ?? ABILITY_ORDER.length),
  );
  const formula = String(config?.rollFormula ?? "4d6_drop_lowest");
  return Array.from({ length: setsCount }, () =>
    Array.from({ length: scoresPerSet }, () => rollScoreByFormula(formula)),
  );
}

export function clampAbilityScore(
  value: number,
  min = DEFAULT_ABILITY_MIN,
  max = DEFAULT_ABILITY_MAX,
): number {
  if (!Number.isFinite(value)) return min;
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(clamped);
}

export function derivePointBuyBaseScore(
  costTable: Record<string, number>,
  fallback: number,
): number {
  const zeroCostScores = Object.entries(costTable)
    .filter(([, cost]) => Number(cost) === 0)
    .map(([score]) => Number(score))
    .filter((score) => Number.isFinite(score));
  return zeroCostScores.length > 0 ? Math.min(...zeroCostScores) : fallback;
}
