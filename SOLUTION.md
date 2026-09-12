# Solution

Next.js (TypeScript, App Router) implementation of the challenge in `CHALLENGE.md`: given a Wikipedia URL, find a table, detect its numeric column, and plot it as an image file.

## Architecture

The work is a straight pipeline, and the code mirrors it 1:1 — each stage is its own file under `src/lib/`, unit-tested in isolation, wired together by one orchestrator:

```
Input URL
  -> htmlFetcher.ts            (fetch the page HTML)
  -> wikipediaTableParser.ts   (extract table headers + rows)
  -> numericColumnDetector.ts  (pick the best numeric column, across all tables)
  -> dataCleaner.ts            (raw cell text -> number[])
  -> chartGenerator.ts         (number[] -> PNG buffer, via Chart.js)
  -> imageFileWriter.ts        (buffer -> file on disk)
= Image file output
```

`src/lib/pipeline.ts` composes all six into `generateChartFromUrl(url, outPath)`. Two thin entry points call it:

- **CLI** — `scripts/generate.ts`, matching the challenge's literal "URL in, image file out": `npm run generate -- <url> [outPath]`.
- **Web app** — `src/app/page.tsx` (a form) posts to `src/app/api/generate/route.ts`, which runs the same pipeline and streams the PNG back.

Nothing else depends on Next.js — the pipeline is plain TypeScript/Node and is exercised directly by the tests.

## Assumptions & heuristics

- **Table selection**: targets `table.wikitable` (Wikipedia's standard data-table class, which already excludes navboxes/infoboxes); falls back to any `<table>` if none is found. All tables on the page are considered, not just the first — see below.
- **Numeric column detection**: for every column of every table, the fraction of cells that parse as a number (after stripping footnotes/units/commas) is scored. A column needs to clear 60% to be considered "numeric" at all. Among qualifying columns, one whose values are an exact `1..N` sequence is treated as a rank/`#` column and skipped — otherwise a table with a leading rank column would get charted instead of the actual measurement. If every qualifying column happens to be sequential, or nothing clears 60%, detection falls back to the best raw score rather than failing outright. It only throws when no column anywhere has any numeric cells at all. Ties are broken by first occurrence (first table, then leftmost column).
- **Cell cleaning**: strips footnote refs (`[1]`), thousands-separator commas, and takes the leading numeric token — so `"1.46 m (4 ft 9¼ in)"` → `1.46`. An en dash (Wikipedia's usual "no data" placeholder) is deliberately *not* treated as a minus sign, so it's dropped rather than silently becoming `0`; a real leading hyphen-minus (`"-5"`) still parses as negative.
- **Chart axis**: x-axis is row order (1..N), y-axis is the cleaned numeric column. The challenge only asks to plot "the values in the numeric column" — correlating them with a second, separately-detected date/label column is out of scope for this pass (see Next steps).
- **Chart output format**: PNG, rendered server-side with Chart.js via `chartjs-node-canvas` (a native `canvas` addon under the hood). This was a deliberate trade-off against a dependency-free SVG: PNG is a literal raster image file, at the cost of a native build dependency. See **Prerequisites** below — this is the one part of the setup that isn't pure `npm install`.
- **Security**: the web app fetches a user-supplied URL server-side, which is a classic SSRF shape (a visitor could otherwise point it at an internal/metadata endpoint). `htmlFetcher.ts` only allows `https://*.wikipedia.org` — which is also just... what the challenge actually asks for.
- **Wikipedia fetch etiquette**: requests carry a descriptive, non-identifying `User-Agent` (no personal info embedded), since Wikipedia's fetch etiquette throttles generic/default ones.
- **Bundled font**: chart text is rendered with a bundled Roboto TTF (`src/lib/assets/fonts/`, OFL-1.1 licensed — see the accompanying `OFL.txt`), registered explicitly via `canvas`'s `registerFont`, instead of relying on whatever system font happens to be installed. A serverless runtime (Vercel) has no system fonts at all — without this, every label rendered as tofu boxes in production despite working fine locally, since a local machine always has some font to fall back to. Found by deploying and looking at the actual output, not by reasoning about it.

## Prerequisites

`canvas` (pulled in by `chartjs-node-canvas`) is a native Node addon. Install its system libraries once, **before** `npm install`:

- **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- **Debian/Ubuntu**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

Without this, `npm install` will fail trying to compile `canvas`. On a serverless deploy (Vercel), two more things are needed, both already in `next.config.ts` and found only by actually deploying and testing, not by reasoning about the code:

- `serverExternalPackages: ["canvas", "chartjs-node-canvas"]` — without it, Next's bundler fails at request time with `Cannot find module as expression is too dynamic`, since `canvas` resolves its platform binary with a dynamic `require` the bundler can't analyze.
- `outputFileTracingIncludes` for `/api/generate`, covering `canvas`'s compiled binary and the bundled font — without it, Next's file tracer (which decides what ships in the deployed function, separately from bundling) can't statically discover either file, so the deployed function is missing them: `Cannot find module 'canvas'` at runtime despite a clean build, or a chart with unreadable text.

## How to run

```bash
npm install
npm run dev          # http://localhost:3000 — form is pre-filled with the challenge's example URL
```

or, matching the challenge's literal "URL in, image file out":

```bash
npm run generate -- "https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression" chart.png
```

`chart.png` in the repo root is a checked-in example of that command's output, so you can see the result without running anything.

## How to test

```bash
npm test
```

30 Vitest specs across the six pipeline modules plus one integration test. Specs are named as Given/When/Then (BDD-style) and were written before each module's implementation (TDD) — e.g. `numericColumnDetector.test.ts`: *"Given a table with both a sequential rank column and a measurement column, When detecting, Then it skips the rank column."*

The integration test (`src/lib/pipeline.test.ts`) runs the full pipeline against `test/fixtures/high-jump.html` — a real, saved copy of the challenge's example Wikipedia page — with only `htmlFetcher` stubbed, and asserts a valid PNG comes out the other end with the `Mark` column selected.

`npm run lint`, `npx tsc --noEmit`, and `npm run build` are all clean.

**Not unit-tested**: the API route and the React form component, as an explicit scope call given the challenge's 3-hour recommendation — the logic they wrap is fully covered. They were, however, exercised for real: dev server up, headless-browser click-through of the actual form, confirming the chart renders and the console is clean, in addition to the CLI run against the live URL.

## Next steps (out of scope for this pass)

- Correlate the numeric column with a detected date/label column for the x-axis, instead of row order.
- A table/column picker in the UI for pages with multiple qualifying tables, instead of the first-qualifying-table heuristic.
- Retry/backoff on the Wikipedia fetch.
