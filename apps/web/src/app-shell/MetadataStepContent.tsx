import type { Dispatch, SetStateAction } from "react";
import { applyChoice, type CharacterState } from "@dcb/engine/legacy";
import type { UIText } from "../uiText";
import type { WizardEngineContext } from "./types";

type MetadataStepContentProps = {
  label: string;
  text: UIText;
  state: CharacterState;
  setState: Dispatch<SetStateAction<CharacterState>>;
  context: WizardEngineContext;
  stepId: string;
};

export function MetadataStepContent({
  label,
  text,
  state,
  setState,
  context,
  stepId,
}: MetadataStepContentProps) {
  return (
    <section>
      <h2>{label}</h2>
      <label htmlFor="character-name-input">{text.NAME_LABEL}</label>
      <input
        id="character-name-input"
        value={state.metadata.name ?? ""}
        onChange={(event) =>
          setState((current) =>
            applyChoice(current, stepId, event.target.value, context),
          )
        }
        placeholder={text.METADATA_PLACEHOLDER}
        aria-label={text.NAME_LABEL}
      />
    </section>
  );
}
