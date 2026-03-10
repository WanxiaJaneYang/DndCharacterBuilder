import { describe, expect, it } from "vitest";
import { FlowSchema, PageSchema } from "./index";

describe("page schema", () => {
  it("accepts a recursive page schema with slot-based child placement", () => {
    const parsed = PageSchema.parse({
      id: "character.metadata",
      root: {
        id: "metadata-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "metadata-name-field",
            componentId: "metadata.nameField",
            slot: "main",
            dataSource: "page.metadata.nameField"
          }
        ]
      }
    });

    expect(parsed.root.componentId).toBe("layout.singleColumn");
    expect(parsed.root.children?.[0]?.slot).toBe("main");
  });

  it("accepts entityType single-select blocks in the closed component registry", () => {
    const parsed = PageSchema.parse({
      id: "character.race",
      root: {
        id: "race-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "race-picker",
            componentId: "entityType.singleSelect",
            slot: "main",
            dataSource: "page.entityType.singleSelect"
          }
        ]
      }
    });

    expect(parsed.root.children?.[0]?.componentId).toBe("entityType.singleSelect");
  });

  it("accepts review sheet blocks in the closed component registry", () => {
    const parsed = PageSchema.parse({
      id: "character.review",
      root: {
        id: "review-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "review-sheet",
            componentId: "review.sheet",
            slot: "main",
            dataSource: "page.reviewSheet"
          }
        ]
      }
    });

    expect(parsed.root.children?.[0]?.componentId).toBe("review.sheet");
  });

  it("accepts abilities and skills allocator blocks in the closed component registry", () => {
    const abilities = PageSchema.parse({
      id: "character.abilities",
      root: {
        id: "abilities-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "abilities-allocator",
            componentId: "abilities.allocator",
            slot: "main",
            dataSource: "page.abilitiesAllocator"
          }
        ]
      }
    });
    const skills = PageSchema.parse({
      id: "character.skills",
      root: {
        id: "skills-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "skills-allocator",
            componentId: "skills.allocator",
            slot: "main",
            dataSource: "page.skillsAllocator"
          }
        ]
      }
    });

    expect(abilities.root.children?.[0]?.componentId).toBe("abilities.allocator");
    expect(skills.root.children?.[0]?.componentId).toBe("skills.allocator");
  });

  it("rejects unknown component ids", () => {
    expect(() =>
      PageSchema.parse({
        id: "character.metadata",
        root: {
          id: "metadata-root",
          componentId: "layout.unknown"
        }
      })
    ).toThrow(/unknown component/i);
  });
});

describe("flow schema pageSchemaId support", () => {
  it("retains pageSchemaId on steps", () => {
    const parsed = FlowSchema.parse({
      steps: [
        {
          id: "name",
          kind: "metadata",
          label: "Identity",
          source: { type: "manual" },
          pageSchemaId: "character.metadata"
        }
      ]
    });

    expect(parsed.steps[0]?.pageSchemaId).toBe("character.metadata");
  });
});
