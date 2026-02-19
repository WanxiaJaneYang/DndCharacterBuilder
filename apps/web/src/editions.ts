export type EditionOption = {
  id: string;
  label: string;
  basePackId: string;
  optionalPackIds: string[];
};

export const EDITIONS: EditionOption[] = [
  {
    id: 'dnd-3.5-srd',
    label: 'D&D 3.5 SRD',
    basePackId: 'srd-35e-minimal',
    optionalPackIds: [],
  },
];

export const FALLBACK_EDITION: EditionOption = {
  id: '',
  label: '',
  basePackId: '',
  optionalPackIds: [],
};

export function defaultEditionId(editions: EditionOption[]): string {
  return editions.find((edition) => edition.id.trim().length > 0)?.id ?? '';
}

