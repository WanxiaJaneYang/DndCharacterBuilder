import { z } from "zod";

export const AbilityIdSchema = z.enum(["str", "dex", "con", "int", "wis", "cha"]);
export type AbilityId = z.infer<typeof AbilityIdSchema>;

export const SourceSchema = z.object({
  packId: z.string(),
  entityId: z.string(),
  choiceStepId: z.string().optional()
});

export const ExprSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.object({ const: z.number() }),
    z.object({ path: z.string() }),
    z.object({ abilityMod: AbilityIdSchema }),
    z.object({ sum: z.array(ExprSchema) }),
    z.object({ multiply: z.tuple([ExprSchema, ExprSchema]) }),
    z.object({
      if: ExprSchema,
      then: ExprSchema,
      else: ExprSchema
    }),
    z.object({
      op: z.enum(["eq", "neq", "gte", "lte", "gt", "lt", "and", "or"]),
      left: ExprSchema,
      right: ExprSchema
    })
  ])
);

export const EffectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("add"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("set"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("multiply"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("min"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("max"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("derive"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("conditional"), condition: ExprSchema, then: z.array(z.lazy(() => EffectSchema)), else: z.array(z.lazy(() => EffectSchema)).optional() })
]);

export const ConstraintSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("requires"), expression: ExprSchema }),
  z.object({ kind: z.literal("levelMin"), level: z.number().int().min(1) }),
  z.object({ kind: z.literal("abilityMin"), ability: AbilityIdSchema, score: z.number().int() }),
  z.object({ kind: z.literal("mutuallyExclusive"), groupId: z.string() }),
  z.object({ kind: z.literal("predicate"), predicateId: z.string(), args: z.record(z.any()).optional() })
]);

const ChoiceStepSchema = z.object({
  id: z.string(),
  kind: z.enum(["metadata", "abilities", "race", "class", "feat", "equipment"]),
  label: z.string(),
  source: z.object({ type: z.enum(["entityType", "manual"]), entityType: z.string().optional(), limit: z.number().int().optional() })
});

export const ManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  priority: z.number(),
  dependencies: z.array(z.string()),
  compatibleEngineRange: z.string().optional()
});

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  entityType: z.string(),
  constraints: z.array(ConstraintSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  data: z.record(z.any()).optional()
});

export const FlowSchema = z.object({ steps: z.array(ChoiceStepSchema) });

export const PackSchema = z.object({
  manifest: ManifestSchema,
  entities: z.record(z.array(EntitySchema)),
  flow: FlowSchema,
  patches: z.array(z.any()).default([])
});

export const ContractFixtureSchema = z.object({
  enabledPacks: z.array(z.string()),
  initialState: z.record(z.any()),
  actions: z.array(z.object({ choiceId: z.string(), selection: z.any() })),
  expected: z.object({
    availableChoicesContains: z.array(z.string()).optional(),
    validationErrorCodes: z.array(z.string()).optional(),
    finalSheetSubset: z.record(z.any()).optional()
  })
});

export type Expr = z.infer<typeof ExprSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Pack = z.infer<typeof PackSchema>;
export type ContractFixture = z.infer<typeof ContractFixtureSchema>;
