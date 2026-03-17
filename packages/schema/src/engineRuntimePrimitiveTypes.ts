export type RuntimeNamespacedId = string;
export type RuntimeCapabilityId = string;
export type RuntimeInputId = string;
export type RuntimeFactId = string;
export type RuntimeSelectionSchemaId = string;
export type RuntimeOperationId = string;
export type RuntimeMetricFieldId = string;
export type RuntimeInputStateKey = RuntimeInputId;
export type RuntimeFactStateKey = RuntimeFactId;
export type RuntimeEntityStateKey = `entity:${string}`;
export type RuntimeResourceStateKey = `resource:${string}`;
export type RuntimePrivateStateKey = `private:${string}`;
export type RuntimeConstraintStateKey = `constraint:${string}`;
export type RuntimeStateKey =
  | RuntimeInputStateKey
  | RuntimeFactStateKey
  | RuntimeEntityStateKey
  | RuntimeResourceStateKey
  | RuntimePrivateStateKey
  | RuntimeConstraintStateKey;
export type RuntimeJsonSchema = boolean | Record<string, unknown>;

export enum RuntimeInvokePhase {
  Activation = "activation",
  Invoke = "invoke",
  Acquire = "acquire"
}

export type RuntimePhaseId = RuntimeInvokePhase;
