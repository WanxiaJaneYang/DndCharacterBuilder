type PointBuyPanelProps = {
  pointCapLabel: string;
  pointCap: number;
  pointCapMin: number;
  pointCapMax: number;
  pointCapStep: number;
  pointBuyRemainingLabel: string;
  pointBuyRemaining: number;
  showTableLabel: string;
  hideTableLabel: string;
  tableCaption: string;
  scoreColumnLabel: string;
  costColumnLabel: string;
  isTableOpen: boolean;
  costTable: Record<string, number>;
  onPointCapChange: (value: number) => void;
  onToggleTable: () => void;
};

export function PointBuyPanel({
  pointCapLabel,
  pointCap,
  pointCapMin,
  pointCapMax,
  pointCapStep,
  pointBuyRemainingLabel,
  pointBuyRemaining,
  showTableLabel,
  hideTableLabel,
  tableCaption,
  scoreColumnLabel,
  costColumnLabel,
  isTableOpen,
  costTable,
  onPointCapChange,
  onToggleTable
}: PointBuyPanelProps) {
  const rows = Object.entries(costTable)
    .map(([score, cost]) => ({ score: Number(score), cost: Number(cost) }))
    .filter((row) => Number.isFinite(row.score) && Number.isFinite(row.cost))
    .sort((left, right) => left.score - right.score);

  return (
    <section className="point-buy-panel">
      <div className="point-buy-summary">
        <label>
          {pointCapLabel}
          <input
            type="number"
            min={pointCapMin}
            max={pointCapMax}
            step={pointCapStep}
            value={pointCap}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isFinite(parsed)) return;
              onPointCapChange(parsed);
            }}
          />
        </label>
        <p>{pointBuyRemainingLabel}: {pointBuyRemaining}</p>
      </div>
      <button
        type="button"
        className="point-buy-toggle"
        aria-expanded={isTableOpen}
        aria-controls="point-buy-cost-table"
        onClick={onToggleTable}
      >
        {isTableOpen ? hideTableLabel : showTableLabel}
      </button>
      {isTableOpen && (
        <div id="point-buy-cost-table" className="point-buy-table-wrap">
          <table className="point-buy-table" aria-label={tableCaption}>
            <thead>
              <tr>
                <th scope="col">{scoreColumnLabel}</th>
                <th scope="col">{costColumnLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.score}>
                  <td>{row.score}</td>
                  <td>{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
