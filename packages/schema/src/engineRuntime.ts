import { z } from "zod";
import {
  BundleStatementKind,
  ConditionExprOp,
  ConditionOperandKind,
  ConstraintEvaluationPhase,
  RegistryInstructionKind,
  RuntimeInvokePhase,
  RuntimeChangeKind
} from "./engineRuntimeTypes";
import type {
  AcquireIntent,
  BundleStatement,
  ConditionExpr,
  ConditionOperand,
  ConstraintSpec,
  InvokeSpec,
  RuntimeChange,
  RuntimeRequest,
  RuntimeSelection
} from "./engineRuntimeTypes";

const ID_SEGMENT_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
const NAMESPACED_ID_PATTERN = new RegExp(`^[a-z][a-z0-9-]*(?::${ID_SEGMENT_PATTERN})+$`);
const CAPABILITY_ID_PATTERN = /^cap:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INPUT_ID_PATTERN = /^input:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const FACT_ID_PATTERN = /^fact:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const SELECTION_SCHEMA_ID_PATTERN = /^sel:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const OPERATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ENTITY_STATE_KEY_PATTERN = /^entity:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const RESOURCE_STATE_KEY_PATTERN = /^resource:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const PRIVATE_STATE_KEY_PATTERN = /^private:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
const CONSTRAINT_STATE_KEY_PATTERN = /^constraint:[a-z0-9]+(?:[-:][a-z0-9]+)*$/;

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

export const RuntimeMetricFieldIdSchema = z
  .string()
  .regex(OPERATION_ID_PATTERN, "Runtime metric field IDs must use kebab-case.");

export const RuntimeEntityStateKeySchema = z
  .string()
  .regex(ENTITY_STATE_KEY_PATTERN, "Entity state keys must use entity: namespace.");

export const RuntimeResourceStateKeySchema = z
  .string()
  .regex(RESOURCE_STATE_KEY_PATTERN, "Resource state keys must use resource: namespace.");

export const RuntimePrivateStateKeySchema = z
  .string()
  .regex(PRIVATE_STATE_KEY_PATTERN, "Private state keys must use private: namespace.");

export const RuntimeConstraintStateKeySchema = z
  .string()
  .regex(CONSTRAINT_STATE_KEY_PATTERN, "Constraint state keys must use constraint: namespace.");

export const RuntimeStateKeySchema = z.union([
  RuntimeInputIdSchema,
  RuntimeFactIdSchema,
  RuntimeEntityStateKeySchema,
  RuntimeResourceStateKeySchema,
  RuntimePrivateStateKeySchema,
  RuntimeConstraintStateKeySchema
]);
export const RuntimeJsonSchemaSchema = z.union([z.boolean(), z.record(z.unknown())]);
export const RuntimePhaseIdSchema = z.nativeEnum(RuntimeInvokePhase);

export const RuntimeSelectionSchema = z
  .object({
    kind: z.literal(RuntimeChangeKind.Selection),
    schemaId: RuntimeSelectionSchemaIdSchema,
    refId: RuntimeNamespacedIdSchema,
    amount: z.number().int().positive()
  })
  .strict();

export const RuntimeInputSchema = z
  .object({
    kind: z.literal(RuntimeChangeKind.Input),
    inputId: RuntimeInputIdSchema,
    value: z.unknown()
  })
  .strict();

export const AcquireIntentSchema = z
  .object({
    kind: z.literal(RuntimeChangeKind.Acquire),
    capability: RuntimeCapabilityIdSchema,
    target: RuntimeNamespacedIdSchema,
    amount: z.number().int().positive()
  })
  .strict();

export const RuntimeChangeSchema = z.discriminatedUnion("kind", [
  RuntimeSelectionSchema,
  RuntimeInputSchema,
  AcquireIntentSchema
]);

export const BundleStatementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal(BundleStatementKind.Invoke),
      capability: RuntimeCapabilityIdSchema,
      op: RuntimeOperationIdSchema,
      args: z.record(z.unknown()),
      when: z.lazy(() => ConditionExprSchema).optional()
    })
    .strict(),
  z
    .object({
      kind: z.literal(BundleStatementKind.Grant),
      entity: RuntimeNamespacedIdSchema,
      when: z.lazy(() => ConditionExprSchema).optional()
    })
    .strict(),
  z
    .object({
      kind: z.literal(BundleStatementKind.Constraint),
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
    changes: z.array(RuntimeChangeSchema)
  })
  .strict();

export const ConditionOperandSchema: z.ZodType<ConditionOperand> = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal(ConditionOperandKind.Const),
      value: z.number()
    })
    .strict(),
  z
    .object({
      kind: z.literal(ConditionOperandKind.SelectionMetric),
      schemaId: RuntimeSelectionSchemaIdSchema,
      refId: RuntimeNamespacedIdSchema,
      field: RuntimeMetricFieldIdSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal(ConditionOperandKind.PublishedFact),
      factId: RuntimeFactIdSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal(ConditionOperandKind.ResourceAmount),
      resourceId: RuntimeNamespacedIdSchema
    })
    .strict()
]);

export const ConditionExprSchema: z.ZodType<ConditionExpr> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z
      .object({
        op: z.literal(ConditionExprOp.AllOf),
        args: z.array(ConditionExprSchema).min(1)
      })
      .strict(),
    z
      .object({
        op: z.literal(ConditionExprOp.AnyOf),
        args: z.array(ConditionExprSchema).min(1)
      })
      .strict(),
    z
      .object({
        op: z.literal(ConditionExprOp.Not),
        arg: ConditionExprSchema
      })
      .strict(),
    z
      .object({
        op: z.literal(ConditionExprOp.NumericGte),
        left: ConditionOperandSchema,
        right: ConditionOperandSchema
      })
      .strict(),
    z
      .object({
        op: z.literal(ConditionExprOp.HasFact),
        fact: z.object({ kind: z.literal(ConditionOperandKind.PublishedFact), factId: RuntimeFactIdSchema }).strict()
      })
      .strict(),
    z
      .object({
        op: z.literal(ConditionExprOp.ResourceAtLeast),
        resource: z.object({ kind: z.literal(ConditionOperandKind.ResourceAmount), resourceId: RuntimeNamespacedIdSchema }).strict(),
        amount: ConditionOperandSchema
      })
      .strict()
  ])
);

export const InvokeSpecSchema = z
  .object({
    kind: z.literal(RegistryInstructionKind.Invoke),
    capability: RuntimeCapabilityIdSchema,
    op: RuntimeOperationIdSchema,
    version: z.string().min(1),
    argsSchema: RuntimeJsonSchemaSchema,
    phase: RuntimePhaseIdSchema,
    consumes: z.array(RuntimeStateKeySchema),
    produces: z.array(RuntimeStateKeySchema),
    publishes: z.array(RuntimeFactIdSchema).optional(),
    idempotent: z.boolean(),
    mayActivateEntities: z.boolean().optional(),
    mayMutateResources: z.boolean().optional()
  })
  .strict();

export const ConstraintSpecSchema = z
  .object({
    kind: z.literal(RegistryInstructionKind.Constraint),
    capability: RuntimeCapabilityIdSchema,
    op: RuntimeOperationIdSchema,
    version: z.string().min(1),
    argsSchema: RuntimeJsonSchemaSchema,
    watches: z.array(RuntimeStateKeySchema),
    requiresFacts: z.array(RuntimeFactIdSchema).optional(),
    requiresInputs: z.array(RuntimeInputIdSchema).optional(),
    requiresResources: z.array(RuntimeNamespacedIdSchema).optional(),
    requiresEntities: z.array(RuntimeNamespacedIdSchema).optional(),
    evaluationPhase: z.literal(ConstraintEvaluationPhase.Constraints),
    deferredWhenMissing: z.boolean()
  })
  .strict();
