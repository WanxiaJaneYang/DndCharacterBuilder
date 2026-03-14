import type { CharacterState } from "@dcb/engine/legacy";
import { getStepSelectionValues } from "../wizardStepHelpers";
import { STEP_ID_FEAT } from "./constants";

type StepLike = {
  id: string;
  source?: {
    type?: string;
    limit?: number;
  };
};

export function canMoveToNextStep(args: {
  stepIndex: number;
  wizardStepCount: number;
  currentStep?: StepLike;
  choiceLimit?: number;
  state: CharacterState;
}) {
  if (!args.currentStep) return false;
  if (args.stepIndex >= args.wizardStepCount - 1) return false;
  if (args.currentStep.source?.type !== "entityType") return true;

  const limit = args.choiceLimit ?? args.currentStep.source.limit ?? 1;
  if (args.currentStep.id === STEP_ID_FEAT || limit > 1) return true;

  const selected = getStepSelectionValues({
    stepId: args.currentStep.id,
    selections: args.state.selections,
    featStepId: STEP_ID_FEAT,
  });
  return Boolean(selected[0]?.trim());
}
