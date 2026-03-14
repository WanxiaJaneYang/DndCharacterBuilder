import type { ResolvedEntity } from "@dcb/datapack";
import type { CharacterState } from "./characterSpec";
import type { EngineContext } from "./legacyRuntimeTypes";
import { normalizeSkillId } from "./legacyRuntimeIds";

export type EntityTypeFlowStep = EngineContext["resolvedData"]["flow"]["steps"][number] & {
  source: { type: "entityType"; entityType: string; limit?: number };
};

export function isEntityTypeFlowStep(step: EngineContext["resolvedData"]["flow"]["steps"][number]): step is EntityTypeFlowStep {
  return step.source.type === "entityType";
}

export function getSelectedRace(state: CharacterState, context: EngineContext): ResolvedEntity | undefined {
  const raceId = state.selections.race as string | undefined;
  return raceId ? context.resolvedData.entities.races?.[raceId] : undefined;
}

export function getSelectedClass(state: CharacterState, context: EngineContext): ResolvedEntity | undefined {
  const classId = state.selections.class as string | undefined;
  if (!classId) return undefined;
  return context.resolvedData.entities.classes?.[classId]
    ?? context.resolvedData.entities.classes?.[classId.replace(/-\d+$/, "")];
}

export function getRacialTraits(state: CharacterState, context: EngineContext): string[] {
  const race = getSelectedRace(state, context);
  const traitList = (race?.data?.racialTraits as Array<{ id?: unknown }> | undefined) ?? [];
  return traitList.map((trait) => String(trait.id ?? "")).filter(Boolean);
}

export function getRaceTraitCount(state: CharacterState, context: EngineContext, traitId: string): number {
  return getRacialTraits(state, context).filter((id) => id === traitId).length;
}

export function parseFiniteSkillRank(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.min(parsed, Number.MAX_SAFE_INTEGER);
}

export function getSelectedSkillRanks(state: CharacterState): Record<string, number> {
  const raw = state.selections.skills;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const normalized: Record<string, number> = {};
  for (const [skillId, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = parseFiniteSkillRank(value);
    if (parsed === undefined) continue;
    const canonicalSkillId = normalizeSkillId(skillId);
    if (!canonicalSkillId) continue;
    normalized[canonicalSkillId] = parsed;
  }
  return normalized;
}

export function getSelectedFeatIds(state: CharacterState): string[] {
  return ((state.selections.feats as string[] | undefined) ?? []).map((id) => String(id));
}
