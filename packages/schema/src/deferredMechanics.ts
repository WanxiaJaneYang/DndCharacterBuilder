import { z } from "zod";

export const DEFERRED_MECHANIC_CAPABILITIES = [
  "cap:alignment-selection",
  "cap:alignment-validation",
  "cap:ammo-consumption",
  "cap:attack-roll-proficiency-validation",
  "cap:character-sheet-feat-benefits",
  "cap:class-rule-runtime",
  "cap:combat-attack-sequence",
  "cap:combat-context",
  "cap:combat-resolution",
  "cap:combat-state",
  "cap:combat-target-typing",
  "cap:companion-runtime",
  "cap:condition-runtime",
  "cap:conditional-armor-class-modifiers",
  "cap:conditional-attack-modifiers",
  "cap:conditional-save-modifiers",
  "cap:contextual-check-triggers",
  "cap:domain-selection",
  "cap:equipment-proficiency",
  "cap:equipment-rules",
  "cap:equipment-validation",
  "cap:feat-effect-runtime",
  "cap:feat-slot-progression",
  "cap:feature-selection",
  "cap:form-runtime",
  "cap:level-progression",
  "cap:proficiency-runtime",
  "cap:race-tagging",
  "cap:resource-tracking",
  "cap:situational-modifiers",
  "cap:spell-like-abilities",
  "cap:spell-school-tagging",
  "cap:spell-slot-progression",
  "cap:spellbook-management",
  "cap:spellcasting-runtime",
  "cap:type-aware-constraints",
  "cap:typed-combat-context",
  "cap:typed-condition-evaluation",
  "cap:uses-per-day-tracking"
] as const;

const DEFERRED_MECHANIC_CAPABILITY_SET = new Set<string>(DEFERRED_MECHANIC_CAPABILITIES);
const KEBAB_SEGMENT = "[a-z0-9]+(?:-[a-z0-9]+)*";
const DEFERRED_MECHANIC_CAPABILITY_ID_PATTERN = /^cap:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFERRED_MECHANIC_IMPACT_ID_PATTERN = new RegExp(`^${KEBAB_SEGMENT}(?::${KEBAB_SEGMENT})+$`);

export const DeferredMechanicCapabilityIdSchema = z.string()
  .regex(DEFERRED_MECHANIC_CAPABILITY_ID_PATTERN, "Deferred mechanic capabilities must use cap:kebab-case IDs.")
  .refine(
    (value) => DEFERRED_MECHANIC_CAPABILITY_SET.has(value),
    "Unknown deferred mechanic capability ID."
  );

export const DeferredMechanicImpactIdSchema = z.string()
  .regex(
    DEFERRED_MECHANIC_IMPACT_ID_PATTERN,
    "Deferred mechanic impacts must use colon-delimited kebab-case concept IDs."
  );

export const DeferredMechanicSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  dependsOn: z.array(DeferredMechanicCapabilityIdSchema).min(1),
  sourceRefs: z.array(z.string().min(1)).optional(),
  impacts: z.array(DeferredMechanicImpactIdSchema).min(1)
}).strict();

export type DeferredMechanic = z.infer<typeof DeferredMechanicSchema>;
