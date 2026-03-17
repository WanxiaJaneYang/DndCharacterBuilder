import type {
  RuntimeCapabilityId,
  RuntimeFactId,
  RuntimeInputId,
  RuntimeJsonSchema,
  RuntimeNamespacedId,
  RuntimeOperationId,
  RuntimePhaseId,
  RuntimeStateKey
} from "./engineRuntimePrimitiveTypes";

export type InvokeSpec = {
  kind: "invoke";
  capability: RuntimeCapabilityId;
  op: RuntimeOperationId;
  version: string;
  argsSchema: RuntimeJsonSchema;
  phase: RuntimePhaseId;
  reads: RuntimeStateKey[];
  writes: RuntimeStateKey[];
  publishes?: RuntimeFactId[];
  idempotent: boolean;
  mayActivateEntities?: boolean;
  mayMutateResources?: boolean;
};

export type ConstraintSpec = {
  kind: "constraint";
  capability: RuntimeCapabilityId;
  op: RuntimeOperationId;
  version: string;
  argsSchema: RuntimeJsonSchema;
  reads: RuntimeStateKey[];
  requiresFacts?: RuntimeFactId[];
  requiresInputs?: RuntimeInputId[];
  requiresResources?: RuntimeNamespacedId[];
  requiresEntities?: RuntimeNamespacedId[];
  evaluationPhase: "constraints";
  deferredWhenMissing: boolean;
};
