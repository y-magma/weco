# Boîte à outils de visualisations

Nuxt + Vuetify + TypeScript SPA pour explorer les données WID.world :
trois types de visualisation (profil sur les g-percentiles, série temporelle,
nuage de 2 variables), grilles composables et import CSV.

## Features

- Page d'accueil et navigation responsive (Vuetify)
- Couche de sources de données extensible avec adaptateur **WID.world**
- **Hub `/panneau`** : trois boîtes à outils (population, temps, variables)
- **Profil population** : bandes / ligne / nuage, échelles log, drill-down, densités, Lorenz
- **Série temporelle** : comparaison multi-pays sur une même variable, légende, axes compacts
- **Nuage 2 variables** : jointure par percentile, jauge de rang, axes compacts
- **Grille** : panneaux de types mixtes, filtres repliables, tuile « + » avec dialogue de choix
- Import CSV avec aperçu et série temporelle
- Rendu de la spécification Markdown (`/spec`)

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
npm test            # single run (~117 tests, excludes live conformance)
npm run test:watch  # watch mode
```

See [`test/README.md`](./test/README.md) for the per-suite coverage breakdown.

## Static deployment

```bash
npm run generate
```

Output is written to `.output/public` for GitHub Pages, Netlify, or any static host.

### GitHub Pages (automated)

Each push to `main` that touches `webapp/` triggers
[`.github/workflows/deploy-webapp.yml`](../.github/workflows/deploy-webapp.yml).

**One-time setup** (repo [Settings → Pages](https://github.com/warielon/samuel-gscop-26/settings/pages)):

1. **Build and deployment → Source** : `GitHub Actions`
2. **Settings → Secrets → Actions** : add `NUXT_PUBLIC_WID_API_KEY` (same hex key as in `.env.example`)

Live URL: **https://warielon.github.io/samuel-gscop-26/**

Manual redeploy: **Actions → Deploy webapp to GitHub Pages → Run workflow**.

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_WID_API_KEY` | **Required** for live data. Hex key from the official R `wid` package (`sysdata.rda`). |
| `NUXT_PUBLIC_WID_API_BASE_URL` | WID API base URL (default: AWS prod endpoint). |
| `WID_REFERENCE_DATA_DIR` | Golden CSV dump for **conformance tests only** (`WID_data_<AREA>.csv`). |

The running app fetches all chart data from the **live WID.world API** (browser →
`countries-variables` / `countries-available-variables`). Without a valid API key,
or when a request returns no data, pages show an explicit error message instead
of synthetic fallback data.

### Conformance tests (API vs local CSV)

The local CSV dump is kept as a **reference** to validate the API, not to power the app:

```bash
# Vitest battery (6 profile cases, ~2 min)
npm run test:conformance

# CLI report
npm run wid:conformance

# Side-by-side CSV vs API for 127 g-percentiles (strict !==)
npm run wid:compare
npm run wid:compare -- --country FR --variable ahweal --year 2021 --diffs-only
npm run wid:compare -- --json --out /tmp/wid-compare.json
```

Set `WID_REFERENCE_DATA_DIR` to the directory with `WID_data_*.csv` files.

## Project structure

See [`STRUCTURE.md`](./STRUCTURE.md) for the full application map (pages, composables, charts, data layer).

```
webapp/
├── app/                  # Nuxt UI (pages, layouts, components, composables)
├── src/                  # Pure logic (charts, data-sources, domain, csv)
├── test/                 # Vitest unit tests
├── scripts/              # CLI conformance tools
└── nuxt.config.ts
```

## Adding a data source

1. Implement `DataSourcePort` in `src/domain/ports/DataSourcePort.ts`
2. Create adapter under `src/infrastructure/data-sources/<name>/`
3. Register in `src/infrastructure/data-sources/registry.ts`

## Data

Primary external source: [WID.world](https://wid.world/) — World Inequality Database.
