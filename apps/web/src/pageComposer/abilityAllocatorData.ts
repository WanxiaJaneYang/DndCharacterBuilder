import type { AbilityCode, UIText } from "../uiText";
import type {
  AbilityAllocatorData,
  AbilityMode,
  AbilityModeSelectorHandlers,
} from "./abilityAllocatorTypes";

type AbilityModeUI = Partial<
  Record<AbilityMode, { labelKey?: string; hintKey?: string }>
>;

type ProvenanceRecord = {
  delta?: number;
  source: { packId: string; entityId: string };
};

type Args = {
  t: UIText;
  title: string;
  abilityModes: AbilityMode[];
  selectedAbilityMode?: AbilityMode;
  selectedAbilityModeValue: string;
  modeUi?: AbilityModeUI;
  abilityMethodHintOpen: boolean;
  modeSelectorHandlers: AbilityModeSelectorHandlers;
  pointBuyPanel?: AbilityAllocatorData["pointBuyPanel"];
  rollSetsPanel?: AbilityAllocatorData["rollSetsPanel"];
  abilityOrder: readonly AbilityCode[];
  abilityScores: Record<string, number>;
  abilityMinScore: number;
  abilityMaxScore: number;
  rollSetNeedsSelection: boolean;
  onAbilityChange: (ability: AbilityCode, value: number) => void;
  onAbilityBlur: (ability: AbilityCode) => void;
  onAbilityStep: (ability: AbilityCode, delta: number) => void;
  reviewAbilities: Partial<Record<AbilityCode, { score?: number; mod?: number }>>;
  provenanceByTargetPath: Map<string, ProvenanceRecord[]>;
  sourceMetaByEntityKey: Map<string, { sourceType: string; sourceLabel: string }>;
  localizeAbilityLabel: (ability: AbilityCode) => string;
  showModifierTable: boolean;
  hideZeroGroups: boolean;
  sourceTypeLabels: Record<string, string>;
};

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function normalizeUITextKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}

export function getUITextValue(t: UIText, key?: string): string | undefined {
  if (!key) return undefined;
  const textMap = t as unknown as Record<string, unknown>;
  const normalized = normalizeUITextKey(key);
  const value = textMap[key] ?? (normalized ? textMap[normalized] : undefined);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function buildAbilitiesAllocatorData(args: Args): AbilityAllocatorData {
  const defaultModeLabel = (mode: AbilityMode) =>
    mode === "pointBuy"
      ? args.t.ABILITY_MODE_POINT_BUY
      : mode === "phb"
        ? args.t.ABILITY_MODE_PHB
        : args.t.ABILITY_MODE_ROLL_SETS;
  const hintMode = args.selectedAbilityMode ?? args.abilityModes[0];
  const activeModeHint = hintMode
    ? getUITextValue(args.t, args.modeUi?.[hintMode]?.hintKey) ?? ""
    : "";
  const hasActiveModeHint = activeModeHint.length > 0;

  return {
    t: args.t,
    title: args.title,
    modeSelector: {
      label: args.t.ABILITY_GENERATION_LABEL,
      helpLabel: args.t.ABILITY_METHOD_HELP_LABEL,
      helpText: activeModeHint,
      isHintVisible: args.abilityMethodHintOpen && hasActiveModeHint,
      isHintAvailable: hasActiveModeHint,
      value: args.selectedAbilityModeValue,
      options: args.abilityModes.map((mode) => ({
        value: mode,
        label: getUITextValue(args.t, args.modeUi?.[mode]?.labelKey) ?? defaultModeLabel(mode),
      })),
      ...args.modeSelectorHandlers,
    },
    pointBuyPanel: args.pointBuyPanel,
    rollSetsPanel: args.rollSetsPanel,
    abilityRows: args.abilityOrder.map((ability) => {
      const value = Number(args.abilityScores[ability] ?? 0);
      const canEditAbility = !args.rollSetNeedsSelection;
      return {
        id: ability,
        label: args.localizeAbilityLabel(ability),
        value,
        disabled: !canEditAbility,
        min: args.abilityMinScore,
        max: args.abilityMaxScore,
        canDecrease: canEditAbility && value > args.abilityMinScore,
        canIncrease: canEditAbility && value < args.abilityMaxScore,
        onChange: (nextValue: number) => args.onAbilityChange(ability, nextValue),
        onBlur: () => args.onAbilityBlur(ability),
        onDecrease: () => args.onAbilityStep(ability, -1),
        onIncrease: () => args.onAbilityStep(ability, 1),
      };
    }),
    modifierRows: args.abilityOrder.map((ability) => buildModifierRow(args, ability)),
    showModifierTable: args.showModifierTable,
  };
}

function buildModifierRow(args: Args, ability: AbilityCode) {
  const targetPath = `abilities.${ability}.score`;
  const records = args.provenanceByTargetPath.get(targetPath) ?? [];
  const baseScore = Number(args.abilityScores[ability] ?? 10);
  const adjustment = records.reduce((sum, record) => sum + Number(record.delta ?? 0), 0);
  const groups = Array.from(
    records.reduce((map, record) => {
      const delta = Number(record.delta ?? 0);
      if (!Number.isFinite(delta)) return map;
      const meta = args.sourceMetaByEntityKey.get(`${record.source.packId}:${record.source.entityId}`);
      const sourceType = meta?.sourceType ?? "unknown";
      const items = map.get(sourceType) ?? [];
      items.push({ sourceLabel: meta?.sourceLabel ?? args.t.REVIEW_UNRESOLVED_LABEL, delta });
      map.set(sourceType, items);
      return map;
    }, new Map<string, Array<{ sourceLabel: string; delta: number }>>()).entries(),
  )
    .map(([sourceType, items]) => ({ sourceType, items, total: items.reduce((sum, item) => sum + item.delta, 0) }))
    .filter((group) => !args.hideZeroGroups || group.total !== 0);

  return {
    id: ability,
    label: args.localizeAbilityLabel(ability),
    base: baseScore,
    adjustment: formatSigned(adjustment),
    groups: groups.map((group) => ({
      id: `${ability}-${group.sourceType}`,
      label: args.sourceTypeLabels[group.sourceType] ?? (group.sourceType === "unknown" ? args.t.REVIEW_UNRESOLVED_LABEL : group.sourceType),
      total: formatSigned(group.total),
      items: group.items.map((item, index) => ({
        id: `${ability}-${group.sourceType}-${index}`,
        delta: formatSigned(item.delta),
        sourceLabel: item.sourceLabel,
      })),
    })),
    final: Number(args.reviewAbilities[ability]?.score ?? baseScore),
    mod: formatSigned(Number(args.reviewAbilities[ability]?.mod ?? 0)),
  };
}
