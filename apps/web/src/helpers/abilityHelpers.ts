const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"] as const;
const DEFAULT_ABILITY_MIN = 3;
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
