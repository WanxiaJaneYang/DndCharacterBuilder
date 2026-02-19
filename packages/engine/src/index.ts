import { EffectSchema, type Constraint, type Effect, type Entity, type Expr } from "@dcb/schema";
import type { ResolvedEntity, ResolvedPackSet } from "@dcb/datapack";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const FIRST_LEVEL_SKILL_MULTIPLIER = 4;
const FEAT_SLOT_TYPE = "feat";

function normalizeSkillId(id: string): string {
  return id.trim().toLowerCase();
}

export interface CharacterState {
  metadata: { name?: string };
  abilities: Record<string, number>;
  selections: Record<string, unknown>;
}

export interface EngineContext {
  enabledPackIds: string[];
  resolvedData: ResolvedPackSet;
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

export interface SkillBreakdown {
  name: string;
  ability: AbilityKey;
  classSkill: boolean;
  ranks: number;
  maxRanks: number;
  costPerRank: number;
  costSpent: number;
  abilityMod: number;
  racialBonus: number;
  total: number;
}

export interface DecisionSummary {
  featSelectionLimit: number;
  favoredClass: string | null;
  ignoresMulticlassXpPenalty: boolean;
  classSkills: string[];
  skillPoints: {
    basePerLevel: number;
    racialBonusAtLevel1: number;
    racialBonusPerLevel: number;
    firstLevelMultiplier: number;
    total: number;
    spent: number;
    remaining: number;
  };
}

export interface CharacterSheet {
  metadata: { name: string };
  abilities: Record<string, { score: number; mod: number }>;
  stats: Record<string, number | string>;
  selections: Record<string, unknown>;
  skills: Record<string, SkillBreakdown>;
  decisions: DecisionSummary;
  provenance: ProvenanceRecord[];
  packSetFingerprint: string;
}

export const DEFAULT_STATS = {
  hp: 0,
  ac: 10,
  initiative: 0,
  speed: 30,
  bab: 0,
  fort: 0,
  ref: 0,
  will: 0,
  attackBonus: 0,
  damageBonus: 0,
} as const satisfies Record<
  "hp" | "ac" | "initiative" | "speed" | "bab" | "fort" | "ref" | "will" | "attackBonus" | "damageBonus",
  number
>;

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
    const key = keys[i]!;
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

function evalExpr(expr: Expr, sheet: Record<string, any>): any {
  if ("const" in expr) return expr.const;
  if ("path" in expr) return getPath(sheet, expr.path) ?? 0;
  if ("abilityMod" in expr) return abilityMod(getPath(sheet, `abilities.${expr.abilityMod}.score`) ?? 10);
  if ("sum" in expr) return expr.sum.reduce((acc: number, e: Expr) => acc + Number(evalExpr(e, sheet)), 0);
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

type EntityTypeFlowStep = EngineContext["resolvedData"]["flow"]["steps"][number] & {
  source: { type: "entityType"; entityType: string; limit?: number };
};

function isEntityTypeFlowStep(step: EngineContext["resolvedData"]["flow"]["steps"][number]): step is EntityTypeFlowStep {
  return step.source.type === "entityType";
}

function getSelectedRace(state: CharacterState, context: EngineContext): ResolvedEntity | undefined {
  const raceId = state.selections.race as string | undefined;
  return raceId ? context.resolvedData.entities.races?.[raceId] : undefined;
}

function getSelectedClass(state: CharacterState, context: EngineContext): ResolvedEntity | undefined {
  const classId = state.selections.class as string | undefined;
  return classId ? context.resolvedData.entities.classes?.[classId] : undefined;
}

function getRacialTraits(state: CharacterState, context: EngineContext): string[] {
  const race = getSelectedRace(state, context);
  const traitList = (race?.data?.racialTraits as Array<{ id?: unknown }> | undefined) ?? [];
  return traitList.map((trait) => String(trait.id ?? "")).filter(Boolean);
}

function getRaceTraitCount(state: CharacterState, context: EngineContext, traitId: string): number {
  return getRacialTraits(state, context).filter((id) => id === traitId).length;
}

function getStepSelectionLimit(step: EntityTypeFlowStep, state: CharacterState, context: EngineContext): number | undefined {
  const baseLimit = step.source.limit;
  if (step.id === "feat") {
    const racialBonusFeats = getRaceTraitCount(state, context, "bonus-feat");
    const classBonusFeats = getClassProgressionFeatSlotBonus(state, context);
    return (baseLimit ?? 0) + racialBonusFeats + classBonusFeats;
  }
  return baseLimit;
}

function getSelectedSkillRanks(state: CharacterState, context?: EngineContext): Record<string, number> {
  const raw = state.selections.skills;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const classSkills = context ? getClassSkills(state, context) : undefined;
  const normalized: Record<string, number> = {};
  for (const [skillId, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) continue;
    const canonicalSkillId = normalizeSkillId(skillId);
    if (!canonicalSkillId) continue;
    if (classSkills?.has(canonicalSkillId)) {
      normalized[canonicalSkillId] = Math.round(parsed);
    } else {
      normalized[canonicalSkillId] = Math.round(parsed * 2) / 2;
    }
  }
  return normalized;
}

function getClassSkills(state: CharacterState, context: EngineContext): Set<string> {
  const classEntity = getSelectedClass(state, context);
  const list = (classEntity?.data?.classSkills as unknown[] | undefined) ?? [];
  return new Set(list.map((id) => normalizeSkillId(String(id))).filter(Boolean));
}

function getClassSkillPointsPerLevel(state: CharacterState, context: EngineContext): number {
  const classEntity = getSelectedClass(state, context);
  const raw = Number(classEntity?.data?.skillPointsPerLevel ?? 0);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

function getRaceSkillBonusAtLevel1(state: CharacterState, context: EngineContext): number {
  return getRaceTraitCount(state, context, "extra-skill-points") > 0 ? 4 : 0;
}

function getRaceSkillBonusPerLevel(state: CharacterState, context: EngineContext): number {
  return getRaceTraitCount(state, context, "extra-skill-points") > 0 ? 1 : 0;
}

function getSelectedFeatIds(state: CharacterState): string[] {
  return ((state.selections.feats as string[] | undefined) ?? []).map((id) => String(id));
}

function getSelectionCountForStep(step: EntityTypeFlowStep, state: CharacterState): number {
  if (step.id === "feat") return getSelectedFeatIds(state).length;
  const value = state.selections[step.id];
  if (value === undefined || value === null || value === "") return 0;
  if (Array.isArray(value)) return value.length;
  return 1;
}

function classIdBase(classId: string | undefined): string | undefined {
  if (!classId) return undefined;
  return classId.replace(/-\d+$/, "");
}

function classIdLevel(classId: string | undefined): number {
  if (!classId) return 0;
  const match = classId.match(/-(\d+)$/);
  if (!match?.[1]) return 1;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function getClassProgressionEffects(classEntity: ResolvedEntity | undefined, classId: string | undefined): Effect[] {
  const progression = classEntity?.data?.progression as { levelGains?: unknown } | undefined;
  if (!progression || !Array.isArray(progression.levelGains)) return [];
  const selectedLevel = classIdLevel(classId);
  const effects: Effect[] = [];

  progression.levelGains
    .filter((gain): gain is Record<string, unknown> => Boolean(gain) && typeof gain === "object")
    .map((gain) => ({
      level: Number(gain.level),
      effects: (Array.isArray(gain.effects) ? gain.effects : [])
        .map((effect) => EffectSchema.safeParse(effect))
        .filter((result): result is { success: true; data: Effect } => result.success)
        .map((result) => result.data)
    }))
    .filter((gain) => Number.isFinite(gain.level) && gain.level >= 1 && gain.level <= selectedLevel)
    .sort((a, b) => a.level - b.level)
    .forEach((gain) => effects.push(...gain.effects));

  return effects;
}

function buildRacialSkillBonusMap(state: CharacterState, context: EngineContext): Record<string, number> {
  const race = getSelectedRace(state, context);
  const bonuses = (race?.data?.skillBonuses as Array<{ skill?: unknown; bonus?: unknown }> | undefined) ?? [];
  return bonuses.reduce<Record<string, number>>((acc, entry) => {
    const skillId = normalizeSkillId(String(entry.skill ?? ""));
    const bonus = Number(entry.bonus ?? 0);
    if (!skillId || !Number.isFinite(bonus)) return acc;
    acc[skillId] = (acc[skillId] ?? 0) + bonus;
    return acc;
  }, {});
}

function buildDecisionSummary(state: CharacterState, context: EngineContext, abilities: Record<string, { score: number; mod: number }>): DecisionSummary {
  const featStepCandidate = context.resolvedData.flow.steps.find((step) => step.id === "feat");
  const featStep = featStepCandidate && isEntityTypeFlowStep(featStepCandidate) ? featStepCandidate : undefined;
  const featSelectionLimit = featStep ? (getStepSelectionLimit(featStep, state, context) ?? 0) : 0;
  const classSkills = getClassSkills(state, context);
  const selectedSkillRanks = getSelectedSkillRanks(state, context);
  const classSkillPointsPerLevel = getClassSkillPointsPerLevel(state, context);
  const intModifier = abilities.int?.mod ?? 0;
  const racialBonusAtLevel1 = getRaceSkillBonusAtLevel1(state, context);
  const racialBonusPerLevel = getRaceSkillBonusPerLevel(state, context);
  const baseSkillPointsPerLevelWithInt = Math.max(1, classSkillPointsPerLevel + intModifier);
  const totalSkillPoints = Math.max(0, (baseSkillPointsPerLevelWithInt * FIRST_LEVEL_SKILL_MULTIPLIER) + racialBonusAtLevel1);

  let spentSkillPoints = 0;
  for (const [skillId, ranks] of Object.entries(selectedSkillRanks)) {
    const costPerRank = classSkills.has(skillId) ? 1 : 2;
    spentSkillPoints += ranks * costPerRank;
  }

  const race = getSelectedRace(state, context);
  const favoredClass = race?.data?.favoredClass ? String(race.data.favoredClass) : null;
  const selectedClassId = state.selections.class as string | undefined;
  const selectedClassBase = classIdBase(selectedClassId);
  const ignoresMulticlassXpPenalty = favoredClass === null || favoredClass === "any" || favoredClass === selectedClassBase;

  return {
    featSelectionLimit,
    favoredClass,
    ignoresMulticlassXpPenalty,
    classSkills: Array.from(classSkills).sort((a, b) => a.localeCompare(b)),
    skillPoints: {
      basePerLevel: classSkillPointsPerLevel,
      racialBonusAtLevel1,
      racialBonusPerLevel,
      firstLevelMultiplier: FIRST_LEVEL_SKILL_MULTIPLIER,
      total: totalSkillPoints,
      spent: spentSkillPoints,
      remaining: totalSkillPoints - spentSkillPoints
    }
  };
}

function buildSkillBreakdown(
  state: CharacterState,
  context: EngineContext,
  abilities: Record<string, { score: number; mod: number }>,
  decisions: DecisionSummary
): Record<string, SkillBreakdown> {
  const selectedRanks = getSelectedSkillRanks(state, context);
  const racialBonuses = buildRacialSkillBonusMap(state, context);
  const skills = Object.values(context.resolvedData.entities.skills ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  const output: Record<string, SkillBreakdown> = {};

  for (const skillEntity of skills) {
    const rawAbility = String(skillEntity.data?.ability ?? "int").toLowerCase() as AbilityKey;
    const ability: AbilityKey = ABILITY_KEYS.includes(rawAbility) ? rawAbility : "int";
    const classSkill = decisions.classSkills.includes(normalizeSkillId(skillEntity.id));
    const ranks = selectedRanks[normalizeSkillId(skillEntity.id)] ?? 0;
    const maxRanks = classSkill ? 4 : 2;
    const costPerRank = classSkill ? 1 : 2;
    const costSpent = ranks * costPerRank;
    const racialBonus = racialBonuses[normalizeSkillId(skillEntity.id)] ?? 0;
    const abilityModifier = abilities[ability]?.mod ?? 0;

    output[skillEntity.id] = {
      name: skillEntity.name,
      ability,
      classSkill,
      ranks,
      maxRanks,
      costPerRank,
      costSpent,
      abilityMod: abilityModifier,
      racialBonus,
      total: ranks + abilityModifier + racialBonus
    };
  }

  return output;
}

export function listChoices(state: CharacterState, context: EngineContext): Choice[] {
  return context.resolvedData.flow.steps
    .filter(isEntityTypeFlowStep)
    .map((step) => {
      const options = Object.values(context.resolvedData.entities[step.source.entityType] ?? {})
        .filter((entity) => entityAllowed(entity, state, context))
        .map((entity) => ({ id: entity.id, label: entity.name }));
      return { stepId: step.id, label: step.label, options, limit: getStepSelectionLimit(step, state, context) };
    });
}

export function applyChoice(state: CharacterState, choiceId: string, selection: unknown, context?: EngineContext): CharacterState {
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
  if (choiceId === "skills") {
    const raw = selection && typeof selection === "object" && !Array.isArray(selection) ? (selection as Record<string, unknown>) : {};
    const classSkills = context ? getClassSkills(state, context) : new Set<string>();
    const normalized: Record<string, number> = {};
    for (const [skillId, rankValue] of Object.entries(raw)) {
      const canonicalSkillId = normalizeSkillId(skillId);
      if (!canonicalSkillId) continue;
      const rank = Number(rankValue);
      if (!Number.isFinite(rank) || rank < 0) continue;
      normalized[canonicalSkillId] = classSkills.has(canonicalSkillId) ? Math.round(rank) : (Math.round(rank * 2) / 2);
    }
    return { ...state, selections: { ...state.selections, skills: normalized } };
  }
  return { ...state, selections: { ...state.selections, [choiceId]: selection } };
}

export function validateState(state: CharacterState, context: EngineContext): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!state.metadata.name) errors.push({ code: "NAME_REQUIRED", message: "Character name is required.", stepId: "name" });
  for (const ability of ABILITY_KEYS) {
    const score = state.abilities[ability];
    if (score === undefined || !Number.isInteger(score) || score < 3 || score > 18) errors.push({ code: "ABILITY_RANGE", message: `${ability.toUpperCase()} must be between 3 and 18.`, stepId: "abilities" });
  }

  for (const step of context.resolvedData.flow.steps.filter(isEntityTypeFlowStep)) {
    const limit = getStepSelectionLimit(step, state, context);
    if (limit === undefined) continue;
    const selectedCount = getSelectionCountForStep(step, state);
    if (selectedCount > limit) {
      errors.push({
        code: "STEP_LIMIT_EXCEEDED",
        message: `${step.label} allows at most ${limit} selection(s).`,
        stepId: step.id
      });
    }
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

  const abilities = Object.fromEntries(Object.entries(state.abilities).map(([key, score]) => [key, { score, mod: abilityMod(score) }])) as Record<string, { score: number; mod: number }>;
  const decisions = buildDecisionSummary(state, context, abilities);
  const selectedRanks = getSelectedSkillRanks(state, context);
  const rawSelectedSkills = state.selections.skills && typeof state.selections.skills === "object" && !Array.isArray(state.selections.skills)
    ? (state.selections.skills as Record<string, unknown>)
    : {};
  const knownSkills = new Set(Object.keys(context.resolvedData.entities.skills ?? {}).map((skillId) => normalizeSkillId(skillId)));

  for (const [rawSkillId, rawRank] of Object.entries(rawSelectedSkills)) {
    const skillId = normalizeSkillId(rawSkillId);
    if (!skillId) continue;
    const parsedRank = Number(rawRank);
    if (!Number.isFinite(parsedRank) || parsedRank < 0) {
      errors.push({ code: "SKILL_RANK_INVALID", message: `Invalid rank for ${skillId}.`, stepId: "skills" });
      continue;
    }
    const isClassSkill = decisions.classSkills.includes(skillId);
    if (isClassSkill) {
      if (!Number.isInteger(parsedRank)) {
        errors.push({ code: "SKILL_RANK_CLASS_INTEGER", message: `${skillId} class-skill ranks must be whole numbers.`, stepId: "skills" });
      }
    } else if (Math.round(parsedRank * 2) !== parsedRank * 2) {
      errors.push({ code: "SKILL_RANK_STEP", message: `${skillId} ranks must use 0.5 increments.`, stepId: "skills" });
    }
  }

  for (const [skillId, rank] of Object.entries(selectedRanks)) {
    if (!knownSkills.has(skillId)) {
      errors.push({ code: "UNKNOWN_SKILL", message: `Unknown skill selected: ${skillId}.`, stepId: "skills" });
      continue;
    }
    const isClassSkill = decisions.classSkills.includes(skillId);
    const maxRanks = isClassSkill ? 4 : 2;
    if (rank > maxRanks) {
      errors.push({ code: "SKILL_RANK_MAX", message: `${skillId} exceeds max rank ${maxRanks}.`, stepId: "skills" });
    }
  }

  if (decisions.skillPoints.remaining < 0) {
    errors.push({ code: "SKILL_POINTS_EXCEEDED", message: "Allocated skill points exceed available budget.", stepId: "skills" });
  }

  return errors;
}

function applyEffect(effect: Effect, sheet: Record<string, any>, provenance: ProvenanceRecord[], source: ProvenanceRecord["source"]): void {
  if (effect.kind === "conditional") {
    const branch = evalExpr(effect.condition, sheet) ? effect.then : effect.else ?? [];
    branch.forEach((child: Effect) => applyEffect(child, sheet, provenance, source));
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
    stats: { ...DEFAULT_STATS },
    selections: state.selections
  };

  const provenance: ProvenanceRecord[] = [];
  const entityBuckets = context.resolvedData.entities;

  function applyEntity(entity: ResolvedEntity | undefined): void {
    if (!entity?.effects) return;
    const source = { packId: entity._source.packId, entityId: entity._source.entityId };
    entity.effects.forEach((effect) => applyEffect(effect, sheet, provenance, source));
  }

  function applyClassEntity(entity: ResolvedEntity | undefined, selectedClassId: string | undefined): void {
    if (!entity) return;
    const source = { packId: entity._source.packId, entityId: entity._source.entityId };
    const progressionEffects = getClassProgressionEffects(entity, selectedClassId);
    const effectsToApply = progressionEffects.length > 0 ? progressionEffects : (entity.effects ?? []);
    effectsToApply.forEach((effect) => applyEffect(effect, sheet, provenance, source));
  }

  const ruleEntities = Object.values(entityBuckets.rules ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  for (const ruleEntity of ruleEntities) applyEntity(ruleEntity);

  const raceId = state.selections.race as string | undefined;
  applyEntity(raceId ? entityBuckets.races?.[raceId] : undefined);

  const classId = state.selections.class as string | undefined;
  applyClassEntity(classId ? entityBuckets.classes?.[classId] : undefined, classId);

  for (const featId of getSelectedFeatIds(state)) {
    applyEntity(entityBuckets.feats?.[featId]);
  }
  for (const itemId of ((state.selections.equipment as string[] | undefined) ?? [])) {
    applyEntity(entityBuckets.items?.[itemId]);
  }

  const finalAbilities = sheet.abilities as Record<string, { score: number; mod: number }>;
  for (const ability of Object.values(finalAbilities)) {
    ability.mod = abilityMod(ability.score);
  }

  sheet.stats.initiative = finalAbilities.dex?.mod ?? 0;
  sheet.stats.attackBonus = (sheet.stats.bab as number) + (finalAbilities.str?.mod ?? 0);
  sheet.stats.damageBonus = finalAbilities.str?.mod ?? 0;

  const decisions = buildDecisionSummary(state, context, finalAbilities);
  const skills = buildSkillBreakdown(state, context, finalAbilities, decisions);

  return {
    metadata: { name: sheet.metadata.name },
    abilities: finalAbilities,
    stats: sheet.stats,
    selections: state.selections,
    skills,
    decisions,
    provenance,
    packSetFingerprint: context.resolvedData.fingerprint
  };
}

export const initialState: CharacterState = {
  metadata: {},
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  selections: {}
};
