import type { RuntimeNamespacedId } from "./engineRuntimePrimitiveTypes";

export type RuntimeProjectionId = RuntimeNamespacedId;
export type RuntimeProjectionSchemaId = RuntimeNamespacedId;

export type RuntimeProjectionFragment = {
  projectionId: RuntimeProjectionId;
  schemaId: RuntimeProjectionSchemaId;
  data: Record<string, unknown>;
};

export type RuntimeProjectionResult = {
  projections: RuntimeProjectionFragment[];
};
