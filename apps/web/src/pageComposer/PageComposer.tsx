import type { Page, PageSchemaNode } from "@dcb/schema";
import type { ReactNode } from "react";
import { componentRegistry } from "./componentRegistry";
import { type SlotChildren } from "./baseBlocks";

export interface PageComposerProps {
  schema: Page;
  dataRoot: Record<string, unknown>;
}

function resolveDataSource(
  dataRoot: Record<string, unknown>,
  path: string | undefined,
): unknown {
  if (!path) {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
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
  return <div data-page-schema-id={schema.id}>{renderNode(schema.root, dataRoot)}</div>;
}
