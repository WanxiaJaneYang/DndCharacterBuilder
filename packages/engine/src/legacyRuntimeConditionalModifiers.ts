import { normalizeSkillId } from "./legacyRuntimeIds";

type ConditionalModifierPredicate =
  | { op: "gte"; left: { kind: "skillRanks"; id: string }; right: number }
  | { op: "and" | "or"; args: ConditionalModifierPredicate[] }
  | { op: "hasFeat"; id: string }
  | { op: "hasFeature"; id: string }
  | { op: "isClassSkill"; target: { kind: "skill"; id: string } };

type ParsedConditionalSkillModifier = {
  id: string;
  sourceType: string;
  when: ConditionalModifierPredicate;
  apply: {
    targetSkillId: string;
    bonus: number;
    bonusType?: string;
    note?: string;
  };
};

export type ConditionalPredicateEvaluationContext = {
  skillRanks: Record<string, number>;
  selectedFeatIds: Set<string>;
  selectedFeatureIds: Set<string>;
  classSkillIds: Set<string>;
};

function parseConditionalModifierPredicate(value: unknown): ConditionalModifierPredicate | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const op = String(record.op ?? "").trim().toLowerCase();

  if (op === "gte") {
    const leftRaw = record.left;
    const rightRaw = Number(record.right);
    if (!leftRaw || typeof leftRaw !== "object" || Array.isArray(leftRaw) || !Number.isFinite(rightRaw)) return undefined;
    const leftRecord = leftRaw as Record<string, unknown>;
    if (String(leftRecord.kind ?? "").trim().toLowerCase() !== "skillranks") return undefined;
    const skillId = normalizeSkillId(String(leftRecord.id ?? ""));
    if (!skillId) return undefined;
    return { op: "gte", left: { kind: "skillRanks", id: skillId }, right: rightRaw };
  }

  if (op === "and" || op === "or") {
    if (!Array.isArray(record.args)) return undefined;
    const parsedArgs = record.args.map((entry) => parseConditionalModifierPredicate(entry));
    if (parsedArgs.length === 0 || parsedArgs.some((entry) => entry === undefined)) return undefined;
    return { op, args: parsedArgs as ConditionalModifierPredicate[] };
  }

  if (op === "hasfeat") {
    const featId = normalizeSkillId(String(record.id ?? ""));
    return featId ? { op: "hasFeat", id: featId } : undefined;
  }

  if (op === "hasfeature") {
    const featureId = normalizeSkillId(String(record.id ?? ""));
    return featureId ? { op: "hasFeature", id: featureId } : undefined;
  }

  if (op === "isclassskill" || op === "isproficient") {
    const targetRaw = record.target;
    if (!targetRaw || typeof targetRaw !== "object" || Array.isArray(targetRaw)) return undefined;
    const target = targetRaw as Record<string, unknown>;
    if (String(target.kind ?? "").trim().toLowerCase() !== "skill") return undefined;
    const skillId = normalizeSkillId(String(target.id ?? ""));
    return skillId ? { op: "isClassSkill", target: { kind: "skill", id: skillId } } : undefined;
  }

  return undefined;
}

export function parseConditionalSkillModifiers(value: unknown): ParsedConditionalSkillModifier[] {
  if (!Array.isArray(value)) return [];
  const output: ParsedConditionalSkillModifier[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const applyRaw = record.apply as Record<string, unknown> | undefined;
    const targetRaw = applyRaw?.target as Record<string, unknown> | undefined;
    const targetSkillId = normalizeSkillId(String(targetRaw?.id ?? ""));
    const when = parseConditionalModifierPredicate(record.when);
    const bonus = Number(applyRaw?.bonus ?? 0);
    const targetKind = String(targetRaw?.kind ?? "").trim().toLowerCase();

    if (!String(record.id ?? "").trim() || !when || targetKind !== "skill" || !targetSkillId || !Number.isFinite(bonus)) {
      continue;
    }

    output.push({
      id: String(record.id).trim(),
      sourceType: String((record.source as Record<string, unknown> | undefined)?.type ?? "misc").trim(),
      when,
      apply: {
        targetSkillId,
        bonus,
        bonusType: typeof applyRaw?.bonusType === "string" && applyRaw.bonusType.trim() ? applyRaw.bonusType.trim() : undefined,
        note: typeof applyRaw?.note === "string" && applyRaw.note.trim() ? applyRaw.note.trim() : undefined
      }
    });
  }

  return output;
}

export function evaluateConditionalModifierPredicate(
  predicate: ConditionalModifierPredicate,
  context: ConditionalPredicateEvaluationContext
): boolean {
  if (predicate.op === "gte") return (context.skillRanks[predicate.left.id] ?? 0) >= predicate.right;
  if (predicate.op === "and") return predicate.args.every((entry) => evaluateConditionalModifierPredicate(entry, context));
  if (predicate.op === "or") return predicate.args.some((entry) => evaluateConditionalModifierPredicate(entry, context));
  if (predicate.op === "hasFeat") return context.selectedFeatIds.has(predicate.id);
  if (predicate.op === "hasFeature") return context.selectedFeatureIds.has(predicate.id);
  if (predicate.op === "isClassSkill") return context.classSkillIds.has(predicate.target.id);
  return false;
}
