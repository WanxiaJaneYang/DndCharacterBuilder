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
