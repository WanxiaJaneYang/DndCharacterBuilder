import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Page } from "@dcb/schema";
import { PageComposer } from "./PageComposer";

describe("PageComposer", () => {
  it("renders a slot-based single-select page from schema data", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const schema: Page = {
      id: "character.race.singleSelect",
      root: {
        id: "race-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "race-picker",
            componentId: "entityType.singleSelect",
            slot: "main",
            dataSource: "page.entityChoice"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            entityChoice: {
              title: "Race",
              inputName: "race",
              value: "human",
              options: [
                { id: "human", label: "Human" },
                { id: "elf", label: "Elf" }
              ],
              onSelect
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Race" })).toBeTruthy();
    expect((screen.getByLabelText("Human") as HTMLInputElement).checked).toBe(
      true,
    );

    await user.click(screen.getByLabelText("Elf"));

    expect(onSelect).toHaveBeenCalledWith("elf");
  });

  it("renders a metadata text input block from schema data", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const schema: Page = {
      id: "character.name",
      root: {
        id: "metadata-root",
        componentId: "layout.singleColumn",
        children: [
          {
            id: "metadata-name-field",
            componentId: "metadata.nameField",
            slot: "main",
            dataSource: "page.metadataName"
          }
        ]
      }
    };

    render(
      <PageComposer
        schema={schema}
        dataRoot={{
          page: {
            metadataName: {
              title: "Name",
              label: "Name",
              inputId: "character-name-input",
              value: "Aric",
              placeholder: "Enter character name",
              onChange
            }
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Name" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();

    await user.type(screen.getByLabelText("Name"), "a");

    expect(onChange).toHaveBeenCalledWith("Arica");
  });
});
