import type {
  RuntimeCapabilityId,
  RuntimeInputId,
  RuntimeNamespacedId,
  RuntimeSelectionSchemaId
} from "./engineRuntimePrimitiveTypes";

export enum RuntimeIntentKind {
  Selection = "selection",
  Input = "input",
  Acquire = "acquire"
}

export type RuntimeSelection = {
  kind: RuntimeIntentKind.Selection;
  schemaId: RuntimeSelectionSchemaId;
  refId: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeInput = {
  kind: RuntimeIntentKind.Input;
  inputId: RuntimeInputId;
  value: unknown;
};

export type AcquireIntent = {
  kind: RuntimeIntentKind.Acquire;
  capability: RuntimeCapabilityId;
  target: RuntimeNamespacedId;
  amount: number;
};

export type RuntimeIntent = RuntimeSelection | RuntimeInput | AcquireIntent;

export type RuntimeRequest = {
  intents: RuntimeIntent[];
};
