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
npm test            # single run
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

**One-time setup** — repo **Settings → Pages** (`https://github.com/<owner>/<repo>/settings/pages`) :

1. **Build and deployment → Source** : **GitHub Actions** (not “Deploy from a branch”).
2. **Settings → Secrets → Actions** : add `NUXT_PUBLIC_WID_API_KEY`.

Live URL: **https://\<owner\>.github.io/\<repo\>/** (e.g. `https://warielon.github.io/weco/`).

If deploy fails with `Failed to create deployment (status: 404)`, Pages is not enabled or the source is still “branch” instead of “GitHub Actions”. On a **private** repo, GitHub Pages requires a paid plan — use S3/Cloudflare Pages instead.

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

The running app fetches all chart data from the **live WID.world API** (browser →
`countries-variables` / `countries-available-variables`). Without a valid API key,
or when a request returns no data, pages show an explicit error message instead
of synthetic fallback data.

## Project structure

See [`STRUCTURE.md`](./STRUCTURE.md) for the full application map (pages, composables, charts, data layer).

```
webapp/
├── app/                  # Nuxt UI (pages, layouts, components, composables)
├── lib/                  # Pure logic (charts, data-sources, domain, csv)
├── test/                 # Vitest unit tests
└── nuxt.config.ts
```

## Adding a data source

1. Implement `DataSourcePort` in `lib/domain/ports/DataSourcePort.ts`
2. Create adapter under `lib/infrastructure/data-sources/<name>/`
3. Register in `lib/infrastructure/data-sources/registry.ts`

## Data

Primary external source: [WID.world](https://wid.world/) — World Inequality Database.
