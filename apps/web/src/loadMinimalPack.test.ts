import { describe, expect, it } from "vitest";
import { loadMinimalPack } from "./loadMinimalPack";

describe("loadMinimalPack", () => {
  it("includes pack-owned page schemas for migrated race, class, abilities, skills, metadata, and review steps", () => {
    const pack = loadMinimalPack();
    const pageSchemas = pack.pageSchemas;

    expect(pack.flow.steps.find((step) => step.id === "race")?.pageSchemaId).toBe(
      "character.race",
    );
    expect(pack.flow.steps.find((step) => step.id === "class")?.pageSchemaId).toBe(
      "character.class",
    );
    expect(
      pack.flow.steps.find((step) => step.id === "abilities")?.pageSchemaId,
    ).toBe("character.abilities");
    expect(pack.flow.steps.find((step) => step.id === "skills")?.pageSchemaId).toBe(
      "character.skills",
    );
    expect(pack.flow.steps.find((step) => step.id === "name")?.pageSchemaId).toBe(
      "character.name",
    );
    expect(pack.flow.steps.find((step) => step.id === "review")?.pageSchemaId).toBe(
      "character.review",
    );
    expect(pageSchemas?.["character.race"]?.root.componentId).toBe(
      "layout.singleColumn",
    );
    expect(
      pageSchemas?.["character.race"]?.root.children?.[0]
        ?.componentId,
    ).toBe("entityType.singleSelect");
    expect(
      pageSchemas?.["character.name"]?.root.children?.[0]
        ?.componentId,
    ).toBe("metadata.nameField");
    expect(
      pageSchemas?.["character.abilities"]?.root.children?.[0]
        ?.componentId,
    ).toBe("abilities.allocator");
    expect(
      pageSchemas?.["character.skills"]?.root.children?.[0]
        ?.componentId,
    ).toBe("skills.allocator");
    expect(
      pageSchemas?.["character.review"]?.root.children?.[0]
        ?.componentId,
    ).toBe("review.header");
    expect(
      pageSchemas?.["character.review"]?.root.children?.[1]
        ?.componentId,
    ).toBe("review.identity");
    expect(
      pageSchemas?.["character.review"]?.root.children?.at(-1)
        ?.componentId,
    ).toBe("review.provenance");
  });
});
