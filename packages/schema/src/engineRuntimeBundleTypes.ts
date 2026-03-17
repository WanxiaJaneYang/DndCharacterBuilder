import type { ConditionExpr } from "./engineRuntimeConditionTypes";
import type {
  RuntimeCapabilityId,
  RuntimeFactId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeOperationId
} from "./engineRuntimePrimitiveTypes";

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
