import type { Page, PageSchemaNode } from "@dcb/schema";
import type { ReactNode } from "react";
import type { UIText } from "../uiText";

type SlotChildren = Record<string, ReactNode[]>;

export interface EntityTypeSingleSelectData {
  title: string;
  inputName: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
}

export interface MetadataNameFieldData {
  title: string;
  label: string;
  inputId: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export interface ReviewSheetAdjustmentData {
  value: string;
  source: string;
}

export interface ReviewSheetData {
  t: UIText;
  characterName: string;
  selectedRaceName: string;
  selectedClassName: string;
  identityRows: Array<{ label: string; value: string | number }>;
  statCards: Array<{ label: string; value: string | number }>;
  saveHpRows: Array<{
    label: string;
    base: number;
    ability: number;
    adjustments: number;
    final: number;
  }>;
  attackRows: Array<{
    id: string;
    typeLabel: string;
    name: string;
    attackBonus: string;
    damage: string;
    crit: string;
    range: string;
  }>;
  featSummary: Array<{ id: string; name: string; description: string }>;
  traitSummary: Array<{ id: string; name: string; description: string }>;
  abilityRows: Array<{
    id: string;
    label: string;
    base: number;
    adjustments: ReviewSheetAdjustmentData[];
    final: number;
    mod: string;
  }>;
  combatRows: Array<{
    id: string;
    label: string;
    base: number;
    adjustments: ReviewSheetAdjustmentData[];
    final: string | number;
  }>;
  skillsSummary: {
    spent: number;
    total: number;
    remaining: number;
  };
  skillsRows: Array<{
    id: string;
    name: string;
    ranks: string;
    ability: string;
    racial: string;
    misc: string;
    acp: string;
    total: string;
    pointCost: string;
  }>;
  equipmentLoad: {
    selectedItems: string;
    totalWeight: number;
    loadCategory: string;
    speedImpact: string;
  };
  movementDetail: {
    base: number;
    adjusted: number;
    notes: string;
  };
  rulesDecisions: {
    favoredClass: string;
    ignoresMulticlassXpPenalty: string;
    featSelectionLimit: number;
  };
  packInfo: {
    selectedEdition: string;
    enabledPacks: Array<{ packId: string; version: string }>;
    fingerprint: string;
  };
  showProvenance: boolean;
  provenanceJson: string;
  onExportJson: () => void;
  onToggleProvenance: () => void;
}

export interface PageComposerProps {
  schema: Page;
  dataRoot: Record<string, unknown>;
}

interface RegistryComponentProps {
  node: PageSchemaNode;
  data: unknown;
  slots: SlotChildren;
}

function resolveDataSource(
  dataRoot: Record<string, unknown>,
  path: string | undefined,
): unknown {
  if (!path) return undefined;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dataRoot);
}

function renderChildren(
  children: PageSchemaNode[] | undefined,
  dataRoot: Record<string, unknown>,
): SlotChildren {
  const slots: SlotChildren = {};

  for (const child of children ?? []) {
    const slot = child.slot ?? "default";
    slots[slot] ??= [];
    slots[slot].push(renderNode(child, dataRoot));
  }

  return slots;
}

function SingleColumnLayout({ node, slots }: RegistryComponentProps) {
  return (
    <section
      className="schema-layout schema-layout-single-column"
      data-node-id={node.id}
      data-page-composer-root={node.componentId}
    >
      {slots.header}
      <div className="schema-layout-main">{slots.main ?? slots.default}</div>
      {slots.footer}
    </section>
  );
}

function EntityTypeSingleSelectBlock({ node, data }: RegistryComponentProps) {
  const selection = data as EntityTypeSingleSelectData | undefined;
  if (!selection) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  return (
    <section className="schema-entity-single-select" data-node-id={node.id}>
      <h2>{selection.title}</h2>
      {selection.options.map((option) => (
        <label key={option.id}>
          <input
            type="radio"
            name={selection.inputName}
            checked={selection.value === option.id}
            onChange={() => selection.onSelect(option.id)}
          />
          {option.label}
        </label>
      ))}
    </section>
  );
}

function MetadataNameFieldBlock({ node, data }: RegistryComponentProps) {
  const field = data as MetadataNameFieldData | undefined;
  if (!field) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  return (
    <section className="schema-metadata-name-field" data-node-id={node.id}>
      <h2>{field.title}</h2>
      <label htmlFor={field.inputId}>{field.label}</label>
      <input
        id={field.inputId}
        value={field.value}
        placeholder={field.placeholder}
        aria-label={field.label}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </section>
  );
}

function ReviewSheetBlock({ node, data }: RegistryComponentProps) {
  const review = data as ReviewSheetData | undefined;
  if (!review) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  const { t } = review;

  return (
    <section className="review-page" data-node-id={node.id}>
      <h2>{t.REVIEW}</h2>
      <header className="review-hero">
        <div>
          <h3 className="review-character-name">{review.characterName}</h3>
          <p className="review-character-meta">
            {t.RACE_LABEL}: <strong>{review.selectedRaceName}</strong> |{" "}
            {t.CLASS_LABEL}: <strong>{review.selectedClassName}</strong>
          </p>
        </div>
        <div className="review-actions">
          <button onClick={review.onExportJson}>{t.EXPORT_JSON}</button>
          <button onClick={review.onToggleProvenance}>{t.TOGGLE_PROVENANCE}</button>
        </div>
      </header>

      <article className="sheet review-decisions">
        <h3>{t.REVIEW_IDENTITY_PROGRESSION}</h3>
        {review.identityRows.map((row) => (
          <p key={row.label}>
            {row.label}: {row.value}
          </p>
        ))}
      </article>

      <div className="review-stat-cards">
        {review.statCards.map((card) => (
          <article className="review-card" key={card.label}>
            <h3>{card.label}</h3>
            <p>{String(card.value)}</p>
          </article>
        ))}
      </div>

      <article className="sheet">
        <h3>{t.REVIEW_SAVE_HP_BREAKDOWN}</h3>
        <table className="review-table">
          <thead>
            <tr>
              <th>{t.REVIEW_STAT_COLUMN}</th>
              <th>{t.REVIEW_BASE_COLUMN}</th>
              <th>{t.REVIEW_ABILITY_COLUMN}</th>
              <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{t.REVIEW_FINAL_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {review.saveHpRows.map((row) => (
              <tr key={row.label}>
                <td className="review-cell-key">{row.label}</td>
                <td>{row.base}</td>
                <td>{row.ability}</td>
                <td>{row.adjustments}</td>
                <td>{row.final}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_ATTACK_LINES}</h3>
        <table className="review-table">
          <thead>
            <tr>
              <th>{t.REVIEW_ATTACK_TYPE_COLUMN}</th>
              <th>{t.REVIEW_ATTACK_ITEM_COLUMN}</th>
              <th>{t.REVIEW_ATTACK_BONUS_COLUMN}</th>
              <th>{t.REVIEW_DAMAGE_COLUMN}</th>
              <th>{t.REVIEW_CRIT_COLUMN}</th>
              <th>{t.REVIEW_RANGE_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {review.attackRows.map((row) => (
              <tr key={row.id}>
                <td className="review-cell-key">{row.typeLabel}</td>
                <td>{row.name}</td>
                <td>{row.attackBonus}</td>
                <td>{row.damage}</td>
                <td>{row.crit}</td>
                <td>{row.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_FEAT_SUMMARY}</h3>
        {review.featSummary.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {review.featSummary.map((feat) => (
              <li key={feat.id}>
                <strong>{feat.name}</strong>: {feat.description}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_TRAIT_SUMMARY}</h3>
        {review.traitSummary.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {review.traitSummary.map((trait) => (
              <li key={trait.id}>
                <strong>{trait.name}</strong>: {trait.description}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_ABILITY_BREAKDOWN}</h3>
        <table className="review-table">
          <caption className="sr-only">{t.REVIEW_ABILITY_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{t.REVIEW_ABILITY_COLUMN}</th>
              <th>{t.REVIEW_BASE_COLUMN}</th>
              <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{t.REVIEW_FINAL_COLUMN}</th>
              <th>{t.REVIEW_MODIFIER_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {review.abilityRows.map((row) => (
              <tr key={row.id}>
                <td className="review-cell-key">{row.label}</td>
                <td>{row.base}</td>
                <td>
                  {row.adjustments.length === 0 ? (
                    <span className="review-muted">-</span>
                  ) : (
                    <ul className="calc-list">
                      {row.adjustments.map((adjustment, index) => (
                        <li key={`${row.id}-${index}`}>
                          <code>{adjustment.value}</code> {adjustment.source}
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

      <article className="sheet">
        <h3>{t.REVIEW_COMBAT_BREAKDOWN}</h3>
        <table className="review-table">
          <caption className="sr-only">{t.REVIEW_COMBAT_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{t.REVIEW_STAT_COLUMN}</th>
              <th>{t.REVIEW_BASE_COLUMN}</th>
              <th>{t.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{t.REVIEW_FINAL_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {review.combatRows.map((row) => (
              <tr key={row.id}>
                <td className="review-cell-key">{row.label}</td>
                <td>{row.base}</td>
                <td>
                  {row.adjustments.length === 0 ? (
                    <span className="review-muted">-</span>
                  ) : (
                    <ul className="calc-list">
                      {row.adjustments.map((adjustment, index) => (
                        <li key={`${row.id}-${index}`}>
                          <code>{adjustment.value}</code> {adjustment.source}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{row.final}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_SKILLS_BREAKDOWN}</h3>
        <p className="review-skills-summary">
          {t.REVIEW_POINTS_SPENT_LABEL} {review.skillsSummary.spent} / {review.skillsSummary.total} (
          {review.skillsSummary.remaining} {t.REVIEW_REMAINING_LABEL})
        </p>
        <table className="review-table">
          <caption className="sr-only">{t.REVIEW_SKILLS_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{t.REVIEW_SKILL_COLUMN}</th>
              <th>{t.REVIEW_RANKS_COLUMN}</th>
              <th>{t.REVIEW_ABILITY_COLUMN}</th>
              <th>{t.REVIEW_RACIAL_COLUMN}</th>
              <th>{t.REVIEW_MISC_COLUMN}</th>
              <th>{t.REVIEW_ACP_COLUMN}</th>
              <th>{t.REVIEW_TOTAL_COLUMN}</th>
              <th>{t.REVIEW_POINT_COST_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {review.skillsRows.map((row) => (
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

      <article className="sheet">
        <h3>{t.REVIEW_EQUIPMENT_LOAD}</h3>
        <p>
          {t.REVIEW_SELECTED_ITEMS_LABEL}: {review.equipmentLoad.selectedItems}
        </p>
        <p>
          {t.REVIEW_TOTAL_WEIGHT_LABEL}: {review.equipmentLoad.totalWeight}
        </p>
        <p>
          {t.REVIEW_LOAD_CATEGORY_LABEL}: {review.equipmentLoad.loadCategory}
        </p>
        <p>
          {t.REVIEW_SPEED_IMPACT_LABEL}: {review.equipmentLoad.speedImpact}
        </p>
      </article>

      <article className="sheet">
        <h3>{t.REVIEW_MOVEMENT_DETAIL}</h3>
        <p>
          {t.REVIEW_SPEED_BASE_LABEL}: {review.movementDetail.base}
        </p>
        <p>
          {t.REVIEW_SPEED_ADJUSTED_LABEL}: {review.movementDetail.adjusted}
        </p>
        <p>
          {t.REVIEW_MOVEMENT_NOTES_LABEL}: {review.movementDetail.notes}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{t.REVIEW_RULES_DECISIONS}</h3>
        <p>
          {t.REVIEW_FAVORED_CLASS_LABEL}: {review.rulesDecisions.favoredClass}
        </p>
        <p>
          {t.REVIEW_MULTICLASS_XP_IGNORED_LABEL}: {review.rulesDecisions.ignoresMulticlassXpPenalty}
        </p>
        <p>
          {t.REVIEW_FEAT_SLOTS_LABEL}: {review.rulesDecisions.featSelectionLimit}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{t.REVIEW_PACK_INFO}</h3>
        <p>
          {t.REVIEW_SELECTED_EDITION_LABEL}: {review.packInfo.selectedEdition}
        </p>
        <p>{t.REVIEW_ENABLED_PACKS_LABEL}:</p>
        <ul>
          {review.packInfo.enabledPacks.map((pack) => (
            <li key={pack.packId}>
              {pack.packId} ({pack.version})
            </li>
          ))}
        </ul>
        <p>
          {t.REVIEW_FINGERPRINT_LABEL}: <code>{review.packInfo.fingerprint}</code>
        </p>
      </article>

      {review.showProvenance && (
        <article className="sheet">
          <h3>{t.REVIEW_RAW_PROVENANCE}</h3>
          <pre>{review.provenanceJson}</pre>
        </article>
      )}
    </section>
  );
}

const componentRegistry: Record<string, (props: RegistryComponentProps) => ReactNode> = {
  "layout.singleColumn": SingleColumnLayout,
  "entityType.singleSelect": EntityTypeSingleSelectBlock,
  "metadata.nameField": MetadataNameFieldBlock,
  "review.sheet": ReviewSheetBlock,
};

function renderNode(node: PageSchemaNode, dataRoot: Record<string, unknown>): ReactNode {
  const Component = componentRegistry[node.componentId];
  if (!Component) {
    throw new Error(`No registered renderer for component ${node.componentId}`);
  }

  return (
    <Component
      key={node.id}
      node={node}
      data={resolveDataSource(dataRoot, node.dataSource)}
      slots={renderChildren(node.children, dataRoot)}
    />
  );
}

export function PageComposer({ schema, dataRoot }: PageComposerProps) {
  return (
    <div data-page-schema-id={schema.id}>
      {renderNode(schema.root, dataRoot)}
    </div>
  );
}
