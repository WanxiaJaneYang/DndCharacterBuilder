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

export function buildMetadataNameFieldData(
  data: MetadataNameFieldData,
): MetadataNameFieldData {
  return data;
}

export function buildEntityTypeSingleSelectData(
  data: EntityTypeSingleSelectData,
): EntityTypeSingleSelectData {
  return data;
}
