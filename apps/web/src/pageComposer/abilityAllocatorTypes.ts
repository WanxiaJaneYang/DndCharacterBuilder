import type { FocusEvent, KeyboardEvent, MutableRefObject } from "react";
import type { UIText } from "../uiText";

export type AbilityMode = "pointBuy" | "phb" | "rollSets";

export interface AbilityAllocatorData {
  t: UIText;
  title: string;
  modeSelector: {
    label: string;
    helpLabel: string;
    helpText: string;
    isHintVisible: boolean;
    isHintAvailable: boolean;
    value: string;
    options: Array<{ value: string; label: string }>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent<HTMLButtonElement>) => void;
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
    onChange: (value: string) => void;
    helpRef: MutableRefObject<HTMLDivElement | null>;
  };
  pointBuyPanel?: {
    pointCap: number;
    pointCapMin: number;
    pointCapMax: number;
    pointCapStep: number;
    pointBuyRemaining: number;
    isTableOpen: boolean;
    costTable: Record<string, number>;
    onPointCapChange: (value: number) => void;
    onToggleTable: () => void;
  };
  rollSetsPanel?: {
    title: string;
    description: string;
    rerollLabel: string;
    ariaLabel: string;
    options: Array<{
      id: string;
      label: string;
      scores: string;
      checked: boolean;
      onSelect: () => void;
    }>;
    onReroll: () => void;
  };
  abilityRows: Array<{
    id: string;
    label: string;
    value: number;
    disabled: boolean;
    min: number;
    max: number;
    canDecrease: boolean;
    canIncrease: boolean;
    onChange: (value: number) => void;
    onBlur: () => void;
    onDecrease: () => void;
    onIncrease: () => void;
  }>;
  modifierRows: Array<{
    id: string;
    label: string;
    base: number;
    adjustment: string;
    groups: Array<{
      id: string;
      label: string;
      total: string;
      items: Array<{ id: string; delta: string; sourceLabel: string }>;
    }>;
    final: number;
    mod: string;
  }>;
  showModifierTable: boolean;
}

export type AbilityModeSelectorHandlers = Pick<
  AbilityAllocatorData["modeSelector"],
  | "onMouseEnter"
  | "onMouseLeave"
  | "onFocus"
  | "onBlur"
  | "onClick"
  | "onKeyDown"
  | "onChange"
  | "helpRef"
>;
