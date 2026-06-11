# Economic Stress Dashboard

Nuxt + Vuetify + TypeScript static dashboard for comparing economic inequality data and testing stress hypotheses.

## Features

- Public landing page and responsive dashboard shell (Vuetify)
- Pluggable data source layer with **WID.world** adapter
- CSV reader factory (file, string, URL inputs)
- ECharts visualizations: time series, distribution bars, scatter plots
- Configurable stress hypothesis scaffolding

## Quick start

```bash
cd webapp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

Unit tests run with [Vitest](https://vitest.dev/) on the pure logic of the WID
data layer and chart builders (no network, browser, or Vue component needed).

```bash
npm test            # single run
npm run test:watch  # watch mode
```

See [`test/README.md`](./test/README.md) for the per-suite coverage breakdown.

## Static deployment

```bash
npm run generate
```

Output is written to `.output/public` for GitHub Pages, Netlify, or any static host.

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_WID_API_KEY` | Optional hex API key from the official R `wid` package (`sysdata.rda`). When set, queries the live WID webservice. |
| `NUXT_PUBLIC_WID_API_BASE_URL` | WID API base URL (default: AWS prod endpoint). |
| `WID_DATA_DIR` | Directory of the local WID dump (`WID_data_<AREA>.csv`). Used when no API key is set. Defaults to `webapp/data/WID_DATA`. |

When **`NUXT_PUBLIC_WID_API_KEY`** is set, data is fetched from the live WID.world
webservice (same key as the official R package). Otherwise the app reads the local
dump through Nitro routes under `/api/wid/*`. Charts fall back to **sample data**
only when a series is missing or a request fails.

## Project structure

```
webapp/
├── app/                  # Nuxt app (pages, layouts, plugins, composables)
├── app/components/       # Vue components (charts, CSV upload)
├── app/composables/      # useDashboard, useDataSources
├── src/
│   ├── charts/           # ECharts option builders
│   ├── csv/              # CSV reader factory
│   ├── data-sources/     # DataSource interface + WID adapter
│   ├── domain/           # Shared TypeScript types
│   ├── hypotheses/       # Stress hypothesis configs
│   └── http/             # fetchJson helper
└── app/plugins/vuetify.client.ts
```

## Adding a data source

1. Implement `DataSource` in `src/data-sources/Source.ts`
2. Create adapter under `src/data-sources/<name>/`
3. Register in `src/data-sources/registry.ts`

## Visualization guidance

- **Time series (ECharts line)**: compare inequality vs stress over time with zoom/brush
- **Distribution (ECharts bar)**: percentile / top-share breakdown for a given year
- **Scatter (ECharts scatter)**: cross-country relationship between inequality and stress proxy

## Data

Primary external source: [WID.world](https://wid.world/) — World Inequality Database.
