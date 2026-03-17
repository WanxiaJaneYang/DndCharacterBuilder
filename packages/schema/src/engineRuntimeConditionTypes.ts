import type {
  RuntimeFactId,
  RuntimeNamespacedId,
  RuntimeOperationId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

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
