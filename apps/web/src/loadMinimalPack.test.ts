import { describe, expect, it } from "vitest";
import { loadMinimalPack } from "./loadMinimalPack";

describe("loadMinimalPack", () => {
  it("includes pack-owned page schemas for migrated race, class, and metadata steps", () => {
    const pack = loadMinimalPack();
    const pageSchemas = pack.pageSchemas;

    expect(pack.flow.steps.find((step) => step.id === "race")?.pageSchemaId).toBe(
      "character.race",
    );
    expect(pack.flow.steps.find((step) => step.id === "class")?.pageSchemaId).toBe(
      "character.class",
    );
    expect(pack.flow.steps.find((step) => step.id === "name")?.pageSchemaId).toBe(
      "character.name",
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
  });
});
