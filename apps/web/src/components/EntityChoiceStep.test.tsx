import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EntityChoiceStep } from "./EntityChoiceStep";

describe("EntityChoiceStep", () => {
  it("renders a radio shell for single-select steps", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <EntityChoiceStep
        title="Race"
        limit={1}
        options={[
          { id: "human", label: "Human" },
          { id: "elf", label: "Elf" },
        ]}
        selected={["human"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("Elf"));

    expect(onChange).toHaveBeenCalledWith(["elf"]);
    rerender(
      <EntityChoiceStep
        title="Race"
        limit={1}
        options={[
          { id: "human", label: "Human" },
          { id: "elf", label: "Elf" },
        ]}
        selected={["elf"]}
        onChange={onChange}
      />,
    );
    expect(
      (screen.getByRole("radio", { name: "Elf" }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Human" }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("disables unchecked options when a multi-select step hits its limit", () => {
    render(
      <EntityChoiceStep
        title="Equipment"
        limit={2}
        options={[
          { id: "chainmail", label: "Chainmail" },
          { id: "shield", label: "Shield" },
          { id: "rope", label: "Rope" },
        ]}
        selected={["chainmail", "shield"]}
        onChange={() => {}}
      />,
    );

    expect(
      (screen.getByRole("checkbox", { name: "Chainmail" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Shield" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Rope" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
  });
});
