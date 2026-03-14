import type {
  ReviewSheetAdjustmentData,
  ReviewSkillsSectionData,
  ReviewTableSectionData,
} from "./pageDataBuilders";
import type { RegistryComponentProps } from "./baseBlocks";

function renderAdjustments(adjustments: ReviewSheetAdjustmentData[]) {
  if (adjustments.length === 0) {
    return <span className="review-muted">-</span>;
  }

  return (
    <ul className="calc-list">
      {adjustments.map((adjustment, index) => (
        <li key={`${adjustment.source}-${index}`}>
          <code>{adjustment.value}</code> {adjustment.source}
        </li>
      ))}
    </ul>
  );
}

function renderTable<Row extends { id: string }>(
  nodeId: string,
  section: ReviewTableSectionData<Row>,
  renderRow: (row: Row) => JSX.Element,
) {
  return (
    <article className="sheet" data-node-id={nodeId}>
      <h3>{section.title}</h3>
      <table className="review-table">
        {section.caption && <caption className="sr-only">{section.caption}</caption>}
        <thead>
          <tr>{section.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>{section.rows.map(renderRow)}</tbody>
      </table>
    </article>
  );
}

export function ReviewSaveHpBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewTableSectionData<{ id: string; label: string; base: number; ability: number; adjustments: number; final: number }> | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return renderTable(node.id, section, (row) => <tr key={row.id}><td className="review-cell-key">{row.label}</td><td>{row.base}</td><td>{row.ability}</td><td>{row.adjustments}</td><td>{row.final}</td></tr>);
}

export function ReviewTableAttacksBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewTableSectionData<{ id: string; typeLabel: string; name: string; attackBonus: string; damage: string; crit: string; range: string }> | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return renderTable(node.id, section, (row) => <tr key={row.id}><td className="review-cell-key">{row.typeLabel}</td><td>{row.name}</td><td>{row.attackBonus}</td><td>{row.damage}</td><td>{row.crit}</td><td>{row.range}</td></tr>);
}

export function ReviewTableAbilitiesBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewTableSectionData<{ id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: number; mod: string }> | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return renderTable(node.id, section, (row) => <tr key={row.id}><td className="review-cell-key">{row.label}</td><td>{row.base}</td><td>{renderAdjustments(row.adjustments)}</td><td>{row.final}</td><td>{row.mod}</td></tr>);
}

export function ReviewCombatBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewTableSectionData<{ id: string; label: string; base: number; adjustments: ReviewSheetAdjustmentData[]; final: string | number }> | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return renderTable(node.id, section, (row) => <tr key={row.id}><td className="review-cell-key">{row.label}</td><td>{row.base}</td><td>{renderAdjustments(row.adjustments)}</td><td>{row.final}</td></tr>);
}

export function ReviewSkillsBlock({ node, data }: RegistryComponentProps) {
  const section = data as ReviewSkillsSectionData | undefined;
  if (!section) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }
  return (
    <article className="sheet" data-node-id={node.id}>
      <h3>{section.title}</h3>
      <p className="review-skills-summary">{section.summaryLabel}</p>
      <table className="review-table">
        {section.caption && <caption className="sr-only">{section.caption}</caption>}
        <thead>
          <tr>{section.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {section.rows.map((row) => (
            <tr key={row.id}>
              <td className="review-cell-key">{row.name}</td>
              <td>{row.ranks}</td>
              <td>{row.ability}</td>
              <td>{row.racial}</td>
              <td>{row.misc}</td>
              <td>{row.acp}</td>
              <td>{row.total}</td>
              <td>{row.pointCost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
