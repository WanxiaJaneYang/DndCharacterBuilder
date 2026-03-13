import type { UIText } from "../uiText";

type AbilityModifiersTableProps = {
  text: UIText;
  abilityOrder: readonly string[];
  localizeAbilityLabel: (ability: string) => string;
  state: { abilities: Record<string, number> };
  provenanceByTargetPath: Map<
    string,
    Array<{
      delta?: number;
      source: { packId: string; entityId: string };
    }>
  >;
  sourceMetaByEntityKey: Map<string, { sourceType: string; sourceLabel: string }>;
  reviewData: { abilities: Record<string, { score: number; mod: number }> };
  sourceTypeLabels?: Record<string, string>;
  hideZeroGroups: boolean;
};

const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

export function AbilityModifiersTable({
  text,
  abilityOrder,
  localizeAbilityLabel,
  state,
  provenanceByTargetPath,
  sourceMetaByEntityKey,
  reviewData,
  sourceTypeLabels = {},
  hideZeroGroups,
}: AbilityModifiersTableProps) {
  const groupLabel = (sourceType: string) =>
    sourceTypeLabels[sourceType] ??
    (sourceType === "unknown" ? text.REVIEW_UNRESOLVED_LABEL : sourceType);

  return (
    <article className="sheet">
      <h3>{text.ABILITY_EXISTING_MODIFIERS_LABEL}</h3>
      <table className="review-table">
        <thead>
          <tr>
            <th>{text.REVIEW_ABILITY_COLUMN}</th>
            <th>{text.REVIEW_BASE_COLUMN}</th>
            <th>{text.ABILITY_EXISTING_MODIFIERS_LABEL}</th>
            <th>{text.REVIEW_FINAL_COLUMN}</th>
            <th>{text.REVIEW_MODIFIER_COLUMN}</th>
          </tr>
        </thead>
        <tbody>
          {abilityOrder.map((ability) => {
            const records = provenanceByTargetPath.get(`abilities.${ability}.score`) ?? [];
            const baseScore = Number(state.abilities[ability] ?? 10);
            const adjustment = records.reduce((sum, record) => sum + Number(record.delta ?? 0), 0);
            const grouped = new Map<string, Array<{ sourceLabel: string; delta: number }>>();

            for (const record of records) {
              const delta = Number(record.delta ?? 0);
              if (!Number.isFinite(delta)) continue;
              const meta = sourceMetaByEntityKey.get(
                `${record.source.packId}:${record.source.entityId}`,
              );
              const sourceType = meta?.sourceType ?? "unknown";
              const sourceLabel = meta?.sourceLabel ?? text.REVIEW_UNRESOLVED_LABEL;
              const list = grouped.get(sourceType) ?? [];
              list.push({ sourceLabel, delta });
              grouped.set(sourceType, list);
            }

            const groupsToRender = Array.from(grouped.entries())
              .map(([sourceType, items]) => ({
                sourceType,
                items,
                total: items.reduce((sum, item) => sum + item.delta, 0),
              }))
              .filter((group) => !hideZeroGroups || group.total !== 0);

            return (
              <tr key={ability}>
                <td>{localizeAbilityLabel(ability)}</td>
                <td>{baseScore}</td>
                <td>
                  <div>{formatSigned(adjustment)}</div>
                  {groupsToRender.length > 0 && (
                    <ul className="calc-list">
                      {groupsToRender.map((group) => (
                        <li key={`${ability}-${group.sourceType}`}>
                          <strong>{groupLabel(group.sourceType)}</strong>:{" "}
                          {formatSigned(group.total)}
                          <ul className="calc-list">
                            {group.items.map((item, index) => (
                              <li key={`${ability}-${group.sourceType}-${index}`}>
                                <code>{formatSigned(item.delta)}</code> {item.sourceLabel}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{Number(reviewData.abilities[ability]?.score ?? baseScore)}</td>
                <td>{formatSigned(Number(reviewData.abilities[ability]?.mod ?? 0))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
