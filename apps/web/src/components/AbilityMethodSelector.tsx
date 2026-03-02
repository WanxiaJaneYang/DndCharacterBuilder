type AbilityMethodOption = {
  value: string;
  label: string;
};

type AbilityMethodSelectorProps = {
  label: string;
  helpLabel: string;
  helpText: string;
  isHintVisible: boolean;
  isHintAvailable: boolean;
  value: string;
  options: AbilityMethodOption[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLButtonElement>) => void;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onChange: (value: string) => void;
  helpRef: RefObject<HTMLDivElement>;
};

export function AbilityMethodSelector({
  label,
  helpLabel,
  helpText,
  isHintVisible,
  isHintAvailable,
  value,
  options,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  onKeyDown,
  onChange,
  helpRef
}: AbilityMethodSelectorProps) {
  return (
    <div className="ability-method-row">
      <div className="ability-method-inline">
        <label htmlFor="ability-generation-mode-select">{label}</label>
        <div
          ref={helpRef}
          className="ability-method-help"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <button
            type="button"
            className="ability-method-help-trigger"
            aria-label={helpLabel}
            aria-expanded={isHintVisible}
            aria-controls={isHintVisible ? 'ability-method-help-panel' : undefined}
            aria-describedby={isHintVisible ? 'ability-method-help-panel' : undefined}
            disabled={!isHintAvailable}
            onFocus={onFocus}
            onBlur={onBlur}
            onClick={onClick}
            onKeyDown={onKeyDown}
          >
            ?
          </button>
          {isHintVisible && (
            <div
              id="ability-method-help-panel"
              className="ability-method-help-panel"
              role="tooltip"
              aria-label={helpLabel}
            >
              {helpText}
            </div>
          )}
        </div>
      </div>
      <select
        id="ability-generation-mode-select"
        className="ability-method-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
import type { FocusEvent, KeyboardEvent, RefObject } from 'react';
