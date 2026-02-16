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

export const EffectSchema: z.ZodType<any> = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("add"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("set"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("multiply"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("min"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("max"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("derive"), targetPath: z.string(), value: ExprSchema }),
  z.object({ kind: z.literal("conditional"), condition: ExprSchema, then: z.array(z.lazy((): z.ZodType<any> => EffectSchema)), else: z.array(z.lazy((): z.ZodType<any> => EffectSchema)).optional() })
]);

export const ConstraintSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("requires"), expression: ExprSchema }),
  z.object({ kind: z.literal("levelMin"), level: z.number().int().min(1) }),
  z.object({ kind: z.literal("abilityMin"), ability: AbilityIdSchema, score: z.number().int() }),
  z.object({ kind: z.literal("mutuallyExclusive"), groupId: z.string() }),
  z.object({ kind: z.literal("predicate"), predicateId: z.string(), args: z.record(z.any()).optional() })
]);

const AllowedChoiceStepIds = ["name", "abilities", "race", "class", "feat", "equipment", "review"] as const;
const ChoiceStepIdSchema = z.enum(AllowedChoiceStepIds, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `Unknown step id: ${String(ctx.data)}` };
    }
    return { message: ctx.defaultError };
  }
});
const ChoiceStepKindSchema = z.enum(["metadata", "abilities", "race", "class", "feat", "equipment", "review"]);

const ChoiceStepSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("entityType"),
    entityType: z.string().min(1),
    limit: z.number().int().min(1).optional()
  }).strict(),
  z.object({
    type: z.literal("manual")
  }).strict()
]);

const ChoiceStepSchema = z.object({
  id: ChoiceStepIdSchema,
  kind: ChoiceStepKindSchema,
  label: z.string(),
  source: ChoiceStepSourceSchema
}).superRefine((step, ctx) => {
  const expectedKinds: Record<z.infer<typeof ChoiceStepIdSchema>, z.infer<typeof ChoiceStepKindSchema>> = {
    name: "metadata",
    abilities: "abilities",
    race: "race",
    class: "class",
    feat: "feat",
    equipment: "equipment",
    review: "review"
  };

  const expectedKind = expectedKinds[step.id];
  if (step.kind !== expectedKind) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid step kind for ${step.id}. Expected ${expectedKind}, got ${step.kind}.`
    });
  }


  const expectedSourceByKind: Record<
    z.infer<typeof ChoiceStepKindSchema>,
    z.infer<typeof ChoiceStepSourceSchema>["type"]
  > = {
    metadata: "manual",
    abilities: "manual",
    race: "entityType",
    class: "entityType",
    feat: "entityType",
    equipment: "entityType",
    review: "manual"
  };

  const expectedSourceType = expectedSourceByKind[step.kind];
  if (step.source.type !== expectedSourceType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid source for ${step.kind}. Expected ${expectedSourceType} source, got ${step.source.type}.`
    });
  }
});

export const FlowSchema = z.object({ steps: z.array(ChoiceStepSchema) });

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

export type ChoiceStepId = z.infer<typeof ChoiceStepIdSchema>;
export type ChoiceStepKind = z.infer<typeof ChoiceStepKindSchema>;
export type Expr = z.infer<typeof ExprSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Pack = z.infer<typeof PackSchema>;
export type ContractFixture = z.infer<typeof ContractFixtureSchema>;
