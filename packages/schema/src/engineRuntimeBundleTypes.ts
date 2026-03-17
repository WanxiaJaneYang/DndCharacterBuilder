import type { ConditionExpr } from "./engineRuntimeConditionTypes";
import type {
  RuntimeCapabilityId,
  RuntimeFactId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeOperationId
} from "./engineRuntimePrimitiveTypes";

export enum BundleStatementKind {
  Invoke = "invoke",
  Grant = "grant",
  Constraint = "constraint"
}

export type BundleStatement =
  | {
      kind: BundleStatementKind.Invoke;
      capability: RuntimeCapabilityId;
      op: RuntimeOperationId;
      args: Record<string, unknown>;
      when?: ConditionExpr;
    }
  | {
      kind: BundleStatementKind.Grant;
      entity: RuntimeNamespacedId;
      when?: ConditionExpr;
    }
  | {
      kind: BundleStatementKind.Constraint;
      capability: RuntimeCapabilityId;
      op: RuntimeOperationId;
      args: Record<string, unknown>;
      requiresFacts?: RuntimeFactId[];
      requiresInputs?: RuntimeInputId[];
      requiresResources?: RuntimeNamespacedId[];
      requiresEntities?: RuntimeNamespacedId[];
      when?: ConditionExpr;
    };
