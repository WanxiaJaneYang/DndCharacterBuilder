import { describe, expect, it, vi } from "vitest";
import uiTextJson from "../uiText.json";
import {
  buildEntityTypeSingleSelectData,
  buildMetadataNameFieldData,
} from "./pageDataBuilders";

const t = uiTextJson.en;

describe("page field data builders", () => {
  it("builds metadata and entity-choice field data without App-owned shaping", () => {
    const onNameChange = vi.fn();
    const onSelect = vi.fn();

    const metadata = buildMetadataNameFieldData({
      title: "Name",
      label: t.NAME_LABEL,
      inputId: "character-name-input",
      value: "Aric",
      placeholder: t.METADATA_PLACEHOLDER,
      onChange: onNameChange,
    });
    const entityChoice = buildEntityTypeSingleSelectData({
      title: "Race",
      inputName: "race",
      value: "human",
      options: [{ id: "human", label: "Human" }],
      onSelect,
    });

    expect(metadata.value).toBe("Aric");
    expect(metadata.onChange).toBe(onNameChange);
    expect(entityChoice.options[0]?.label).toBe("Human");
    expect(entityChoice.onSelect).toBe(onSelect);
  });
});
