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

const AllowedChoiceStepIds = ["name", "abilities", "race", "class", "feat", "skills", "equipment", "review"] as const;
const ChoiceStepIdSchema = z.enum(AllowedChoiceStepIds, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `Unknown step id: ${String(ctx.data)}` };
    }
    return { message: ctx.defaultError };
  }
});
const ChoiceStepKindSchema = z.enum(["metadata", "abilities", "race", "class", "feat", "skills", "equipment", "review"]);

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
    skills: "skills",
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
    skills: "manual",
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

const RacialModifierSchema = z.object({
  target: z.string(),
  bonus: z.number(),
  type: z.string().optional(),
  when: z.string().optional()
}).strict();

const SkillBonusSchema = z.object({
  skill: z.string(),
  bonus: z.number(),
  type: z.string().optional(),
  when: z.string().optional()
}).strict();

const RacialTraitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string()
}).strict();

const InnateSpellLikeAbilitySchema = z.object({
  spell: z.string(),
  frequency: z.string(),
  casterLevel: z.string().optional(),
  scope: z.string().optional()
}).strict();

const RaceDataSchema = z.object({
  size: z.enum(["small", "medium", "large"]),
  baseSpeed: z.number().int().positive(),
  abilityModifiers: z.record(AbilityIdSchema, z.number().int()),
  vision: z.object({
    lowLight: z.boolean(),
    darkvisionFeet: z.number().int().min(0)
  }).strict(),
  automaticLanguages: z.array(z.string()),
  bonusLanguages: z.array(z.string()),
  favoredClass: z.string(),
  racialTraits: z.array(RacialTraitSchema),
  skillBonuses: z.array(SkillBonusSchema).optional(),
  saveBonuses: z.array(RacialModifierSchema).optional(),
  attackBonuses: z.array(RacialModifierSchema).optional(),
  innateSpellLikeAbilities: z.array(InnateSpellLikeAbilitySchema).optional()
}).strict();

const ClassSaveProgressSchema = z.enum(["good", "poor"]);

const ClassLevelRowSchema = z.object({
  level: z.number().int().min(1),
  bab: z.number().int().min(0),
  fort: z.number().int().min(0),
  ref: z.number().int().min(0),
  will: z.number().int().min(0),
  features: z.array(z.string()).optional(),
  specialLabel: z.string().min(1).optional()
}).strict();

const ClassProgressionGrantSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("featureSlot"),
    slotType: z.string().min(1),
    count: z.number().int().min(1)
  }).strict(),
  z.object({
    kind: z.literal("enableChoiceStep"),
    stepId: z.string().min(1)
  }).strict(),
  z.object({
    kind: z.literal("grantFeature"),
    featureId: z.string().min(1),
    label: z.string().min(1).optional()
  }).strict(),
  z.object({
    kind: z.literal("unlockEntityType"),
    entityType: z.string().min(1)
  }).strict(),
  z.object({
    kind: z.literal("abilityIncrease"),
    points: z.number().int().min(1),
    abilities: z.array(AbilityIdSchema).min(1).optional()
  }).strict()
]);

const ClassLevelGainSchema = z.object({
  level: z.number().int().min(1),
  effects: z.array(EffectSchema).optional(),
  grants: z.array(ClassProgressionGrantSchema).optional(),
  notes: z.string().min(1).optional()
}).strict().superRefine((gain, ctx) => {
  if (!gain.effects?.length && !gain.grants?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Class level gain must define at least one effect or grant."
    });
  }
});

const ClassProgressionSchema = z.object({
  levelGains: z.array(ClassLevelGainSchema).min(1)
}).strict().superRefine((progression, ctx) => {
  const seenLevels = new Set<number>();
  for (let index = 0; index < progression.levelGains.length; index += 1) {
    const gain = progression.levelGains[index]!;
    if (seenLevels.has(gain.level)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate progression level gain for level ${gain.level}.`,
        path: ["levelGains", index, "level"]
      });
    } else {
      seenLevels.add(gain.level);
    }
    if (index > 0) {
      const previous = progression.levelGains[index - 1]!;
      if (gain.level <= previous.level) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "progression.levelGains must be strictly ordered by ascending level.",
          path: ["levelGains", index, "level"]
        });
      }
    }
  }
  if (!progression.levelGains.some((gain) => gain.level === 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "progression.levelGains must include a level 1 entry.",
      path: ["levelGains"]
    });
  }
});

const ClassDataSchema = z.object({
  skillPointsPerLevel: z.number().int().min(0),
  classSkills: z.array(z.string()),
  hitDie: z.number().int().positive(),
  baseAttackProgression: z.enum(["full", "threeQuarters", "half"]),
  baseSaveProgression: z.object({
    fort: ClassSaveProgressSchema,
    ref: ClassSaveProgressSchema,
    will: ClassSaveProgressSchema
  }).strict(),
  levelTable: z.array(ClassLevelRowSchema).min(1).optional(),
  progression: ClassProgressionSchema.optional()
}).strict().superRefine((classData, ctx) => {
  if (!classData.levelTable?.length && !classData.progression?.levelGains.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Class data must define at least one of levelTable or progression.levelGains."
    });
    return;
  }

  if (!classData.levelTable?.length) return;
  const levelValues = classData.levelTable.map((row) => row.level);
  const seenLevels = new Set<number>();
  levelValues.forEach((level, index) => {
    if (seenLevels.has(level)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate levelTable entry for level ${level}.`,
        path: ["levelTable", index, "level"]
      });
      return;
    }
    seenLevels.add(level);
  });

  for (let index = 1; index < levelValues.length; index += 1) {
    const previous = levelValues[index - 1];
    const current = levelValues[index];
    if (previous !== undefined && current !== undefined && current <= previous) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "levelTable must be strictly ordered by ascending level.",
        path: ["levelTable", index, "level"]
      });
    }
  }

  const levelOneIndex = classData.levelTable.findIndex((row) => row.level === 1);
  if (levelOneIndex < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "levelTable must include a level 1 row.",
      path: ["levelTable"]
    });
    return;
  }
  if (levelOneIndex !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "levelTable level 1 row must be the first entry.",
      path: ["levelTable", levelOneIndex, "level"]
    });
    return;
  }
  const firstLevel = classData.levelTable[levelOneIndex];
  if (!firstLevel) return;

  const expectedBabByProgression = {
    full: 1,
    threeQuarters: 0,
    half: 0
  } as const;
  const expectedBab = expectedBabByProgression[classData.baseAttackProgression];
  if (firstLevel.bab !== expectedBab) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Level 1 BAB (${firstLevel.bab}) does not match baseAttackProgression "${classData.baseAttackProgression}" (expected ${expectedBab}).`,
      path: ["levelTable", levelOneIndex, "bab"]
    });
  }

  const expectedSaveForProgression = (progression: z.infer<typeof ClassSaveProgressSchema>): number =>
    progression === "good" ? 2 : 0;

  (["fort", "ref", "will"] as const).forEach((saveKey) => {
    const progression = classData.baseSaveProgression[saveKey];
    const expectedSave = expectedSaveForProgression(progression);
    const actualSave = firstLevel[saveKey];
    if (actualSave !== expectedSave) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Level 1 ${saveKey} save (${actualSave}) does not match ${saveKey} baseSaveProgression "${progression}" (expected ${expectedSave}).`,
        path: ["levelTable", levelOneIndex, saveKey]
      });
    }
  });
});

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  entityType: z.string(),
  summary: z.string().min(1),
  description: z.string().min(1),
  portraitUrl: z.string().min(1).nullable().optional(),
  iconUrl: z.string().min(1).nullable().optional(),
  constraints: z.array(ConstraintSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  data: z.record(z.any()).optional()
}).superRefine((entity, ctx) => {
  if (entity.entityType === "races") {
    const result = RaceDataSchema.safeParse(entity.data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid races.data: ${issue.message}`,
          path: ["data", ...issue.path]
        });
      });
    }
  }

  if (entity.entityType === "classes") {
    const result = ClassDataSchema.safeParse(entity.data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid classes.data: ${issue.message}`,
          path: ["data", ...issue.path]
        });
      });
    }
  }
});

export const PackSchema = z.object({
  manifest: ManifestSchema,
  entities: z.record(z.array(EntitySchema)),
  flow: FlowSchema,
  patches: z.array(z.any()).default([])
});

export const PackLocaleSchema = z.object({
  flowStepLabels: z.record(z.string()).optional(),
  entityNames: z.record(z.record(z.string())).optional(),
  entityText: z.record(z.record(z.record(z.string()))).optional()
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

export const OfficialSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url()
});

export const AuthenticityArtifactSchema = z.object({
  path: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/)
});

export const AuthenticityLockSchema = z.object({
  packId: z.string().min(1),
  officialRuleset: z.boolean(),
  generatedAt: z.string().datetime(),
  generatedBy: z.string().min(1),
  sourceAuthorities: z.array(OfficialSourceSchema).min(1),
  artifacts: z.array(AuthenticityArtifactSchema).min(1)
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
export type PackLocale = z.infer<typeof PackLocaleSchema>;
export type ContractFixture = z.infer<typeof ContractFixtureSchema>;
export type AuthenticityLock = z.infer<typeof AuthenticityLockSchema>;
