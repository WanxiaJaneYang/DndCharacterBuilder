import type { Constraint, Entity, Expr } from "@dcb/schema";
import type { CharacterState } from "./characterSpec";
import type { EngineContext, ProvenanceRecord } from "./legacyRuntimeTypes";
import { getCharacterLevel } from "./legacyRuntimeProgression";

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export function setPath(obj: Record<string, any>, path: string, value: number): void {
  const keys = path.split(".");
  let current = obj;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]!;
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      throw new Error(`Invalid path key: ${key}`);
    }
    current[key] ??= {};
    current = current[key];
  }
  const lastKey = keys[keys.length - 1]!;
  if (lastKey === "__proto__" || lastKey === "constructor" || lastKey === "prototype") {
    throw new Error(`Invalid path key: ${lastKey}`);
  }
  current[lastKey] = value;
}

export function evalExpr(expr: Expr, sheet: Record<string, any>): any {
  if ("const" in expr) return expr.const;
  if ("path" in expr) return getPath(sheet, expr.path) ?? 0;
  if ("abilityMod" in expr) return abilityMod(getPath(sheet, `abilities.${expr.abilityMod}.score`) ?? 10);
  if ("sum" in expr) return expr.sum.reduce((acc: number, entry: Expr) => acc + Number(evalExpr(entry, sheet)), 0);
  if ("multiply" in expr) return Number(evalExpr(expr.multiply[0], sheet)) * Number(evalExpr(expr.multiply[1], sheet));
  if ("if" in expr) return evalExpr(expr.if, sheet) ? evalExpr(expr.then, sheet) : evalExpr(expr.else, sheet);
  if ("op" in expr) {
    const left = evalExpr(expr.left, sheet);
    const right = evalExpr(expr.right, sheet);
    switch (expr.op) {
      case "eq": return left === right;
      case "neq": return left !== right;
      case "gte": return Number(left) >= Number(right);
      case "lte": return Number(left) <= Number(right);
      case "gt": return Number(left) > Number(right);
      case "lt": return Number(left) < Number(right);
      case "and": return Boolean(left) && Boolean(right);
      case "or": return Boolean(left) || Boolean(right);
      default: return false;
    }
  }
  return 0;
}

export function checkConstraint(constraint: Constraint, state: CharacterState, context: EngineContext): boolean {
  switch (constraint.kind) {
    case "requires":
      return Boolean(evalExpr(constraint.expression, { abilities: Object.fromEntries(Object.entries(state.abilities).map(([key, score]) => [key, { score }])) }));
    case "levelMin":
      return getCharacterLevel(state) >= constraint.level;
    case "abilityMin":
      return (state.abilities[constraint.ability] ?? 0) >= constraint.score;
    case "mutuallyExclusive": {
      const selectedFeats = (state.selections.feats as string[] | undefined) ?? [];
      const featEntities = context.resolvedData.entities.feats ?? {};
      const inGroup = selectedFeats.filter((id) => (featEntities[id]?.data?.exclusiveGroup as string | undefined) === constraint.groupId);
      return inGroup.length <= 1;
    }
    case "predicate":
      return context.predicates?.[constraint.predicateId]?.(state, constraint.args) ?? true;
  }
}

export function entityAllowed(entity: Entity, state: CharacterState, context: EngineContext): boolean {
  return (entity.constraints ?? []).every((constraint) => checkConstraint(constraint, state, context));
}

export function applyProvenanceEffect(
  targetPath: string,
  nextValue: number,
  previousValue: number,
  kind: "set" | "derive" | "add" | "multiply" | "min" | "max",
  provenance: ProvenanceRecord[],
  source: ProvenanceRecord["source"]
): void {
  if (kind === "add") {
    provenance.push({ targetPath, delta: nextValue - previousValue, source });
    return;
  }
  provenance.push({ targetPath, setValue: nextValue, source });
}
