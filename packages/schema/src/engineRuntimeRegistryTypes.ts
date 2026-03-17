import type {
  RuntimeCapabilityId,
  RuntimeFactId,
  RuntimeInputId,
  RuntimeJsonSchema,
  RuntimeNamespacedId,
  RuntimeOperationId,
  RuntimeInvokePhase,
  RuntimeStateKey
} from "./engineRuntimePrimitiveTypes";

export enum RegistryInstructionKind {
  Invoke = "invoke",
  Constraint = "constraint"
}

export enum ConstraintEvaluationPhase {
  Constraints = "constraints"
}

export type InvokeSpec = {
  kind: RegistryInstructionKind.Invoke;
  capability: RuntimeCapabilityId;
  op: RuntimeOperationId;
  version: string;
  argsSchema: RuntimeJsonSchema;
  phase: RuntimeInvokePhase;
  consumes: RuntimeStateKey[];
  emits: RuntimeStateKey[];
  publishes?: RuntimeFactId[];
  idempotent: boolean;
  mayActivateEntities?: boolean;
  mayMutateResources?: boolean;
};

export type ConstraintSpec = {
  kind: RegistryInstructionKind.Constraint;
  capability: RuntimeCapabilityId;
  op: RuntimeOperationId;
  version: string;
  argsSchema: RuntimeJsonSchema;
  watches: RuntimeStateKey[];
  requiresFacts?: RuntimeFactId[];
  requiresInputs?: RuntimeInputId[];
  requiresResources?: RuntimeNamespacedId[];
  requiresEntities?: RuntimeNamespacedId[];
  evaluationPhase: ConstraintEvaluationPhase.Constraints;
  deferredWhenMissing: boolean;
};
