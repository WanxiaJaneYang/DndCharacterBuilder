import type { Constraint, Effect, Entity, Expr } from "@dcb/schema";

export interface CharacterState {
  metadata: { name?: string };
  abilities: Record<string, number>;
  selections: Record<string, unknown>;
}

type ResolvedEntity = Entity & { _source?: { packId: string; version?: string } };

export interface EngineContext {
  enabledPackIds: string[];
  resolvedData: {
    entities: Record<string, Record<string, ResolvedEntity>>;
    flow: { steps: Array<{ id: string; kind: string; label: string; source: { type: string; entityType?: string; limit?: number } }> };
    fingerprint: string;
  };
  predicates?: Record<string, (state: CharacterState, args?: Record<string, unknown>) => boolean>;
}

export interface Choice {
  stepId: string;
  label: string;
  options: Array<{ id: string; label: string }>;
  limit?: number;
}

export interface ValidationError {
  code: string;
  message: string;
  stepId?: string;
}

export interface ProvenanceRecord {
  targetPath: string;
  delta?: number;
  setValue?: number;
  source: { packId: string; entityId: string; choiceStepId?: string };
}

export interface CharacterSheet {
  metadata: { name: string };
  abilities: Record<string, { score: number; mod: number }>;
  stats: Record<string, number | string>;
  selections: Record<string, unknown>;
  provenance: ProvenanceRecord[];
  packSetFingerprint: string;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

function setPath(obj: Record<string, any>, path: string, value: number): void {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    current[keys[i]] ??= {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function evalExpr(expr: Expr, sheet: Record<string, any>): any {
  if ("const" in expr) return expr.const;
  if ("path" in expr) return getPath(sheet, expr.path) ?? 0;
  if ("abilityMod" in expr) return abilityMod(getPath(sheet, `abilities.${expr.abilityMod}.score`) ?? 10);
  if ("sum" in expr) return expr.sum.reduce((acc, e) => acc + Number(evalExpr(e, sheet)), 0);
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

function checkConstraint(constraint: Constraint, state: CharacterState, context: EngineContext): boolean {
  switch (constraint.kind) {
    case "requires":
      return Boolean(evalExpr(constraint.expression, { abilities: Object.fromEntries(Object.entries(state.abilities).map(([k, score]) => [k, { score }])) }));
    case "levelMin":
      return ((state.selections.class as string | undefined) ? 1 : 0) >= constraint.level;
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

function entityAllowed(entity: Entity, state: CharacterState, context: EngineContext): boolean {
  return (entity.constraints ?? []).every((constraint) => checkConstraint(constraint, state, context));
}

export function listChoices(state: CharacterState, context: EngineContext): Choice[] {
  return context.resolvedData.flow.steps
    .filter((step) => step.source.type === "entityType" && step.source.entityType)
    .map((step) => {
      const options = Object.values(context.resolvedData.entities[step.source.entityType!] ?? {})
        .filter((entity) => entityAllowed(entity, state, context))
        .map((entity) => ({ id: entity.id, label: entity.name }));
      return { stepId: step.id, label: step.label, options, limit: step.source.limit };
    });
}

export function applyChoice(state: CharacterState, choiceId: string, selection: unknown): CharacterState {
  if (choiceId === "name") {
    return { ...state, metadata: { ...state.metadata, name: String(selection) } };
  }
  if (choiceId === "abilities") {
    return { ...state, abilities: selection as Record<string, number> };
  }
  if (choiceId === "feat") {
    const prev = (state.selections.feats as string[] | undefined) ?? [];
    const next = Array.from(new Set([...(Array.isArray(selection) ? (selection as string[]) : [...prev, String(selection)])]));
    return { ...state, selections: { ...state.selections, feats: next } };
  }
  return { ...state, selections: { ...state.selections, [choiceId]: selection } };
}

export function validateState(state: CharacterState, context: EngineContext): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!state.metadata.name) errors.push({ code: "NAME_REQUIRED", message: "Character name is required.", stepId: "name" });
  for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
    const score = state.abilities[ability];
    if (!Number.isInteger(score) || score < 3 || score > 18) errors.push({ code: "ABILITY_RANGE", message: `${ability.toUpperCase()} must be between 3 and 18.`, stepId: "abilities" });
  }

  for (const [entityType, entities] of Object.entries(context.resolvedData.entities)) {
    for (const entity of Object.values(entities)) {
      if (!entityAllowed(entity, state, context)) {
        const selected = Object.values(state.selections).flatMap((v) => (Array.isArray(v) ? v : [v]));
        if (selected.includes(entity.id)) {
          errors.push({ code: "PREREQ_FAILED", message: `${entity.name} prerequisites not met.`, stepId: entityType });
        }
      }
    }
  }
  return errors;
}

function applyEffect(effect: Effect, sheet: Record<string, any>, provenance: ProvenanceRecord[], source: ProvenanceRecord["source"]): void {
  if (effect.kind === "conditional") {
    const branch = evalExpr(effect.condition, sheet) ? effect.then : effect.else ?? [];
    branch.forEach((child) => applyEffect(child, sheet, provenance, source));
    return;
  }
  const nextValue = Number(evalExpr(effect.value, sheet));
  const prev = Number(getPath(sheet, effect.targetPath) ?? 0);
  switch (effect.kind) {
    case "set":
    case "derive":
      setPath(sheet, effect.targetPath, nextValue);
      provenance.push({ targetPath: effect.targetPath, setValue: nextValue, source });
      break;
    case "add": {
      const value = prev + nextValue;
      setPath(sheet, effect.targetPath, value);
      provenance.push({ targetPath: effect.targetPath, delta: nextValue, source });
      break;
    }
    case "multiply": {
      const value = prev * nextValue;
      setPath(sheet, effect.targetPath, value);
      provenance.push({ targetPath: effect.targetPath, setValue: value, source });
      break;
    }
    case "min": {
      const value = Math.max(prev, nextValue);
      setPath(sheet, effect.targetPath, value);
      provenance.push({ targetPath: effect.targetPath, setValue: value, source });
      break;
    }
    case "max": {
      const value = Math.min(prev, nextValue);
      setPath(sheet, effect.targetPath, value);
      provenance.push({ targetPath: effect.targetPath, setValue: value, source });
      break;
    }
  }
}

export function finalizeCharacter(state: CharacterState, context: EngineContext): CharacterSheet {
  const abilities = Object.fromEntries(
    Object.entries(state.abilities).map(([k, score]) => [k, { score, mod: abilityMod(score) }])
  );

  const sheet: Record<string, any> = {
    metadata: { name: state.metadata.name ?? "" },
    abilities,
    stats: {
      hp: 0,
      ac: 10,
      initiative: 0,
      speed: 30,
      bab: 0,
      fort: 0,
      ref: 0,
      will: 0,
      attackBonus: 0,
      damageBonus: 0
    },
    selections: state.selections
  };

  const provenance: ProvenanceRecord[] = [];

  const entityBuckets = context.resolvedData.entities;

  const ruleEntities = Object.values(entityBuckets.rules ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  for (const ruleEntity of ruleEntities) applyEntity(ruleEntity);

  const raceId = state.selections.race as string | undefined;
  applyEntity(raceId ? entityBuckets.races?.[raceId] : undefined);

  const classId = state.selections.class as string | undefined;
  applyEntity(classId ? entityBuckets.classes?.[classId] : undefined);

  for (const featId of ((state.selections.feats as string[] | undefined) ?? [])) {
    applyEntity(entityBuckets.feats?.[featId]);
  }
  for (const itemId of ((state.selections.equipment as string[] | undefined) ?? [])) {
    applyEntity(entityBuckets.items?.[itemId]);
    }
  }

  sheet.stats.initiative = abilities.dex.mod;
  sheet.stats.attackBonus = (sheet.stats.bab as number) + abilities.str.mod;
  sheet.stats.damageBonus = abilities.str.mod;

  return {
    metadata: { name: sheet.metadata.name },
    abilities,
    stats: sheet.stats,
    selections: state.selections,
    provenance,
    packSetFingerprint: context.resolvedData.fingerprint
  };
}

export const initialState: CharacterState = {
  metadata: {},
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  selections: {}
};
