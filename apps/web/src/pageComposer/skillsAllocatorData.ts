import type { UIText } from "../uiText";

export interface SkillsAllocatorData {
  t: UIText;
  title: string;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  rows: Array<{
    id: string;
    name: string;
    typeLabel: string;
    pointsLabel: string;
    ranks: string;
    decreaseLabel: string;
    increaseLabel: string;
    canDecrease: boolean;
    canIncrease: boolean;
    onDecrease: () => void;
    onIncrease: () => void;
    breakdown: string;
    total: string;
    notes: string[];
  }>;
}

type Args = {
  t: UIText;
  title: string;
  budget: SkillsAllocatorData["budget"];
  skills: Array<{ id: string; displayName: string; data?: unknown }>;
  skillViewModelById: Map<string, { classSkill?: boolean; costPerRank?: number; maxRanks?: number; racialBonus?: number; misc?: number; acp?: number; abilityMod?: number; total?: number; acpApplied?: boolean }>;
  selectedSkillRanks: Record<string, number>;
  onUpdateRanks: (skillId: string, nextValue: number) => void;
};

function formatSkillValue(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

function getEntityDataRecord(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data as Record<string, unknown>;
}

export function buildSkillsAllocatorData(args: Args): SkillsAllocatorData {
  return {
    t: args.t,
    title: args.title,
    budget: args.budget,
    rows: args.skills.map((skill) => {
      const skillView = args.skillViewModelById.get(skill.id);
      const ranks = args.selectedSkillRanks[skill.id] ?? 0;
      const classSkill = skillView?.classSkill ?? false;
      const costPerRank = skillView?.costPerRank ?? 2;
      const maxRanks = skillView?.maxRanks ?? 0;
      const racialBonus = skillView?.racialBonus ?? 0;
      const miscBonus = skillView?.misc ?? 0;
      const acpPenalty = skillView?.acp ?? 0;
      const abilityMod = skillView?.abilityMod ?? 0;
      const total = skillView?.total ?? 0;
      const rankStep = classSkill ? 1 : 0.5;
      const costToIncrease = rankStep * costPerRank;
      const armorCheckPenaltyApplies = skillView?.acpApplied ?? Boolean(getEntityDataRecord(skill.data).armorCheckPenaltyApplies);
      return {
        id: skill.id,
        name: skill.displayName,
        typeLabel: classSkill ? args.t.SKILLS_CLASS_LABEL : args.t.SKILLS_CROSS_LABEL,
        pointsLabel: `${costPerRank}${args.t.SKILLS_PER_RANK_UNIT}`,
        ranks: formatSkillValue(ranks),
        decreaseLabel: `${args.t.DECREASE_LABEL} ${skill.displayName}`,
        increaseLabel: `${args.t.INCREASE_LABEL} ${skill.displayName}`,
        canDecrease: ranks > 0,
        canIncrease: ranks + rankStep <= maxRanks && args.budget.remaining + 1e-9 >= costToIncrease,
        onDecrease: () => args.onUpdateRanks(skill.id, ranks - rankStep),
        onIncrease: () => args.onUpdateRanks(skill.id, ranks + rankStep),
        breakdown: `${formatSkillValue(ranks)} + ${formatSkillValue(abilityMod)} + ${formatSkillValue(miscBonus)} - ${formatSkillValue(Math.abs(acpPenalty))} = ${formatSkillValue(total)}`,
        total: formatSkillValue(total),
        notes: [
          `${args.t.SKILLS_MAX_LABEL} ${formatSkillValue(maxRanks)}`,
          `${args.t.SKILLS_RACIAL_LABEL} ${racialBonus >= 0 ? "+" : ""}${formatSkillValue(racialBonus)}`,
          armorCheckPenaltyApplies ? args.t.SKILLS_ACP_APPLIES_LABEL : args.t.SKILLS_ACP_NOT_APPLICABLE_LABEL,
        ],
      };
    }),
  };
}
