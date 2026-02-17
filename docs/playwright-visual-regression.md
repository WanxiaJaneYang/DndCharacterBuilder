# Playwright Visual Regression Testing

This repo uses Playwright screenshot assertions (`expect(page).toHaveScreenshot()`) to detect UI regressions across desktop and mobile.

## Prerequisites

`playwright.config.ts` does not force a custom browser path, so default Playwright install/cache behavior works out of the box.

```bash
npm install
npm run playwright:install
```

If your machine cannot write to the default Playwright cache location, use a local path:

```bash
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm run playwright:install
```

## Run locally

Run visual tests:

```bash
npm run test:visual
```

Open the HTML report:

```bash
npx playwright show-report
```

## Update baselines

When intentional UI changes are made, refresh snapshots:

```bash
npm run test:visual:update
```

This updates baseline images in `tests/visual/*-snapshots`.

## Stability tips

- Keep animations disabled in screenshots (already configured in `playwright.config.ts`).
- Prefer deterministic test data (fixed names/inputs).
- Avoid capturing unstable UI content (timestamps, random values, ads, live feeds).
- Mask dynamic elements when needed:

```ts
await expect(page).toHaveScreenshot('example.png', {
  mask: [page.locator('[data-testid="live-clock"]')]
});
```

- Use `test-results` diffs and the HTML report to inspect failures quickly.
