# UI Design Tokens

Design tokens are the smallest units of our design system.  They define consistent values for colours, typography, spacing, sizing and other visual attributes.  By centralising these values, we ensure that our UI remains cohesive across components and can be easily themed or adjusted.

## Purpose

The goal of this document is to outline the categories of design tokens used in the DnDCharacterBuilder UI and provide guidelines for defining and applying them.  These tokens map directly to variables in our CSS or styling system and should correspond to values defined in Figma.

## Token Categories

### Colour Tokens

Colour tokens define the palette used throughout the application.  Each token should have a semantic name rather than a raw colour code.  Examples include:

- `primary` – the main accent colour used for buttons and highlights.
- `secondary` – a secondary accent, used sparingly.
- `background` – default page background colour.
- `surface` – background for cards and panels.
- `error` – colour used for error messages and banners.
- `warning` – colour used for warnings.
- `text` – default text colour.
- `textMuted` – secondary text colour.

### Typography Tokens

Typography tokens define font families, sizes, weights and line heights:

- `fontFamilyBase` – primary font (e.g. Inter, Roboto).
- `fontSizeXs`, `fontSizeSm`, `fontSizeMd`, `fontSizeLg`, `fontSizeXl` – scale for headings and body text.
- `fontWeightRegular`, `fontWeightMedium`, `fontWeightBold` – weight values.
- `lineHeightDefault` – baseline line height ratio.

### Spacing Tokens

Spacing tokens define consistent margins and padding.  Use a 4‑point or 8‑point grid to simplify alignment:

- `spaceXs` (4px), `spaceSm` (8px), `spaceMd` (16px), `spaceLg` (24px), `spaceXl` (32px).

### Size Tokens

Size tokens specify heights, widths, border radii and other dimensional properties:

- `borderRadiusSm` (4px) – small corner radius.
- `borderRadiusMd` (8px) – standard corner radius for cards.
- `borderRadiusLg` (12px) – used for larger containers or modals.
- `maxContentWidth` – maximum width for the wizard content area.

### Shadow Tokens

Shadow tokens define elevation and depth for UI elements:

- `shadowSm` – subtle shadow for small elements.
- `shadowMd` – standard card shadow.
- `shadowLg` – deeper shadow for modals.

## Guidelines

1. **Semantic Naming:**  Tokens should describe their intent (e.g. `error` vs `red500`).  This makes them easier to use across different themes or colour palettes.
2. **Central Source of Truth:**  Token values should be defined in a single place (e.g. a JSON or SCSS file) and imported throughout the UI.  Do not hardcode values in components.
3. **Figma Sync:**  Keep tokens aligned with Figma.  Use the `figma/TOKENS_SYNC.md` document to describe the process of exporting tokens from Figma and updating the codebase.
4. **Theming Support:**  Consider future support for light and dark themes.  Tokens should be defined in a way that allows swapping colour sets based on theme.

## TODO

- Define the initial colour palette and document colour usage guidelines.
- Map Figma tokens to code variables (see Figma handoff process).
- Decide on the spacing scale (4‑point vs 8‑point) and apply consistently.
- Implement a token system in the codebase (e.g. CSS variables or Tailwind config).
- Document how to extend tokens for future editions or branding updates.

## Checklist

- [ ] Token categories listed and explained.
- [ ] Semantic names defined for colours and typography.
- [ ] Figma sync process referenced.
- [ ] Initial palette and values established.
- [ ] Guidelines for usage and theming documented.