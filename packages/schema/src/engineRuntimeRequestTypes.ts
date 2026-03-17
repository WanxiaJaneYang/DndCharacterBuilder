import type {
  RuntimeCapabilityId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

export enum RuntimeChangeKind {
  Selection = "selection",
  Input = "input",
  Acquire = "acquire"
}

export type RuntimeSelection = {
  kind: RuntimeChangeKind.Selection;
  schemaId: RuntimeSelectionSchemaId;
  refId: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeInput = {
  kind: RuntimeChangeKind.Input;
  inputId: RuntimeInputId;
  value: unknown;
};

export type AcquireIntent = {
  kind: RuntimeChangeKind.Acquire;
  capability: RuntimeCapabilityId;
  target: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeChange = RuntimeSelection | RuntimeInput | AcquireIntent;

export type RuntimeRequest = {
  changes: RuntimeChange[];
};
