# L5 — Stack, configuration & bootstrap projet

## Contexte

- **L0** : [Vision](../../L0-vision/intention.md)
- **L2** : [Couches](../../L2-architecture/couches.md)

## Dépendances (reconstruction exacte)

| Package | Version (package.json) | Rôle |
|---------|------------------------|------|
| nuxt | ^4.4.6 | Framework SPA |
| vue | ^3.5.34 | UI |
| vuetify | ^4.0.7 | Composants Material |
| vite-plugin-vuetify | ^2.1.3 | Intégration Vite |
| @mdi/font | ^7.4.47 | Icônes |
| echarts | ^6.1.0 | Graphiques |
| vue-echarts | ^8.0.1 | Wrapper Vue |
| marked | ^18.0.5 | Page /spec |
| papaparse | ^5.5.3 | CSV |
| vitest | ^4.1.8 | Tests |
| typescript | ^6.0.3 | Typage |
| sass | ^1.100.0 | Styles |

## Scripts npm

```bash
npm run dev        # dev server :3000
npm run build      # build production
npm run generate   # export statique → .output/public
npm test           # vitest run
npm run lint       # eslint
```

## nuxt.config.ts — points obligatoires

| Option | Valeur | Impact reconstruction |
|--------|--------|----------------------|
| `ssr` | `false` | SPA pure, pas de SSR |
| `alias` | `@application`, `@domain`, `@infrastructure` | Imports couche |
| `css` | `~/assets/main.scss` | Styles globaux |
| `routeRules` | redirects legacy | URLs anciennes |
| `nitro.prerender.routes` | liste routes statiques | GitHub Pages |
| `runtimeConfig.public.widApiKey` | `NUXT_PUBLIC_WID_API_KEY` | WID live |
| `runtimeConfig.public.widApiBaseUrl` | default AWS endpoint | WID API |
| `app.baseURL` | `NUXT_APP_BASE_URL` ou `/` | Sous-chemin GH Pages |
| `app.head.title` | « Études de visualisation » | Titre onglet |

## Variables d'environnement

Fichier `.env.example` :

```
NUXT_PUBLIC_WID_API_KEY=
NUXT_PUBLIC_WID_API_BASE_URL=https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod
```

Optionnel CI : `NUXT_APP_BASE_URL=/repo-name/`

## Bootstrap runtime

1. `app/plugins/vuetify.client.ts` — enregistre Vuetify.
2. `app/plugins/application.client.ts` — `getApplicationContainer({ wid: { apiKey, baseUrl } })`, provide `$application`.
3. `useApplication()` — accès container depuis composables.

## Arborescence minimale à recréer

```
webapp/
├── app/
│   ├── app.vue
│   ├── assets/main.scss
│   ├── components/
│   ├── composables/
│   ├── layouts/default.vue
│   ├── pages/
│   ├── plugins/
│   └── visualization/
├── lib/
│   ├── application/
│   ├── domain/
│   └── infrastructure/
├── test/
├── public/
├── nuxt.config.ts
├── package.json
├── vitest.config.ts
└── .env.example
```

## Déploiement GitHub Pages

- Workflow : `.github/workflows/deploy-webapp.yml` (hors webapp/, documenter séparément).
- Secret : `NUXT_PUBLIC_WID_API_KEY`.
- Source Pages : GitHub Actions.

## Ordre de reconstruction recommandé

1. Projet Nuxt + alias + Vuetify + layout.
2. Domain entities + port + registry stub.
3. Tests domaine + visualization purs.
4. Adaptateur WID + plugin application.
5. EChart wrapper + une page temps simple.
6. Exploration complète + grille.
7. OECD + World Bank.
8. CSV + /sources + /spec.

## À compléter

- [ ] Contenu exact `vitest.config.ts` (alias miroir nuxt)
- [ ] Contenu `app.vue`, `main.scss`
- [ ] Config eslint `@nuxt/eslint`

## Voir aussi

- [UI pages](ui/pages.md)
- [Sources WID](sources/wid.md)
