export type RuntimeNamespacedId = string;
export type RuntimeCapabilityId = string;
export type RuntimeInputId = string;
export type RuntimeFactId = string;
export type RuntimeSelectionSchemaId = string;
export type RuntimeOperationId = string;
export type RuntimeStateKey = RuntimeNamespacedId;
export type RuntimeJsonSchema = boolean | Record<string, unknown>;
export type RuntimePhaseId = RuntimeOperationId;

export type RuntimeSelection = {
  kind: "selection";
  schemaId: RuntimeSelectionSchemaId;
  refId: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeInput = {
  kind: "input";
  inputId: RuntimeInputId;
  value: unknown;
};

export type AcquireIntent = {
  kind: "acquire";
  capability: RuntimeCapabilityId;
  target: RuntimeNamespacedId;
  amount: number;
};

export type ConditionOperand =
  | {
      kind: "const";
      value: number;
    }
  | {
      kind: "selection-metric";
      schemaId: RuntimeSelectionSchemaId;
      refId: RuntimeNamespacedId;
      field: RuntimeOperationId;
    }
  | {
      kind: "published-fact";
      factId: RuntimeFactId;
    }
  | {
      kind: "resource-amount";
      resourceId: RuntimeNamespacedId;
    };

export type ConditionExpr =
  | {
      op: "all-of";
      args: ConditionExpr[];
    }
  | {
      op: "any-of";
      args: ConditionExpr[];
    }
  | {
      op: "not";
      arg: ConditionExpr;
    }
  | {
      op: "numeric-gte";
      left: ConditionOperand;
      right: ConditionOperand;
    }
  | {
      op: "has-fact";
      fact: {
        kind: "published-fact";
        factId: RuntimeFactId;
      };
    }
  | {
      op: "resource-at-least";
      resource: {
        kind: "resource-amount";
        resourceId: RuntimeNamespacedId;
      };
      amount: ConditionOperand;
    };

export type BundleStatement =
  | {
      kind: "invoke";
      capability: RuntimeCapabilityId;
      op: RuntimeOperationId;
      args: Record<string, unknown>;
      when?: ConditionExpr;
    }
  | {
      kind: "grant";
      entity: RuntimeNamespacedId;
      when?: ConditionExpr;
    }
  | {
      kind: "constraint";
      capability: RuntimeCapabilityId;
      op: RuntimeOperationId;
      args: Record<string, unknown>;
      requiresFacts?: RuntimeFactId[];
      requiresInputs?: RuntimeInputId[];
      requiresResources?: RuntimeNamespacedId[];
      requiresEntities?: RuntimeNamespacedId[];
      when?: ConditionExpr;
    };

export type RuntimeRequest = {
  selections: RuntimeSelection[];
  inputs?: RuntimeInput[];
  acquireIntents?: AcquireIntent[];
};

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
