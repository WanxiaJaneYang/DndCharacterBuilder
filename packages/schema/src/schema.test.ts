import { describe, expect, it } from "vitest";
import { FlowSchema, ManifestSchema } from "./index";

describe("manifest schema", () => {
  it("validates minimal manifest", () => {
    const parsed = ManifestSchema.parse({
      id: "srd-35e-minimal",
      name: "SRD",
      version: "0.1.0",
      priority: 10,
      dependencies: []
    });
    expect(parsed.id).toBe("srd-35e-minimal");
  });
});

describe("flow schema", () => {
  it("rejects unknown step ids with a clear message", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "mystery", kind: "review", label: "Review", source: { type: "manual" } }
        ]
      })
    ).toThrow(/unknown step id: mystery/i);
  });

  it("rejects invalid kind for a known step id", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "review", kind: "metadata", label: "Review", source: { type: "manual" } }
        ]
      })
    ).toThrow(/invalid step kind/i);
  });

  it("requires entityType for entityType sources", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "race", kind: "race", label: "Race", source: { type: "entityType" } }
        ]
      })
    ).toThrow();
  });

  it("rejects manual source for entity-selection kinds", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "race", kind: "race", label: "Race", source: { type: "manual" } }
        ]
      })
    ).toThrow(/expected entityType source, got manual/i);
  });

  it("rejects entityType source for manual-only kinds", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          { id: "review", kind: "review", label: "Review", source: { type: "entityType", entityType: "items" } }
        ]
      })
    ).toThrow(/expected manual source, got entityType/i);
  });

  it("rejects entityType/limit fields on manual sources", () => {
    expect(() =>
      FlowSchema.parse({
        steps: [
          {
            id: "review",
            kind: "review",
            label: "Review",
            source: { type: "manual", entityType: "items", limit: 1 }
          }
        ]
      })
    ).toThrow();
  });
});
