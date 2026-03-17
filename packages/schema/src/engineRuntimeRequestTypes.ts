import type {
  RuntimeCapabilityId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

export type RuntimeSelection = {
  kind: "selection";
  schemaId: RuntimeSelectionSchemaId;
  refId: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeInput = {
  kind: "input";
  inputId: RuntimeInputId;
  value: unknown;
};

export type AcquireIntent = {
  kind: "acquire";
  capability: RuntimeCapabilityId;
  target: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeRequest = {
  selections: RuntimeSelection[];
  inputs?: RuntimeInput[];
  acquireIntents?: AcquireIntent[];
};
