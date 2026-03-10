import type { AbilityMode, AbilityModeSelectorHandlers } from "./pageComposer/pageDataBuilders";

type Args = {
  hasActiveModeHint: boolean;
  abilityMethodHintPinned: boolean;
  abilityMethodHintRef: AbilityModeSelectorHandlers["helpRef"];
  setAbilityMethodHintOpen: (value: boolean) => void;
  setAbilityMethodHintPinned: (value: boolean) => void;
  isAbilityMode: (value: string) => value is AbilityMode;
  onAbilityModeChange: (mode: AbilityMode) => void;
};

export function createAbilityModeSelectorHandlers(
  args: Args,
): AbilityModeSelectorHandlers {
  return {
    onMouseEnter: () => {
      if (!args.hasActiveModeHint) return;
      args.setAbilityMethodHintOpen(true);
    },
    onMouseLeave: () => {
      if (args.abilityMethodHintPinned) return;
      const activeElement = document.activeElement as Node | null;
      if (activeElement && args.abilityMethodHintRef.current?.contains(activeElement)) {
        return;
      }
      args.setAbilityMethodHintOpen(false);
    },
    onFocus: () => {
      if (!args.hasActiveModeHint) return;
      args.setAbilityMethodHintOpen(true);
    },
    onBlur: (event) => {
      if (args.abilityMethodHintPinned) return;
      const next = event.relatedTarget as Node | null;
      if (next && args.abilityMethodHintRef.current?.contains(next)) return;
      args.setAbilityMethodHintOpen(false);
    },
    onClick: () => {
      if (!args.hasActiveModeHint) return;
      if (args.abilityMethodHintPinned) {
        args.setAbilityMethodHintPinned(false);
        args.setAbilityMethodHintOpen(false);
        return;
      }
      args.setAbilityMethodHintPinned(true);
      args.setAbilityMethodHintOpen(true);
    },
    onKeyDown: (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      args.setAbilityMethodHintPinned(false);
      args.setAbilityMethodHintOpen(false);
    },
    onChange: (value) => {
      if (!args.isAbilityMode(value)) return;
      args.onAbilityModeChange(value);
    },
    helpRef: args.abilityMethodHintRef,
  };
}
