import type { CharacterState } from "./characterSpec";
import type {
  DecisionSummary,
  EngineContext,
  InnateSpellLikeAbilityBreakdown,
  RacialModifierBreakdown,
  SpellDcBonusBreakdown
} from "./legacyRuntimeTypes";
import { getSelectedRace } from "./legacyRuntimeSelectors";

export function parseRacialModifiers(raw: unknown): RacialModifierBreakdown[] {
  if (!Array.isArray(raw)) return [];
  const output: RacialModifierBreakdown[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const target = String((entry as { target?: unknown }).target ?? "").trim();
    const bonus = Number((entry as { bonus?: unknown }).bonus);
    if (!target || !Number.isFinite(bonus)) continue;
    const typeRaw = (entry as { type?: unknown }).type;
    const whenRaw = (entry as { when?: unknown }).when;
    output.push({
      target,
      bonus,
      type: typeof typeRaw === "string" && typeRaw.trim() ? typeRaw : undefined,
      when: typeof whenRaw === "string" && whenRaw.trim() ? whenRaw : undefined
    });
  }
  return output;
}

export function parseSpellDcBonuses(raw: unknown): SpellDcBonusBreakdown[] {
  if (!Array.isArray(raw)) return [];
  const output: SpellDcBonusBreakdown[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const school = String((entry as { school?: unknown }).school ?? "").trim();
    const bonus = Number((entry as { bonus?: unknown }).bonus);
    if (!school || !Number.isFinite(bonus)) continue;
    const typeRaw = (entry as { type?: unknown }).type;
    const whenRaw = (entry as { when?: unknown }).when;
    output.push({
      school,
      bonus,
      type: typeof typeRaw === "string" && typeRaw.trim() ? typeRaw : undefined,
      when: typeof whenRaw === "string" && whenRaw.trim() ? whenRaw : undefined
    });
  }
  return output;
}

export function parseInnateSpellLikeAbilities(raw: unknown): InnateSpellLikeAbilityBreakdown[] {
  if (!Array.isArray(raw)) return [];
  const output: InnateSpellLikeAbilityBreakdown[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const spell = String((entry as { spell?: unknown }).spell ?? "").trim();
    const frequency = String((entry as { frequency?: unknown }).frequency ?? "").trim();
    if (!spell || !frequency) continue;
    const casterLevelRaw = (entry as { casterLevel?: unknown }).casterLevel;
    const scopeRaw = (entry as { scope?: unknown }).scope;
    output.push({
      spell,
      frequency,
      casterLevel: typeof casterLevelRaw === "string" && casterLevelRaw.trim() ? casterLevelRaw : undefined,
      scope: typeof scopeRaw === "string" && scopeRaw.trim() ? scopeRaw : undefined
    });
  }
  return output;
}

export function parseRaceAncestryTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => String(entry ?? "").trim().toLowerCase())
    .filter(Boolean);
}

export function getRaceSizeModifiers(state: CharacterState, context: EngineContext): DecisionSummary["sizeModifiers"] {
  const race = getSelectedRace(state, context);
  const raw = race?.data?.sizeModifiers as Record<string, unknown> | undefined;
  if (raw && typeof raw === "object") {
    const ac = Number(raw.ac);
    const attack = Number(raw.attack);
    const hide = Number(raw.hide);
    const carryingCapacityMultiplier = Number(raw.carryingCapacityMultiplier);
    if (Number.isFinite(ac) && Number.isFinite(attack) && Number.isFinite(hide) && Number.isFinite(carryingCapacityMultiplier) && carryingCapacityMultiplier > 0) {
      return { ac, attack, hide, carryingCapacityMultiplier };
    }
  }

  const size = String(race?.data?.size ?? "").toLowerCase();
  if (size === "small") return { ac: 1, attack: 1, hide: 4, carryingCapacityMultiplier: 0.75 };
  if (size === "large") return { ac: -1, attack: -1, hide: -4, carryingCapacityMultiplier: 2 };
  return { ac: 0, attack: 0, hide: 0, carryingCapacityMultiplier: 1 };
}

export function getRaceMovementOverrides(state: CharacterState, context: EngineContext): DecisionSummary["movementOverrides"] {
  const race = getSelectedRace(state, context);
  const raw = race?.data?.movementOverrides as Record<string, unknown> | undefined;
  return {
    ignoreArmorSpeedReduction: Boolean(raw?.ignoreArmorSpeedReduction)
  };
}
