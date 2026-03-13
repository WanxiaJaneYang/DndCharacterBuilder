import type { Dispatch, SetStateAction } from "react";
import { applyChoice, type CharacterState } from "@dcb/engine/legacy";
import type { UIText } from "../uiText";
import { STEP_ID_SKILLS } from "./constants";
import type { WizardEngineContext } from "./types";

type SkillsStepContentProps = {
  label: string;
  text: UIText;
  state: CharacterState;
  setState: Dispatch<SetStateAction<CharacterState>>;
  context: WizardEngineContext;
  reviewData: { skillBudget: { total: number; spent: number; remaining: number } };
  skillEntities: Array<{ id: string; displayName: string; data?: { armorCheckPenaltyApplies?: boolean } }>;
  skillViewModelById: Map<
    string,
    {
      classSkill: boolean;
      costPerRank: number;
      maxRanks: number;
      racialBonus: number;
      misc: number;
      acp: number;
      acpApplied: boolean;
      abilityMod: number;
      total: number;
    }
  >;
  selectedSkillRanks: Record<string, number>;
};

const formatSkillValue = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}`;

export function SkillsStepContent({
  label,
  text,
  state,
  setState,
  context,
  reviewData,
  skillEntities,
  skillViewModelById,
  selectedSkillRanks,
}: SkillsStepContentProps) {
  const skillBudget = reviewData.skillBudget;
  const skillControlLabel = (action: "increase" | "decrease", skillName: string) =>
    `${action === "increase" ? text.INCREASE_LABEL : text.DECREASE_LABEL} ${skillName}`;

  return (
    <section>
      <h2>{label}</h2>
      <p className="skill-points-summary">
        {text.SKILLS_BUDGET_LABEL}: {skillBudget.total} | {text.SKILLS_SPENT_LABEL}:{" "}
        {skillBudget.spent} | {text.SKILLS_REMAINING_LABEL}: {skillBudget.remaining}
      </p>
      <div className="skills-table-wrap">
        <table className="review-table skills-table">
          <thead>
            <tr>
              <th>{text.REVIEW_SKILL_COLUMN}</th>
              <th>{text.SKILLS_TYPE_COLUMN}</th>
              <th>{text.SKILLS_POINTS_COLUMN}</th>
              <th>{text.SKILLS_RANKS_COLUMN}</th>
              <th>{text.SKILLS_BREAKDOWN_COLUMN}</th>
              <th>{text.REVIEW_TOTAL_COLUMN}</th>
              <th>{text.SKILLS_NOTES_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {skillEntities.map((skill) => {
              const skillView = skillViewModelById.get(skill.id);
              const ranks = selectedSkillRanks[skill.id] ?? 0;
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
              const armorCheckPenaltyApplies =
                skillView?.acpApplied ?? Boolean(skill.data?.armorCheckPenaltyApplies);
              const canDecrease = ranks > 0;
              const canIncrease =
                ranks + rankStep <= maxRanks &&
                skillBudget.remaining + 1e-9 >= costToIncrease;
              const updateRanks = (nextValue: number) =>
                setState((current) =>
                  applyChoice(current, STEP_ID_SKILLS, {
                    ...selectedSkillRanks,
                    [skill.id]: Math.min(maxRanks, Math.max(0, nextValue)),
                  }, context),
                );

              return (
                <tr key={skill.id}>
                  <td className="review-cell-key">{skill.displayName}</td>
                  <td>{classSkill ? text.SKILLS_CLASS_LABEL : text.SKILLS_CROSS_LABEL}</td>
                  <td>{costPerRank}{text.SKILLS_PER_RANK_UNIT}</td>
                  <td>
                    <div className="skill-rank-stepper">
                      <button
                        type="button"
                        className="ability-step-btn"
                        aria-label={skillControlLabel("decrease", skill.displayName)}
                        disabled={!canDecrease}
                        onClick={() => updateRanks(ranks - rankStep)}
                      >
                        -
                      </button>
                      <output
                        aria-label={`${skill.displayName} ranks`}
                        className="skill-rank-value"
                      >
                        {formatSkillValue(ranks)}
                      </output>
                      <button
                        type="button"
                        className="ability-step-btn"
                        aria-label={skillControlLabel("increase", skill.displayName)}
                        disabled={!canIncrease}
                        onClick={() => updateRanks(ranks + rankStep)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    {formatSkillValue(ranks)} + {formatSkillValue(abilityMod)} +{" "}
                    {formatSkillValue(miscBonus)} - {formatSkillValue(Math.abs(acpPenalty))} ={" "}
                    {formatSkillValue(total)}
                  </td>
                  <td>{formatSkillValue(total)}</td>
                  <td>
                    <div>{text.SKILLS_MAX_LABEL} {formatSkillValue(maxRanks)}</div>
                    <div>{text.SKILLS_RACIAL_LABEL} {racialBonus >= 0 ? "+" : ""}{formatSkillValue(racialBonus)}</div>
                    <div>
                      {armorCheckPenaltyApplies
                        ? text.SKILLS_ACP_APPLIES_LABEL
                        : text.SKILLS_ACP_NOT_APPLICABLE_LABEL}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
