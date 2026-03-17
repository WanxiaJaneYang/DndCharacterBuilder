import type {
  RuntimeFactId,
  RuntimeMetricFieldId,
  RuntimeNamespacedId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

export enum ConditionOperandKind {
  Const = "const",
  SelectionMetric = "selection-metric",
  PublishedFact = "published-fact",
  ResourceAmount = "resource-amount"
}

export enum ConditionExprOp {
  AllOf = "all-of",
  AnyOf = "any-of",
  Not = "not",
  NumericGte = "numeric-gte",
  HasFact = "has-fact",
  ResourceAtLeast = "resource-at-least"
}

export type ConditionOperand =
  | {
      kind: ConditionOperandKind.Const;
      value: number;
    }
  | {
      kind: ConditionOperandKind.SelectionMetric;
      schemaId: RuntimeSelectionSchemaId;
      refId: RuntimeNamespacedId;
      field: RuntimeMetricFieldId;
    }
  | {
      kind: ConditionOperandKind.PublishedFact;
      factId: RuntimeFactId;
    }
  | {
      kind: ConditionOperandKind.ResourceAmount;
      resourceId: RuntimeNamespacedId;
    };

export type ConditionExpr =
  | {
      op: ConditionExprOp.AllOf;
      args: ConditionExpr[];
    }
  | {
      op: ConditionExprOp.AnyOf;
      args: ConditionExpr[];
    }
  | {
      op: ConditionExprOp.Not;
      arg: ConditionExpr;
    }
  | {
      op: ConditionExprOp.NumericGte;
      left: ConditionOperand;
      right: ConditionOperand;
    }
  | {
      op: ConditionExprOp.HasFact;
      fact: {
        kind: ConditionOperandKind.PublishedFact;
        factId: RuntimeFactId;
      };
    }
  | {
      op: ConditionExprOp.ResourceAtLeast;
      resource: {
        kind: ConditionOperandKind.ResourceAmount;
        resourceId: RuntimeNamespacedId;
      };
      amount: ConditionOperand;
    };
