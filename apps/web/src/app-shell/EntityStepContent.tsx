import type { Dispatch, SetStateAction } from "react";
import { applyChoice, type CharacterState } from "@dcb/engine/legacy";
import { EntityChoiceStep } from "../components/EntityChoiceStep";
import { getSingleSelectedValue } from "../wizardStepHelpers";
import { STEP_ID_FEAT } from "./constants";
import type { WizardEngineContext } from "./types";

type EntityStepContentProps = {
  currentStep: { id: string; label: string; source?: { limit?: number; [key: string]: unknown } };
  choiceMap: Map<string, { options?: Array<{ id: string; label: string }>; limit?: number }>;
  selectedStepValues: (stepId: string) => string[];
  state: CharacterState;
  setState: Dispatch<SetStateAction<CharacterState>>;
  context: WizardEngineContext;
};

export function EntityStepContent({
  currentStep,
  choiceMap,
  selectedStepValues,
  state,
  setState,
  context,
}: EntityStepContentProps) {
  const stepChoice = choiceMap.get(currentStep.id);
  const options = stepChoice?.options ?? [];
  const limit = stepChoice?.limit ?? currentStep.source?.limit ?? 1;
  const selected =
    limit <= 1
      ? [
          getSingleSelectedValue({
            stepId: currentStep.id,
            selections: state.selections,
            featStepId: STEP_ID_FEAT,
          }),
        ].filter(Boolean)
      : selectedStepValues(currentStep.id);

  return (
    <EntityChoiceStep
      title={currentStep.label}
      options={options}
      limit={limit}
      selected={selected}
      onChange={(nextSelected) => {
        if (limit <= 1) {
          const nextValue = nextSelected[0] ?? "";
          if (currentStep.id === STEP_ID_FEAT) {
            setState((current) =>
              applyChoice(current, currentStep.id, nextValue ? [nextValue] : [], context),
            );
            return;
          }
          setState((current) =>
            applyChoice(current, currentStep.id, nextValue, context),
          );
          return;
        }

        setState((current) =>
          applyChoice(current, currentStep.id, nextSelected, context),
        );
      }}
    />
  );
}
