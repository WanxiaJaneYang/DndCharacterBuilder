type StepSource = {
  type?: string;
  entityType?: string;
};

type StepLike = {
  id: string;
  label: string;
  source: StepSource;
};

type ChoiceLike = {
  stepId: string;
  label: string;
  options: Array<{ id: string; label: string }>;
};

type LocalizeChoicesInput<TChoice extends ChoiceLike, TStep extends StepLike> = {
  choices: TChoice[];
  wizardSteps: TStep[];
  flowStepLabels?: Record<string, string>;
  localizeEntityText: (
    entityType: string,
    entityId: string,
    path: string,
    fallback: string,
  ) => string;
};

type SelectionValuesInput = {
  stepId: string;
  selections: Record<string, unknown>;
  featStepId?: string;
};

function hasEntityType(step: StepLike | undefined): step is StepLike & {
  source: StepSource & { entityType: string };
} {
  return Boolean(step?.source && typeof step.source.entityType === "string");
}

export function localizeWizardSteps<TStep extends { id: string; label: string }>(
  steps: TStep[],
  flowStepLabels?: Record<string, string>,
): TStep[] {
  return steps.map((step) => ({
    ...step,
    label: flowStepLabels?.[step.id] ?? step.label,
  }));
}

export function localizeChoices<TChoice extends ChoiceLike, TStep extends StepLike>({
  choices,
  wizardSteps,
  flowStepLabels,
  localizeEntityText,
}: LocalizeChoicesInput<TChoice, TStep>): TChoice[] {
  return choices.map((choice) => {
    const flowStep = wizardSteps.find((step) => step.id === choice.stepId);
    if (!hasEntityType(flowStep)) {
      return {
        ...choice,
        label: flowStepLabels?.[choice.stepId] ?? choice.label,
      };
    }

    return {
      ...choice,
      label: flowStepLabels?.[choice.stepId] ?? choice.label,
      options: choice.options.map((option) => ({
        ...option,
        label: localizeEntityText(
          flowStep.source.entityType,
          option.id,
          "name",
          option.label,
        ),
      })),
    };
  });
}

export function getStepSelectionValues({
  stepId,
  selections,
  featStepId = "feat",
}: SelectionValuesInput): string[] {
  const rawValue =
    stepId === featStepId ? selections.feats ?? selections[stepId] : selections[stepId];
  if (stepId === featStepId && Array.isArray(rawValue)) {
    return rawValue.map(String);
  }
  if (Array.isArray(rawValue)) {
    return rawValue.map(String);
  }
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return [];
  }
  return [String(rawValue)];
}

export function getSingleSelectedValue(input: SelectionValuesInput): string {
  return getStepSelectionValues(input)[0] ?? "";
}
