import type { AbilityCode, UIText } from "../uiText";
import {
  buildAbilitiesAllocatorData,
  type AbilityAllocatorData,
  type AbilityMode,
  type AbilityModeSelectorHandlers,
} from "./pageDataBuilders";

type Args = {
  t: UIText;
  title: string;
  abilityModes: AbilityMode[];
  selectedAbilityMode?: AbilityMode;
  selectedAbilityModeValue: string;
  modeUi?: Partial<Record<AbilityMode, { labelKey?: string; hintKey?: string }>>;
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
  reviewAbilities: Parameters<typeof buildAbilitiesAllocatorData>[0]["reviewAbilities"];
  provenanceByTargetPath: Parameters<typeof buildAbilitiesAllocatorData>[0]["provenanceByTargetPath"];
  sourceMetaByEntityKey: Parameters<typeof buildAbilitiesAllocatorData>[0]["sourceMetaByEntityKey"];
  localizeAbilityLabel: (ability: AbilityCode) => string;
  showModifierTable: boolean;
  hideZeroGroups: boolean;
  sourceTypeLabels: Record<string, string>;
};

export function buildAbilitiesAllocatorPageData(
  args: Args,
): AbilityAllocatorData {
  return buildAbilitiesAllocatorData({
    t: args.t,
    title: args.title,
    abilityModes: args.abilityModes,
    selectedAbilityMode: args.selectedAbilityMode,
    selectedAbilityModeValue: args.selectedAbilityModeValue,
    modeUi: args.modeUi,
    abilityMethodHintOpen: args.abilityMethodHintOpen,
    modeSelectorHandlers: args.modeSelectorHandlers,
    pointBuyPanel: args.pointBuyPanel,
    rollSetsPanel: args.rollSetsPanel,
    abilityOrder: args.abilityOrder,
    abilityScores: args.abilityScores,
    abilityMinScore: args.abilityMinScore,
    abilityMaxScore: args.abilityMaxScore,
    rollSetNeedsSelection: args.rollSetNeedsSelection,
    onAbilityChange: args.onAbilityChange,
    onAbilityBlur: args.onAbilityBlur,
    onAbilityStep: args.onAbilityStep,
    reviewAbilities: args.reviewAbilities,
    provenanceByTargetPath: args.provenanceByTargetPath,
    sourceMetaByEntityKey: args.sourceMetaByEntityKey,
    localizeAbilityLabel: args.localizeAbilityLabel,
    showModifierTable: args.showModifierTable,
    hideZeroGroups: args.hideZeroGroups,
    sourceTypeLabels: args.sourceTypeLabels,
  });
}
