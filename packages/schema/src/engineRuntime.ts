import { z } from "zod";

const ID_SEGMENT_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
const NAMESPACED_ID_PATTERN = new RegExp(`^[a-z][a-z0-9-]*(?::${ID_SEGMENT_PATTERN})+$`);
const CAPABILITY_ID_PATTERN = /^cap:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INPUT_ID_PATTERN = /^input:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const FACT_ID_PATTERN = /^fact:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const SELECTION_SCHEMA_ID_PATTERN = /^sel:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const OPERATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RuntimeNamespacedIdSchema = z
  .string()
  .regex(NAMESPACED_ID_PATTERN, "Runtime IDs must use namespace:value segments.");

export const RuntimeCapabilityIdSchema = z
  .string()
  .regex(CAPABILITY_ID_PATTERN, "Capability IDs must use cap:kebab-case.");

export const RuntimeInputIdSchema = z
  .string()
  .regex(INPUT_ID_PATTERN, "Runtime input IDs must use input: namespace.");

export const RuntimeFactIdSchema = z
  .string()
  .regex(FACT_ID_PATTERN, "Runtime fact IDs must use fact: namespace.");

export const RuntimeSelectionSchemaIdSchema = z
  .string()
  .regex(SELECTION_SCHEMA_ID_PATTERN, "Runtime selection schema IDs must use sel: namespace.");

export const RuntimeOperationIdSchema = z
  .string()
  .regex(OPERATION_ID_PATTERN, "Runtime operation IDs must use kebab-case.");

export const RuntimeStateKeySchema = RuntimeNamespacedIdSchema;
export const RuntimeJsonSchemaSchema = z.union([z.boolean(), z.record(z.unknown())]);
export const RuntimePhaseIdSchema = RuntimeOperationIdSchema;

export const RuntimeSelectionSchema = z
  .object({
    kind: z.literal("selection"),
    schemaId: RuntimeSelectionSchemaIdSchema,
    refId: RuntimeNamespacedIdSchema,
    amount: z.number().int().positive()
  })
  .strict();

export const RuntimeInputSchema = z
  .object({
    kind: z.literal("input"),
    inputId: RuntimeInputIdSchema,
    value: z.unknown()
  })
  .strict();

export const AcquireIntentSchema = z
  .object({
    kind: z.literal("acquire"),
    capability: RuntimeCapabilityIdSchema,
    target: RuntimeNamespacedIdSchema,
    amount: z.number().int().positive()
  })
  .strict();

export const BundleStatementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("invoke"),
      capability: RuntimeCapabilityIdSchema,
      op: RuntimeOperationIdSchema,
      args: z.record(z.unknown()),
      when: z.lazy(() => ConditionExprSchema).optional()
    })
    .strict(),
  z
    .object({
      kind: z.literal("grant"),
      entity: RuntimeNamespacedIdSchema,
      when: z.lazy(() => ConditionExprSchema).optional()
    })
    .strict(),
  z
    .object({
      kind: z.literal("constraint"),
      capability: RuntimeCapabilityIdSchema,
      op: RuntimeOperationIdSchema,
      args: z.record(z.unknown()),
      requiresFacts: z.array(RuntimeFactIdSchema).optional(),
      requiresInputs: z.array(RuntimeInputIdSchema).optional(),
      requiresResources: z.array(RuntimeNamespacedIdSchema).optional(),
      requiresEntities: z.array(RuntimeNamespacedIdSchema).optional(),
      when: z.lazy(() => ConditionExprSchema).optional()
    })
    .strict()
]);

export const RuntimeRequestSchema = z
  .object({
    selections: z.array(RuntimeSelectionSchema),
    inputs: z.array(RuntimeInputSchema).optional(),
    acquireIntents: z.array(AcquireIntentSchema).optional()
  })
  .strict();

export type ConditionOperand =
  | {
      kind: "const";
      value: number;
    }
  | {
      kind: "selection-metric";
      schemaId: z.infer<typeof RuntimeSelectionSchemaIdSchema>;
      refId: z.infer<typeof RuntimeNamespacedIdSchema>;
      field: z.infer<typeof RuntimeOperationIdSchema>;
    }
  | {
      kind: "published-fact";
      factId: z.infer<typeof RuntimeFactIdSchema>;
    }
  | {
      kind: "resource-amount";
      resourceId: z.infer<typeof RuntimeNamespacedIdSchema>;
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
        factId: z.infer<typeof RuntimeFactIdSchema>;
      };
    }
  | {
      op: "resource-at-least";
      resource: {
        kind: "resource-amount";
        resourceId: z.infer<typeof RuntimeNamespacedIdSchema>;
      };
      amount: ConditionOperand;
    };

export const ConditionOperandSchema: z.ZodType<ConditionOperand> = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("const"),
      value: z.number()
    })
    .strict(),
  z
    .object({
      kind: z.literal("selection-metric"),
      schemaId: RuntimeSelectionSchemaIdSchema,
      refId: RuntimeNamespacedIdSchema,
      field: RuntimeOperationIdSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("published-fact"),
      factId: RuntimeFactIdSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("resource-amount"),
      resourceId: RuntimeNamespacedIdSchema
    })
    .strict()
]);

export const ConditionExprSchema: z.ZodType<ConditionExpr> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z
      .object({
        op: z.literal("all-of"),
        args: z.array(ConditionExprSchema).min(1)
      })
      .strict(),
    z
      .object({
        op: z.literal("any-of"),
        args: z.array(ConditionExprSchema).min(1)
      })
      .strict(),
    z
      .object({
        op: z.literal("not"),
        arg: ConditionExprSchema
      })
      .strict(),
    z
      .object({
        op: z.literal("numeric-gte"),
        left: ConditionOperandSchema,
        right: ConditionOperandSchema
      })
      .strict(),
    z
      .object({
        op: z.literal("has-fact"),
        fact: z.object({ kind: z.literal("published-fact"), factId: RuntimeFactIdSchema }).strict()
      })
      .strict(),
    z
      .object({
        op: z.literal("resource-at-least"),
        resource: z.object({ kind: z.literal("resource-amount"), resourceId: RuntimeNamespacedIdSchema }).strict(),
        amount: ConditionOperandSchema
      })
      .strict()
  ])
);

export const InvokeSpecSchema = z
  .object({
    kind: z.literal("invoke"),
    capability: RuntimeCapabilityIdSchema,
    op: RuntimeOperationIdSchema,
    version: z.string().min(1),
    argsSchema: RuntimeJsonSchemaSchema,
    phase: RuntimePhaseIdSchema,
    reads: z.array(RuntimeStateKeySchema),
    writes: z.array(RuntimeStateKeySchema),
    publishes: z.array(RuntimeFactIdSchema).optional(),
    idempotent: z.boolean(),
    mayActivateEntities: z.boolean().optional(),
    mayMutateResources: z.boolean().optional()
  })
  .strict();

export const ConstraintSpecSchema = z
  .object({
    kind: z.literal("constraint"),
    capability: RuntimeCapabilityIdSchema,
    op: RuntimeOperationIdSchema,
    version: z.string().min(1),
    argsSchema: RuntimeJsonSchemaSchema,
    reads: z.array(RuntimeStateKeySchema),
    requiresFacts: z.array(RuntimeFactIdSchema).optional(),
    requiresInputs: z.array(RuntimeInputIdSchema).optional(),
    requiresResources: z.array(RuntimeNamespacedIdSchema).optional(),
    requiresEntities: z.array(RuntimeNamespacedIdSchema).optional(),
    evaluationPhase: z.literal("constraints"),
    deferredWhenMissing: z.boolean()
  })
  .strict();

export type RuntimeNamespacedId = z.infer<typeof RuntimeNamespacedIdSchema>;
export type RuntimeCapabilityId = z.infer<typeof RuntimeCapabilityIdSchema>;
export type RuntimeInputId = z.infer<typeof RuntimeInputIdSchema>;
export type RuntimeFactId = z.infer<typeof RuntimeFactIdSchema>;
export type RuntimeSelectionSchemaId = z.infer<typeof RuntimeSelectionSchemaIdSchema>;
export type RuntimeOperationId = z.infer<typeof RuntimeOperationIdSchema>;
export type RuntimeStateKey = z.infer<typeof RuntimeStateKeySchema>;
export type RuntimeJsonSchema = z.infer<typeof RuntimeJsonSchemaSchema>;
export type RuntimePhaseId = z.infer<typeof RuntimePhaseIdSchema>;
export type RuntimeSelection = z.infer<typeof RuntimeSelectionSchema>;
export type RuntimeInput = z.infer<typeof RuntimeInputSchema>;
export type AcquireIntent = z.infer<typeof AcquireIntentSchema>;
export type BundleStatement = z.infer<typeof BundleStatementSchema>;
export type RuntimeRequest = z.infer<typeof RuntimeRequestSchema>;
export type InvokeSpec = z.infer<typeof InvokeSpecSchema>;
export type ConstraintSpec = z.infer<typeof ConstraintSpecSchema>;
