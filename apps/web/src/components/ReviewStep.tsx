import type { ResolvedPackSet } from "@dcb/datapack";
import { DEFAULT_STATS, type CharacterState, type ComputeResult } from "@dcb/engine";
import type { EditionOption } from "../editions";
import type { UIText } from "../uiText";
import {
  deriveValueFromProvenance,
  getEntityDataRecord,
  getEntityDataString,
  type LocalSkillUiDetail,
  type SkillBudgetSummary,
} from "../appHelpers";

type EntityLike = {
  name: string;
  data?: unknown;
};

type ReviewStepProps = {
  text: UIText;
  state: CharacterState;
  spec: {
    meta: { name?: string };
    class?: { classId?: string; level?: number };
  };
  computeResult: ComputeResult;
  reviewData: ComputeResult["sheetViewModel"]["data"]["review"];
  combatData: ComputeResult["sheetViewModel"]["data"]["combat"];
  entities: ResolvedPackSet["entities"];
  selectedEdition: EditionOption;
  fingerprint: string;
  selectedFeats: string[];
  selectedRaceEntity?: EntityLike;
  selectedClassEntity?: EntityLike;
  selectedRaceSize: string;
  baseSpeed: number;
  adjustedSpeed: number;
  totalWeight: number;
  loadCategory: string;
  skillBudget: SkillBudgetSummary;
  skillUiDetailById: Map<string, LocalSkillUiDetail>;
  provenanceByTargetPath: Map<string, NonNullable<ComputeResult["provenance"]>>;
  sourceNameByEntityId: Map<string, string>;
  packVersionById: Map<string, string>;
  enabledPackIds: string[];
  selectedEquipmentIds: string[];
  featSelectionLimit: number;
  showProv: boolean;
  onToggleProvenance: () => void;
  onExportJson: () => void;
  localizeLoadCategory: (category: "light" | "medium" | "heavy") => string;
  formatSpeedImpact: (adjustedSpeed: number, reducesSpeed: boolean) => string;
  formatMovementNotes: (reducedByArmorOrLoad: boolean) => string[];
  localizeAbilityLabel: (ability: string) => string;
  localizeEntityText: (
    entityType: string,
    entityId: string,
    path: string,
    fallback: string,
  ) => string;
};

export function ReviewStep({
  text,
  state,
  spec,
  computeResult,
  reviewData,
  combatData,
  entities,
  selectedEdition,
  fingerprint,
  selectedFeats,
  selectedRaceEntity,
  selectedClassEntity,
  selectedRaceSize,
  baseSpeed,
  adjustedSpeed,
  totalWeight,
  loadCategory,
  skillBudget,
  skillUiDetailById,
  provenanceByTargetPath,
  sourceNameByEntityId,
  packVersionById,
  enabledPackIds,
  selectedEquipmentIds,
  featSelectionLimit,
  showProv,
  onToggleProvenance,
  onExportJson,
  localizeLoadCategory,
  formatSpeedImpact,
  formatMovementNotes,
  localizeAbilityLabel,
  localizeEntityText,
}: ReviewStepProps) {
  const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const statOrder = [
    "hp",
    "ac",
    "initiative",
    "speed",
    "bab",
    "fort",
    "ref",
    "will",
  ] as const;
  const statLabels: Record<(typeof statOrder)[number], string> = {
    hp: text.REVIEW_HP_LABEL,
    ac: text.REVIEW_AC_LABEL,
    initiative: text.REVIEW_INITIATIVE_LABEL,
    speed: text.REVIEW_SPEED_LABEL,
    bab: text.REVIEW_BAB_LABEL,
    fort: text.REVIEW_FORT_LABEL,
    ref: text.REVIEW_REF_LABEL,
    will: text.REVIEW_WILL_LABEL,
  };
  const statBaseDefaults: Record<(typeof statOrder)[number], number> = {
    hp: DEFAULT_STATS.hp,
    ac: DEFAULT_STATS.ac,
    initiative: DEFAULT_STATS.initiative,
    speed: DEFAULT_STATS.speed,
    bab: DEFAULT_STATS.bab,
    fort: DEFAULT_STATS.fort,
    ref: DEFAULT_STATS.ref,
    will: DEFAULT_STATS.will,
  };
  const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
  const formatSourceLabel = (packId: string, entityId: string) =>
    sourceNameByEntityId.get(`${packId}:${entityId}`) ??
    text.REVIEW_UNRESOLVED_LABEL;
  const selectedRaceId = String(state.selections.race ?? "");
  const selectedClassId = spec.class?.classId ?? String(state.selections.class ?? "");
  const selectedRaceName = selectedRaceId
    ? localizeEntityText(
        "races",
        selectedRaceId,
        "name",
        selectedRaceEntity?.name ?? text.REVIEW_UNRESOLVED_LABEL,
      )
    : text.REVIEW_UNRESOLVED_LABEL;
  const selectedClassName = selectedClassId
    ? localizeEntityText(
        "classes",
        selectedClassId,
        "name",
        selectedClassEntity?.name ?? text.REVIEW_UNRESOLVED_LABEL,
      )
    : text.REVIEW_UNRESOLVED_LABEL;
  const finalStatValues = {
    hp: reviewData.hp.total,
    ac: combatData.ac.total,
    initiative: reviewData.initiative.total,
    speed: adjustedSpeed,
    bab: deriveValueFromProvenance(
      provenanceByTargetPath.get("stats.bab") ?? [],
      DEFAULT_STATS.bab,
    ),
    fort: reviewData.saves.fort.total,
    ref: reviewData.saves.ref.total,
    will: reviewData.saves.will.total,
  } as const;
  const favoredClass = getEntityDataString(selectedRaceEntity, "favoredClass");
  const racialTraits = Array.isArray(getEntityDataRecord(selectedRaceEntity).racialTraits)
    ? (getEntityDataRecord(selectedRaceEntity).racialTraits as Array<
        Record<string, unknown>
      >)
    : [];
  const reviewSkills = computeResult.sheetViewModel.data.skills
    .filter((skill) => {
      const detail = skillUiDetailById.get(skill.id);
      return skill.ranks > 0 || (detail?.racialBonus ?? 0) !== 0;
    })
    .sort((a, b) => {
      const left = localizeEntityText("skills", a.id, "name", a.name);
      const right = localizeEntityText("skills", b.id, "name", b.name);
      return b.total - a.total || left.localeCompare(right);
    });
  const enabledPackDetails = enabledPackIds.map((packId) => ({
    packId,
    version: packVersionById.get(packId) ?? text.REVIEW_UNKNOWN_VERSION,
  }));

  return (
    <section className="review-page">
      <h2>{text.REVIEW}</h2>
      <header className="review-hero">
        <div>
          <h3 className="review-character-name">
            {spec.meta.name || text.UNNAMED_CHARACTER}
          </h3>
          <p className="review-character-meta">
            {text.RACE_LABEL}: <strong>{selectedRaceName}</strong> |{" "}
            {text.CLASS_LABEL}: <strong>{selectedClassName}</strong>
          </p>
        </div>
        <div className="review-actions">
          <button onClick={onExportJson}>{text.EXPORT_JSON}</button>
          <button onClick={onToggleProvenance}>{text.TOGGLE_PROVENANCE}</button>
        </div>
      </header>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_IDENTITY_PROGRESSION}</h3>
        <p>
          {text.REVIEW_LEVEL_LABEL}: {spec.class?.level ?? 0}
        </p>
        <p>
          {text.REVIEW_XP_LABEL}: 0
        </p>
        <p>
          {text.REVIEW_SIZE_LABEL}: {selectedRaceSize}
        </p>
        <p>
          {text.REVIEW_SPEED_BASE_LABEL}: {baseSpeed}
        </p>
        <p>
          {text.REVIEW_SPEED_ADJUSTED_LABEL}: {adjustedSpeed}
        </p>
      </article>

      <div className="review-stat-cards">
        <article className="review-card">
          <h3>{text.REVIEW_AC_LABEL}</h3>
          <p>{String(combatData.ac.total)}</p>
        </article>
        <article className="review-card">
          <h3>{text.REVIEW_AC_TOUCH_LABEL}</h3>
          <p>{String(combatData.ac.touch)}</p>
        </article>
        <article className="review-card">
          <h3>{text.REVIEW_AC_FLAT_FOOTED_LABEL}</h3>
          <p>{String(combatData.ac.flatFooted)}</p>
        </article>
        <article className="review-card">
          <h3>{text.REVIEW_HP_LABEL}</h3>
          <p>{String(reviewData.hp.total)}</p>
        </article>
        <article className="review-card">
          <h3>{text.REVIEW_INITIATIVE_LABEL}</h3>
          <p>{String(reviewData.initiative.total)}</p>
        </article>
        <article className="review-card">
          <h3>{text.REVIEW_GRAPPLE_LABEL}</h3>
          <p>{String(reviewData.grapple.total)}</p>
        </article>
      </div>

      <article className="sheet">
        <h3>{text.REVIEW_SAVE_HP_BREAKDOWN}</h3>
        <table className="review-table">
          <thead>
            <tr>
              <th>{text.REVIEW_STAT_COLUMN}</th>
              <th>{text.REVIEW_BASE_COLUMN}</th>
              <th>{text.REVIEW_ABILITY_COLUMN}</th>
              <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{text.REVIEW_FINAL_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="review-cell-key">{text.REVIEW_FORT_LABEL}</td>
              <td>{reviewData.saves.fort.base}</td>
              <td>{reviewData.saves.fort.ability}</td>
              <td>{reviewData.saves.fort.misc}</td>
              <td>{reviewData.saves.fort.total}</td>
            </tr>
            <tr>
              <td className="review-cell-key">{text.REVIEW_REF_LABEL}</td>
              <td>{reviewData.saves.ref.base}</td>
              <td>{reviewData.saves.ref.ability}</td>
              <td>{reviewData.saves.ref.misc}</td>
              <td>{reviewData.saves.ref.total}</td>
            </tr>
            <tr>
              <td className="review-cell-key">{text.REVIEW_WILL_LABEL}</td>
              <td>{reviewData.saves.will.base}</td>
              <td>{reviewData.saves.will.ability}</td>
              <td>{reviewData.saves.will.misc}</td>
              <td>{reviewData.saves.will.total}</td>
            </tr>
            <tr>
              <td className="review-cell-key">{text.REVIEW_HP_LABEL}</td>
              <td>{reviewData.hp.breakdown.hitDie}</td>
              <td>{reviewData.hp.breakdown.con}</td>
              <td>{reviewData.hp.breakdown.misc}</td>
              <td>{reviewData.hp.total}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_ATTACK_LINES}</h3>
        <table className="review-table">
          <thead>
            <tr>
              <th>{text.REVIEW_ATTACK_TYPE_COLUMN}</th>
              <th>{text.REVIEW_ATTACK_ITEM_COLUMN}</th>
              <th>{text.REVIEW_ATTACK_BONUS_COLUMN}</th>
              <th>{text.REVIEW_DAMAGE_COLUMN}</th>
              <th>{text.REVIEW_CRIT_COLUMN}</th>
              <th>{text.REVIEW_RANGE_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {combatData.attacks.map((attack) => (
              <tr key={`${attack.category}-${attack.itemId}`}>
                <td className="review-cell-key">
                  {attack.category === "melee"
                    ? text.REVIEW_ATTACK_MELEE_LABEL
                    : text.REVIEW_ATTACK_RANGED_LABEL}
                </td>
                <td>{attack.name}</td>
                <td>{formatSigned(attack.attackBonus)}</td>
                <td>{attack.damageLine}</td>
                <td>{attack.crit}</td>
                <td>{attack.category === "ranged" ? attack.range ?? "-" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_FEAT_SUMMARY}</h3>
        {selectedFeats.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {selectedFeats.map((featId) => {
              const feat = entities.feats?.[featId];
              return (
                <li key={featId}>
                  <strong>{feat?.name ?? featId}</strong>:{" "}
                  {feat?.summary ?? feat?.description ?? featId}
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_TRAIT_SUMMARY}</h3>
        {racialTraits.length === 0 ? (
          <p className="review-muted">-</p>
        ) : (
          <ul className="calc-list">
            {racialTraits.map((trait, index) => (
              <li key={`${String(trait.name ?? "")}-${index}`}>
                <strong>{String(trait.name ?? "")}</strong>:{" "}
                {String(trait.description ?? "").trim()}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_ABILITY_BREAKDOWN}</h3>
        <table className="review-table">
          <caption className="sr-only">{text.REVIEW_ABILITY_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{text.REVIEW_ABILITY_COLUMN}</th>
              <th>{text.REVIEW_BASE_COLUMN}</th>
              <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{text.REVIEW_FINAL_COLUMN}</th>
              <th>{text.REVIEW_MODIFIER_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {abilityOrder.map((ability) => {
              const abilityLabel = localizeAbilityLabel(ability);
              const baseScore = Number(state.abilities[ability] ?? 10);
              const targetPath = `abilities.${ability}.score`;
              const records = provenanceByTargetPath.get(targetPath) ?? [];
              const finalScore = reviewData.abilities[ability]?.score ?? baseScore;
              const finalMod = reviewData.abilities[ability]?.mod ?? 0;

              return (
                <tr key={ability}>
                  <td className="review-cell-key">{abilityLabel}</td>
                  <td>{baseScore}</td>
                  <td>
                    {records.length === 0 ? (
                      <span className="review-muted">-</span>
                    ) : (
                      <ul className="calc-list">
                        {records.map((record, index) => (
                          <li key={`${targetPath}-${index}`}>
                            <code>
                              {record.delta !== undefined
                                ? formatSigned(record.delta)
                                : `= ${record.setValue ?? 0}`}
                            </code>{" "}
                            {formatSourceLabel(
                              record.source.packId,
                              record.source.entityId,
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{finalScore}</td>
                  <td>{formatSigned(finalMod)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_COMBAT_BREAKDOWN}</h3>
        <table className="review-table">
          <caption className="sr-only">{text.REVIEW_COMBAT_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{text.REVIEW_STAT_COLUMN}</th>
              <th>{text.REVIEW_BASE_COLUMN}</th>
              <th>{text.REVIEW_ADJUSTMENTS_COLUMN}</th>
              <th>{text.REVIEW_FINAL_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {statOrder.map((statKey) => {
              const targetPath = `stats.${statKey}`;
              const records = provenanceByTargetPath.get(targetPath) ?? [];
              const firstSetIndex = records.findIndex(
                (record) => record.setValue !== undefined,
              );
              const baseValue =
                firstSetIndex >= 0
                  ? Number(
                      records[firstSetIndex]?.setValue ?? statBaseDefaults[statKey],
                    )
                  : statBaseDefaults[statKey];
              const adjustmentRecords = records.filter(
                (_, index) => index !== firstSetIndex,
              );

              return (
                <tr key={statKey}>
                  <td className="review-cell-key">{statLabels[statKey]}</td>
                  <td>{baseValue}</td>
                  <td>
                    {adjustmentRecords.length === 0 ? (
                      <span className="review-muted">-</span>
                    ) : (
                      <ul className="calc-list">
                        {adjustmentRecords.map((record, index) => (
                          <li key={`${targetPath}-${index}`}>
                            <code>
                              {record.delta !== undefined
                                ? formatSigned(record.delta)
                                : `= ${record.setValue ?? 0}`}
                            </code>{" "}
                            {formatSourceLabel(
                              record.source.packId,
                              record.source.entityId,
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{String(finalStatValues[statKey])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>

      <article className="sheet">
        <h3>{text.REVIEW_SKILLS_BREAKDOWN}</h3>
        <p>
          {text.REVIEW_POINTS_SPENT_LABEL} {skillBudget.spent} / {skillBudget.total} (
          {skillBudget.remaining} {text.REVIEW_REMAINING_LABEL})
        </p>
        <table className="review-table">
          <caption className="sr-only">{text.REVIEW_SKILLS_TABLE_CAPTION}</caption>
          <thead>
            <tr>
              <th>{text.REVIEW_SKILL_COLUMN}</th>
              <th>{text.REVIEW_RANKS_COLUMN}</th>
              <th>{text.REVIEW_ABILITY_COLUMN}</th>
              <th>{text.REVIEW_RACIAL_COLUMN}</th>
              <th>{text.REVIEW_MISC_COLUMN}</th>
              <th>{text.REVIEW_ACP_COLUMN}</th>
              <th>{text.REVIEW_TOTAL_COLUMN}</th>
              <th>{text.REVIEW_POINT_COST_COLUMN}</th>
            </tr>
          </thead>
          <tbody>
            {reviewSkills.map((skill) => {
              const detail = skillUiDetailById.get(skill.id);
              return (
                <tr key={skill.id}>
                  <td className="review-cell-key">
                    {localizeEntityText("skills", skill.id, "name", skill.name)}
                  </td>
                  <td>{skill.ranks}</td>
                  <td>
                    {formatSigned(skill.abilityMod)} ({localizeAbilityLabel(skill.abilityKey)})
                  </td>
                  <td>{formatSigned(detail?.racialBonus ?? 0)}</td>
                  <td>{formatSigned(skill.misc)}</td>
                  <td>{formatSigned(skill.acp)}</td>
                  <td>{skill.total}</td>
                  <td>
                    {detail?.costSpent ?? 0} ({detail?.costPerRank ?? 0}
                    {text.REVIEW_PER_RANK_UNIT})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_EQUIPMENT_LOAD}</h3>
        <p>
          {text.REVIEW_SELECTED_ITEMS_LABEL}:{" "}
          {selectedEquipmentIds
            .map((itemId) => localizeEntityText("items", itemId, "name", itemId))
            .join(", ") || "-"}
        </p>
        <p>
          {text.REVIEW_TOTAL_WEIGHT_LABEL}: {totalWeight}
        </p>
        <p>
          {text.REVIEW_LOAD_CATEGORY_LABEL}: {localizeLoadCategory(loadCategory as "light" | "medium" | "heavy")}
        </p>
        <p>
          {text.REVIEW_SPEED_IMPACT_LABEL}:{" "}
          {formatSpeedImpact(
            adjustedSpeed,
            reviewData.equipmentLoad.reducesSpeed,
          )}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_MOVEMENT_DETAIL}</h3>
        <p>
          {text.REVIEW_SPEED_BASE_LABEL}: {baseSpeed}
        </p>
        <p>
          {text.REVIEW_SPEED_ADJUSTED_LABEL}: {adjustedSpeed}
        </p>
        <p>
          {text.REVIEW_MOVEMENT_NOTES_LABEL}:{" "}
          {formatMovementNotes(
            reviewData.movement.reducedByArmorOrLoad,
          ).join("; ")}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_RULES_DECISIONS}</h3>
        <p>
          {text.REVIEW_FAVORED_CLASS_LABEL}:{" "}
          {!favoredClass
            ? "-"
            : favoredClass === "any"
              ? text.REVIEW_FAVORED_CLASS_ANY
              : localizeEntityText(
                  "classes",
                  favoredClass,
                  "name",
                  favoredClass,
                )}
        </p>
        <p>
          {text.REVIEW_MULTICLASS_XP_IGNORED_LABEL}:{" "}
          {!favoredClass ||
          favoredClass === "any" ||
          favoredClass === (spec.class?.classId ?? "")
            ? text.REVIEW_YES
            : text.REVIEW_NO}
        </p>
        <p>
          {text.REVIEW_FEAT_SLOTS_LABEL}: {featSelectionLimit}
        </p>
      </article>

      <article className="sheet review-decisions">
        <h3>{text.REVIEW_PACK_INFO}</h3>
        <p>
          {text.REVIEW_SELECTED_EDITION_LABEL}:{" "}
          {selectedEdition.label || selectedEdition.id || "-"}
        </p>
        <p>{text.REVIEW_ENABLED_PACKS_LABEL}:</p>
        <ul>
          {enabledPackDetails.map((pack) => (
            <li key={pack.packId}>
              {pack.packId} ({pack.version})
            </li>
          ))}
        </ul>
        <p>
          {text.REVIEW_FINGERPRINT_LABEL}:{" "}
          <code>{fingerprint}</code>
        </p>
      </article>

      {showProv && (
        <article className="sheet">
          <h3>{text.REVIEW_RAW_PROVENANCE}</h3>
          <pre>{JSON.stringify(computeResult.provenance ?? [], null, 2)}</pre>
        </article>
      )}
    </section>
  );
}
