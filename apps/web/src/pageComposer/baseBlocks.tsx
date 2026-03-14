import type { PageSchemaNode } from "@dcb/schema";
import type { ReactNode } from "react";
import type {
  EntityTypeSingleSelectData,
  MetadataNameFieldData,
} from "./pageDataBuilders";

export type SlotChildren = Record<string, ReactNode[]>;

export interface RegistryComponentProps {
  node: PageSchemaNode;
  data: unknown;
  slots: SlotChildren;
}

export function SingleColumnLayout({ node, slots }: RegistryComponentProps) {
  return (
    <section
      className="schema-layout schema-layout-single-column"
      data-node-id={node.id}
      data-page-composer-root={node.componentId}
    >
      {slots.header}
      <div className="schema-layout-main">{slots.main ?? slots.default}</div>
      {slots.footer}
    </section>
  );
}

export function EntityTypeSingleSelectBlock({ node, data }: RegistryComponentProps) {
  const selection = data as EntityTypeSingleSelectData | undefined;
  if (!selection) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  return (
    <section className="schema-entity-single-select" data-node-id={node.id}>
      <h2>{selection.title}</h2>
      {selection.options.map((option) => (
        <label key={option.id}>
          <input
            type="radio"
            name={selection.inputName}
            checked={selection.value === option.id}
            onChange={() => selection.onSelect(option.id)}
          />
          {option.label}
        </label>
      ))}
    </section>
  );
}

export function MetadataNameFieldBlock({ node, data }: RegistryComponentProps) {
  const field = data as MetadataNameFieldData | undefined;
  if (!field) {
    throw new Error(`Missing data for component ${node.componentId} at node ${node.id}`);
  }

  return (
    <section className="schema-metadata-name-field" data-node-id={node.id}>
      <h2>{field.title}</h2>
      <label htmlFor={field.inputId}>{field.label}</label>
      <input
        id={field.inputId}
        value={field.value}
        placeholder={field.placeholder}
        aria-label={field.label}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </section>
  );
}
