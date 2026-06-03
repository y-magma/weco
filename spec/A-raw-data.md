# A — Raw Data

> Inventaire des données brutes, sources, formats et règles de priorisation.  
> Source pilote MVP : **WID.world**. Voir aussi [decisions.md](./decisions.md) pour le périmètre verrouillé.

---

## A1 — Indicateurs cibles

### Tableau principal (MVP)

| id (WID) | Label | Définition | Unité | Population | Granularité | Période typique | MVP / Phase 2 | Dictionnaire WID |
|----------|-------|------------|-------|------------|-------------|-----------------|---------------|------------------|
| `sptinc` | Top 10% income share | Part du revenu national avant impôt détenue par les 10 % les plus riches | % | Adultes, revenu national avant impôt | Pays | ~1980–2023 | **MVP** | [codes WID](https://wid.world/codes-dictionary/#using-graphing) |
| `sptop1` | Top 1% income share | Part du revenu national avant impôt détenue par le 1 % | % | Idem | Pays | ~1980–2023 | **MVP** | idem |
| `ghini` | Gini (pre-tax) | Coefficient de Gini sur revenu national avant impôt | index 0–1 | Idem | Pays | ~1980–2023 | **MVP** | idem |
| `ahwbus` | Average household wealth | Patrimoine net moyen des ménages | EUR (PPP) | Ménages | Pays | ~1995–2023 | **MVP** | idem |
| `thwealj992` | Average net wealth (percentile) | Patrimoine net moyen par tranche de centile | EUR (nominal ou PPP selon série) | Adultes / ménages selon série | Pays × percentile | Année la plus récente | **MVP** (distribution) | idem — utilisé dans `Stage_gscop/zoom_fractal.py` |
| `cshweal*` | Wealth composition | Parts immobilier / financier / dette dans le patrimoine | % | Ménages | Pays | Variable | Phase 2 | idem |
| `cshinc*` | Income composition | Salaires, revenus du capital, prestations | % | Adultes | Pays | Variable | Phase 2 | idem |
| `stress_index` | Social stress proxy | **Placeholder interne** — pas une variable WID | index | — | — | — | **Sample only** | N/A — voir [decisions.md §6](./decisions.md) |
| CO₂ / énergie par centile | Empreinte carbone / consommation | Consommation ou émissions par niveau de revenu/patrimoine | tCO₂e ou kWh | Variable selon source | Pays | Variable | Phase 2 | Sources externes (WID partiel, OCDE) |

### Proxies explicites

| Besoin analytique | Donnée idéale | Proxy MVP | Statut |
|-------------------|---------------|-----------|--------|
| Stress social | Enquêtes bien-être, indicateurs santé mentale OCDE | `stress_index` généré dans `sampleData.ts` | **Hors scope réel** — sample-only |
| Revenu du capital | Variable WID `cshinc` (part capital) | Corrélation documentée `sptinc` × `ahwbus` en phase 2 | Spec D, pas de proxy numérique MVP |
| Revenu du travail vs patrimoine | Séries WID revenu du travail + patrimoine moyen | Paires d’indicateurs WID distincts (phase 2) | Documenté dans [D-statistics.md](./D-statistics.md) |
| Dépenses / revenus État | Comptabilité nationale, WIR | Non couvert MVP | Phase 2 — voir [E-economic-models.md](./E-economic-models.md) |

### Priorité thématique

| Thème | MVP | Phase 2 |
|-------|-----|---------|
| **Revenu** (parts, Gini) | ✅ | Extension composition |
| **Patrimoine** (moyennes, distribution percentile) | ✅ partielle | Zoom fractal complet, composition |
| **Flux CO₂ / énergie** | ❌ | Intégration source dédiée |

---

## A2 — Inventaire des sources

### Source pilote : WID.world

| Attribut | Valeur |
|----------|--------|
| **URL** | https://wid.world/ |
| **API** | `https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod` (configurable via `NUXT_PUBLIC_WID_API_BASE_URL`) |
| **Endpoints utilisés** | `/countries-variables`, `/data?areas=&variables=&years=` |
| **Authentification** | Clé API optionnelle — header `x-api-key` (`NUXT_PUBLIC_WID_API_KEY`) |
| **Licence** | WID terms — attribution obligatoire, pas de revente |
| **Quotas** | Non documentés publiquement ; prévoir cache client (`dataSourceCache`) et fallback sample |
| **Implémentation** | `webapp/src/data-sources/wid/widClient.ts`, `widSource.ts` |

### Périmètre géographique MVP

Pays codés en dur dans `webapp/src/data-sources/wid/indicators.ts` :

| Code | Pays | Rôle MVP |
|------|------|----------|
| FR | France | Pays pilote (zoom fractal, hypothèses par défaut) |
| US | États-Unis | Comparaison inégalité élevée |
| GB | Royaume-Uni | Europe anglo-saxonne |
| DE | Allemagne | Europe continentale |
| BR | Brésil | Émergent, inégalité forte |
| IN | Inde | Émergent, grande population |
| ZA | Afrique du Sud | Émergent |
| CN | Chine | Comparaison Asie |

### Sources phase 2 (inventaire préliminaire)

| Source | URL | Licence | Auth | Usage prévu |
|--------|-----|---------|------|-------------|
| World Inequality Report | https://wir.world/ | WIR / WID | Non | Contexte narratif, validation |
| Eurostat — distribution revenus | https://ec.europa.eu/eurostat | EU open data | Non | Complément Europe |
| OCDE — Income Distribution | https://stats.oecd.org | OCDE terms | Non | Déciles disposable income |
| Banques centrales / BIS | Variable | Variable | Variable | Dette sectorielle (lien SFC) |
| Fichiers locaux CSV | `Stage_gscop/wid_all_data/` | WID download | N/A | Snapshots offline, zoom fractal |

---

## A3 — Formats bruts par source

### WID — API JSON

**Requête type :**

```
GET /data?areas=FR&variables=sptinc,sptop1&years=1980,1981,...,2023
Header: Accept: application/json
Header: x-api-key: <optional>
```

**Réponse type** (`WidDataResponse` dans `widClient.ts`) :

```json
{
  "data": [
    {
      "country": "FR",
      "variable": "sptinc",
      "year": 2020,
      "value": 32.5
    },
    {
      "country": "FR",
      "variable": "sptinc",
      "year": 2021,
      "value": 33.1
    }
  ]
}
```

**Champs :**

| Champ | Type | Description |
|-------|------|-------------|
| `country` | string | Code ISO pays WID (ex. `FR`) |
| `variable` | string | Code variable WID (ex. `sptinc`, `thwealj992`) |
| `year` | number | Année calendaire |
| `value` | number | Valeur numérique |
| `percentile` | string? | Présent pour séries distributives — notation WID (ex. `p50p51`, `p99.999p100`) |

### WID — CSV (export bulk)

Format observé dans `Stage_gscop/zoom_fractal.py` :

- **Séparateur :** `;`
- **Encodage :** UTF-8 (supposé)
- **Colonnes :** `country`, `variable`, `year`, `percentile`, `value` (aligné sur API)
- **Fréquence :** annuelle pour séries macro ; snapshot par téléchargement manuel

**Exemple annoté (2 lignes) :**

```csv
country;variable;year;percentile;value
FR;thwealj992;2024;p0p1;1250
FR;thwealj992;2024;p50p51;98500
```

| Ligne | Interprétation |
|-------|----------------|
| L1 | France, patrimoine net moyen, 2024, tranche centile 0–1 %, 1 250 € |
| L2 | France, même variable, tranche 50–51 %, 98 500 € |

### Gestion des valeurs manquantes et révisions

| Cas | Politique clean (→ B1) |
|-----|------------------------|
| `value` null / absent | Point omis ; pas d’interpolation silencieuse |
| Année sans observation | Trou dans `DataSeries.points` |
| Révision WID | Nouveau `vintage` dans métadonnées ; snapshot daté en CSV |
| Percentile inconnu | Rejet à l’étape validate |

---

## A4 — Catégorisation et priorisation

### Grille de catégorisation

| Source / jeu | Type micro/macro | Stock / flux | Qualité | Résolution temporelle | Compatibilité clean B1 |
|--------------|------------------|--------------|---------|----------------------|------------------------|
| WID parts (sptinc, sptop1) | Macro agrégée | Flux (revenu) | Haute — méthodologie DINA | Annuelle | ✅ `DataSeries` |
| WID Gini (ghini) | Macro | Flux | Haute | Annuelle | ✅ `DataSeries` |
| WID patrimoine moyen (ahwbus) | Macro | Stock | Haute | Annuelle | ✅ `DataSeries` |
| WID distribution percentile | Micro agrégée | Stock | Haute | Annuelle (coupe transversale) | ✅ `DistributionSeries` |
| WID CSV bulk | Idem API | Idem | Identique si même vintage | Annuelle | ✅ via même convertisseur |
| stress_index (sample) | Composite fictif | — | **Nulle** (démo) | Annuelle | ✅ avec flag `sample: true` |
| Eurostat (phase 2) | Macro / enquête | Flux | Moyenne — breaks méthodo | Annuelle | À mapper |
| CO₂ / énergie (phase 2) | Macro / micro | Flux | Variable | Variable | Extension schéma |

**Légende qualité :**

- **Haute** : méthodologie publiée, couverture longue, révisions documentées
- **Moyenne** : comparabilité internationale partielle
- **Faible / N/A** : placeholder ou source non retenue pour analyse

### Règles de priorisation (même indicateur, plusieurs sources)

1. **WID** prime pour revenu et patrimoine distributional national accounts (alignement WIR).
2. En cas de conflit WID API vs CSV snapshot : **CSV snapshot daté** si `vintage` CSV > date fetch API (reproductibilité) ; sinon API.
3. Eurostat / OCDE : utilisés seulement si WID absent pour le pays ou l’indicateur, avec flag `sourceId` distinct et note méthodologique UI.
4. Jamais fusionner pré-tax et post-tax sans toggle explicite (principe repris de `new_project/General_spec.md`).
5. Placeholder sample (`stress_index`) **jamais** prioritaire sur une source réelle — retirer le sample dès qu’une source est branchée.

---

## Liens implémentation

| Fichier | Rôle |
|---------|------|
| `webapp/src/data-sources/wid/indicators.ts` | Catalogue MVP indicateurs + pays |
| `webapp/src/data-sources/wid/widClient.ts` | Client API, type `WidDataRow` |
| `webapp/src/data-sources/wid/widSource.ts` | Adaptateur `DataSource` |
| `webapp/src/data-sources/wid/sampleData.ts` | Fixtures offline |
| `Stage_gscop/zoom_fractal.py` | Lecture CSV WID, séquence fractale percentiles |
