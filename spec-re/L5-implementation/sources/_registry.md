# L5 — Registry des sources

## Contexte

- **L2** : [Extensibilité](../../L2-architecture/extensibilite.md)
- **L4** : [Sélection source](../../L4-fonctionnalites/interactions/selection-source.md)

## Fichier

`webapp/lib/infrastructure/data-sources/registry.ts`

## API publique

| Fonction | Rôle |
|----------|------|
| `registerDataSource(source)` | Enregistre une instance |
| `listDataSources()` | Liste ordre insertion |
| `initializeDataSources(config?)` | Idempotent ; WID si config.wid, + OECD + WB |
| `getDefaultDataSource()` | wid ou premier |
| `getDataSourceById(id)` | Lookup |
| `resetDataSourcesRegistry()` | Tests |

## Config

```typescript
interface DataSourcesConfig {
  defaultSourceId?: string
  wid?: { apiKey?: string; baseUrl?: string }
}
```

## Initialisation production

`application.client.ts` :

```typescript
getApplicationContainer({
  defaultSourceId: 'wid',
  wid: {
    apiKey: runtimeConfig.public.widApiKey,
    baseUrl: runtimeConfig.public.widApiBaseUrl,
  },
})
```

## Sources enregistrées

| ID | Factory | Condition |
|----|---------|-----------|
| `wid` | `createWidDataSource` | Si `config.wid` passé (toujours en prod via plugin) |
| `oecd-idd` | `createOecdIddDataSource` | Toujours |
| `worldbank` | `createWorldBankDataSource` | Toujours |

## Tests

`webapp/test/infrastructure/dataSourceRegistry.spec.ts`

## Notes de reconstruction

Implémenter registry + stub source avant adaptateurs réels. Tests reset registry entre cas.

## Voir aussi

- [wid.md](wid.md)
- [oecd-idd.md](oecd-idd.md)
- [worldbank.md](worldbank.md)
