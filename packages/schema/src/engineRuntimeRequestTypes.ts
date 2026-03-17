import type {
  RuntimeCapabilityId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

export enum RuntimeRequestItemKind {
  Selection = "selection",
  Input = "input",
  Acquire = "acquire"
}

export type RuntimeSelection = {
  kind: RuntimeRequestItemKind.Selection;
  schemaId: RuntimeSelectionSchemaId;
  refId: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeInput = {
  kind: RuntimeRequestItemKind.Input;
  inputId: RuntimeInputId;
  value: unknown;
};

export type AcquireIntent = {
  kind: RuntimeRequestItemKind.Acquire;
  capability: RuntimeCapabilityId;
  target: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeRequest = {
  selections: RuntimeSelection[];
  inputs?: RuntimeInput[];
  acquireIntents?: AcquireIntent[];
};
