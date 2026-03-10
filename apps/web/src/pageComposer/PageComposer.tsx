import type { Page, PageSchemaNode } from "@dcb/schema";
import type { ReactNode } from "react";

type SlotChildren = Record<string, ReactNode[]>;

export interface EntityTypeSingleSelectData {
  title: string;
  inputName: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
}

export interface MetadataNameFieldData {
  title: string;
  label: string;
  inputId: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export interface PageComposerProps {
  schema: Page;
  dataRoot: Record<string, unknown>;
}

interface RegistryComponentProps {
  node: PageSchemaNode;
  data: unknown;
  slots: SlotChildren;
}

function resolveDataSource(
  dataRoot: Record<string, unknown>,
  path: string | undefined,
): unknown {
  if (!path) return undefined;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dataRoot);
}

function renderChildren(
  children: PageSchemaNode[] | undefined,
  dataRoot: Record<string, unknown>,
): SlotChildren {
  const slots: SlotChildren = {};

  for (const child of children ?? []) {
    const slot = child.slot ?? "default";
    slots[slot] ??= [];
    slots[slot].push(renderNode(child, dataRoot));
  }

  return slots;
}

function SingleColumnLayout({ node, slots }: RegistryComponentProps) {
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

function EntityTypeSingleSelectBlock({ node, data }: RegistryComponentProps) {
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

function MetadataNameFieldBlock({ node, data }: RegistryComponentProps) {
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

const componentRegistry: Record<string, (props: RegistryComponentProps) => ReactNode> = {
  "layout.singleColumn": SingleColumnLayout,
  "entityType.singleSelect": EntityTypeSingleSelectBlock,
  "metadata.nameField": MetadataNameFieldBlock,
};

function renderNode(node: PageSchemaNode, dataRoot: Record<string, unknown>): ReactNode {
  const Component = componentRegistry[node.componentId];
  if (!Component) {
    throw new Error(`No registered renderer for component ${node.componentId}`);
  }

  return (
    <Component
      key={node.id}
      node={node}
      data={resolveDataSource(dataRoot, node.dataSource)}
      slots={renderChildren(node.children, dataRoot)}
    />
  );
}

export function PageComposer({ schema, dataRoot }: PageComposerProps) {
  return (
    <div data-page-schema-id={schema.id}>
      {renderNode(schema.root, dataRoot)}
    </div>
  );
}
