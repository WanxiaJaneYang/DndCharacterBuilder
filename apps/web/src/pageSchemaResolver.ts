import { resolveLoadedPacks } from "@dcb/datapack";
import type { Page } from "@dcb/schema";

type FlowStep = ReturnType<typeof resolveLoadedPacks>["flow"]["steps"][number];

const FALLBACK_ABILITIES_PAGE_SCHEMA: Page = {
  id: "builtin.character.abilities",
  root: {
    id: "builtin-abilities-root",
    componentId: "layout.singleColumn",
    children: [
      {
        id: "builtin-abilities-allocator",
        componentId: "abilities.allocator",
        slot: "main",
        dataSource: "page.abilitiesAllocator",
      },
    ],
  },
};

const FALLBACK_SKILLS_PAGE_SCHEMA: Page = {
  id: "builtin.character.skills",
  root: {
    id: "builtin-skills-root",
    componentId: "layout.singleColumn",
    children: [
      {
        id: "builtin-skills-allocator",
        componentId: "skills.allocator",
        slot: "main",
        dataSource: "page.skillsAllocator",
      },
    ],
  },
};

export function resolvePageSchemaForStep(
  step: FlowStep,
  pageSchemas: Record<string, Page>,
): Page | undefined {
  if (step.pageSchemaId) return pageSchemas[step.pageSchemaId];
  if (step.kind === "abilities") return FALLBACK_ABILITIES_PAGE_SCHEMA;
  if (step.kind === "skills") return FALLBACK_SKILLS_PAGE_SCHEMA;
  return undefined;
}
