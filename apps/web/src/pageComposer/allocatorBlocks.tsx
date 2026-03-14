import { AbilityMethodSelector } from "../components/AbilityMethodSelector";
import { PointBuyPanel } from "../components/PointBuyPanel";
import type {
  AbilityAllocatorData,
  SkillsAllocatorData,
} from "./pageDataBuilders";
import type { RegistryComponentProps } from "./baseBlocks";

export function AbilityAllocatorBlock({ node, data }: RegistryComponentProps) {
  const abilities = data as AbilityAllocatorData | undefined;
  if (!abilities) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  const { t } = abilities;

  return (
    <section data-node-id={node.id}>
      <h2>{abilities.title}</h2>
      <AbilityMethodSelector {...abilities.modeSelector} />
      {abilities.pointBuyPanel && (
        <PointBuyPanel
          pointCapLabel={t.POINT_CAP_LABEL}
          pointCap={abilities.pointBuyPanel.pointCap}
          pointCapMin={abilities.pointBuyPanel.pointCapMin}
          pointCapMax={abilities.pointBuyPanel.pointCapMax}
          pointCapStep={abilities.pointBuyPanel.pointCapStep}
          pointBuyRemainingLabel={t.POINT_BUY_REMAINING_LABEL}
          pointBuyRemaining={abilities.pointBuyPanel.pointBuyRemaining}
          showTableLabel={t.POINT_BUY_SHOW_TABLE_LABEL}
          hideTableLabel={t.POINT_BUY_HIDE_TABLE_LABEL}
          tableCaption={t.POINT_BUY_TABLE_CAPTION}
          scoreColumnLabel={t.POINT_BUY_SCORE_COLUMN}
          costColumnLabel={t.POINT_BUY_COST_COLUMN}
          isTableOpen={abilities.pointBuyPanel.isTableOpen}
          costTable={abilities.pointBuyPanel.costTable}
          onPointCapChange={abilities.pointBuyPanel.onPointCapChange}
          onToggleTable={abilities.pointBuyPanel.onToggleTable}
        />
      )}
      {abilities.rollSetsPanel && (
        <section className="sheet">
          <div className="rollsets-header">
            <h3>{abilities.rollSetsPanel.title}</h3>
            <button type="button" onClick={abilities.rollSetsPanel.onReroll}>
              {abilities.rollSetsPanel.rerollLabel}
            </button>
          </div>
          <p>{abilities.rollSetsPanel.description}</p>
          <fieldset role="radiogroup" aria-label={abilities.rollSetsPanel.ariaLabel}>
            {abilities.rollSetsPanel.options.map((option) => (
              <label key={option.id} className="rollset-option">
                <input
                  type="radio"
                  name="roll-set-choice"
                  checked={option.checked}
                  onChange={option.onSelect}
                />
                <span>{option.label}</span>
                <code>{option.scores}</code>
              </label>
            ))}
          </fieldset>
        </section>
      )}
      <div className="grid">
        {abilities.abilityRows.map((ability) => (
          <div key={ability.id} className="ability-input-row">
            <label htmlFor={`ability-input-${ability.id}`}>{ability.label}</label>
            <div className="ability-stepper">
              <button type="button" className="ability-step-btn" aria-label={`${t.DECREASE_LABEL} ${ability.label}`} disabled={!ability.canDecrease} onClick={ability.onDecrease}>-</button>
              <input id={`ability-input-${ability.id}`} type="number" disabled={ability.disabled} min={ability.min} max={ability.max} step={1} value={ability.value} onChange={(event) => ability.onChange(Number(event.target.value))} onBlur={ability.onBlur} />
              <button type="button" className="ability-step-btn" aria-label={`${t.INCREASE_LABEL} ${ability.label}`} disabled={!ability.canIncrease} onClick={ability.onIncrease}>+</button>
            </div>
          </div>
        ))}
      </div>
      {abilities.showModifierTable && (
        <article className="sheet">
          <h3>{t.ABILITY_EXISTING_MODIFIERS_LABEL}</h3>
          <table className="review-table">
            <thead>
              <tr>
                <th>{t.REVIEW_ABILITY_COLUMN}</th>
                <th>{t.REVIEW_BASE_COLUMN}</th>
                <th>{t.ABILITY_EXISTING_MODIFIERS_LABEL}</th>
                <th>{t.REVIEW_FINAL_COLUMN}</th>
                <th>{t.REVIEW_MODIFIER_COLUMN}</th>
              </tr>
            </thead>
            <tbody>
              {abilities.modifierRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.base}</td>
                  <td>
                    <div>{row.adjustment}</div>
                    {row.groups.length > 0 && (
                      <ul className="calc-list">
                        {row.groups.map((group) => (
                          <li key={group.id}>
                            <strong>{group.label}</strong>: {group.total}
                            <ul className="calc-list">
                              {group.items.map((item) => (
                                <li key={item.id}>
                                  <code>{item.delta}</code> {item.sourceLabel}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{row.final}</td>
                  <td>{row.mod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}

export function SkillsAllocatorBlock({ node, data }: RegistryComponentProps) {
  const skills = data as SkillsAllocatorData | undefined;
  if (!skills) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  const { t } = skills;

  return (
    <section data-node-id={node.id}>
      <h2>{skills.title}</h2>
      <p className="skill-points-summary">
        {t.SKILLS_BUDGET_LABEL}: {skills.budget.total} | {t.SKILLS_SPENT_LABEL}: {skills.budget.spent} | {t.SKILLS_REMAINING_LABEL}: {skills.budget.remaining}
      </p>
      <div className="skills-table-wrap">
        <table className="review-table skills-table">
          <thead>
            <tr>
              <th>{t.REVIEW_SKILL_COLUMN}</th>
              <th>{t.SKILLS_TYPE_COLUMN}</th>
              <th>{t.SKILLS_POINTS_COLUMN}</th>
              <th>{t.SKILLS_RANKS_COLUMN}</th>
              <th>{t.SKILLS_BREAKDOWN_COLUMN}</th>
              <th>{t.REVIEW_TOTAL_COLUMN}</th>
              <th>{t.SKILLS_NOTES_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {skills.rows.map((row) => (
              <tr key={row.id}>
                <td className="review-cell-key">{row.name}</td>
                <td>{row.typeLabel}</td>
                <td>{row.pointsLabel}</td>
                <td>
                  <div className="skill-rank-stepper">
                    <button type="button" className="ability-step-btn" aria-label={row.decreaseLabel} disabled={!row.canDecrease} onClick={row.onDecrease}>-</button>
                    <output aria-label={`${row.name} ranks`} className="skill-rank-value">{row.ranks}</output>
                    <button type="button" className="ability-step-btn" aria-label={row.increaseLabel} disabled={!row.canIncrease} onClick={row.onIncrease}>+</button>
                  </div>
                </td>
                <td>{row.breakdown}</td>
                <td>{row.total}</td>
                <td>{row.notes.map((note) => <div key={note}>{note}</div>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
