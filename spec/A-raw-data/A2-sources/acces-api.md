# A2 — Accès programmatique (API et équivalents)

*Comment récupérer automatiquement les données des sources du [catalogue](./catalogue-sources.md) ?*

**API** = service HTTP documenté (REST, JSON, SDMX, etc.).  
**Pas d’API publique** = fichiers, portail web, compte chercheur ou rapports statiques.  
**LISSY** = requêtes distantes sur micro (LIS/LWS), pas endpoint HTTP public.

---

## Avec API ou service de requête machine

| Source | Type d’accès | Documentation | Authentification | Remarques |
|--------|--------------|---------------|------------------|-----------|
| **WID** (données + climat) | API REST JSON | [wid.world/data](https://wid.world/data/) | Clé optionnelle | Pays, variables, années ; export CSV |
| **OECD** (IDD, Revenue, SOCX, STAN, Housing, Corporate, wealth) | API **SDMX-JSON** | [OECD Data API](https://data-explorer.oecd.org/) — `https://sdmx.oecd.org/public/rest/` | Sans clé (usage modéré) | Un mécanisme pour la plupart des jeux |
| **Eurostat** (SILC, énergie, HBS, gov, SBS, prix) | API **JSON-stat** | [Eurostat API](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data/query) | Sans clé | Datasets `ilc_*`, `nrg_*`, `gov_*`, `sbs_*`… |
| **World Bank — PIP** | API REST | [pip.worldbank.org/api](https://pip.worldbank.org/api) | Sans clé | Pauvreté, Gini |
| **FMI — GFS** | API **SDMX** | [IMF Data API](https://data.imf.org/en/Resource-Pages/IMF-API) | Sans clé | Comptes publics |
| **BIS** | API **SDMX** | [BIS Statistics API](https://www.bis.org/statistics/api.htm) | Sans clé | Flux financiers |
| **IEA** | API REST | [iea.org/api](https://www.iea.org/api) | **Clé obligatoire** | Bilans énergie |
| **Insee / Filosofi** (data.gouv) | API **data.gouv** + Insee | [api data.gouv](https://www.data.gouv.fr/fr/docs/api/reference/) ; [api.insee.fr](https://api.insee.fr/) | Clé Insee selon jeu | `resource_id` sur catalogues |
| **USAspending** | API REST | [api.usaspending.gov](https://api.usaspending.gov/) | Sans clé | Aides fédérales USA |
| **BOAMP** (via data.gouv) | API **data.gouv** | [data.gouv.fr](https://www.data.gouv.fr) | Selon jeu | Marchés publics, aides FR |

---

## Accès distant spécialisé (pas API REST publique)

| Source | Accès | Remarques |
|--------|-------|-----------|
| **LIS / LWS** | **LISSY** (Stata/R/SAS distant) | Compte chercheur institutionnel |

---

## Sans API publique

| Source | Mode habituel |
|--------|---------------|
| **LIS / LWS** (hors LISSY) | Inscription + téléchargement |
| **SCF (Fed)** | ZIP/CSV — [SCF data](https://www.federalreserve.gov/econres/scf/dataviz/scf_dataviz.html) |
| **ECB — HFCS** | Téléchargement CSV/Stata |
| **BLS — CEX** | Téléchargement PUMD — [bls.gov/cex/pumd](https://www.bls.gov/cex/pumd.htm) |
| **EXIOBASE** | Fichiers sur [exiobase.eu](https://www.exiobase.eu/) |
| **UBS Global Wealth Report** | PDF / tableaux |
| **Forbes / Bloomberg** | Pages web, listes |
| **Wealth-X** | Rapports commerciaux |
| **Comptabilité nationale — ONU** | Téléchargements [UN Data](https://data.un.org/) |
| **Comptabilité nationale — pays** | Mix (BEA : fichiers ; Insee : API) |
| **Subventions** (hors USAspending/BOAMP) | CSV portails nationaux |
| **EDGAR / Global Carbon Atlas** | Téléchargement — pas d’API type WID par centile |

---

## Synthèse — toutes les sources du catalogue

| Source | API / accès programmatique ? |
|--------|------------------------------|
| World Inequality Database (WID) | **Oui** — REST (+ CSV) |
| WID — inégalités carbone | **Oui** — même API |
| Luxembourg Income Study (LIS) | **Non** — **LISSY** (chercheur) |
| Luxembourg Wealth Study (LWS) | **Non** — LISSY / téléchargement |
| OECD — IDD | **Oui** — SDMX OECD |
| OECD — Revenue Statistics | **Oui** — SDMX OECD |
| OECD — SOCX | **Oui** — SDMX OECD |
| OECD — STAN | **Oui** — SDMX OECD |
| OECD — Housing | **Oui** — SDMX OECD |
| OECD — Corporate / FDI | **Oui** — SDMX OECD |
| OECD — Household wealth | **Oui** — SDMX OECD |
| Eurostat — SILC | **Oui** — JSON-stat |
| Eurostat — énergie | **Oui** — JSON-stat |
| Eurostat — HBS | **Oui** — JSON-stat |
| Eurostat — gouvernement | **Oui** — JSON-stat |
| Eurostat — SBS | **Oui** — JSON-stat |
| Eurostat — prix et loyers | **Oui** — JSON-stat |
| Eurostat — aides d’État | **Oui** — JSON-stat (`state_aid`) |
| Federal Reserve — SCF | **Non** — fichiers |
| ECB — HFCS | **Non** — fichiers |
| Insee — Filosofi / data.gouv | **Oui** — data.gouv (+ Insee) |
| World Bank — PIP | **Oui** — API PIP |
| FMI — GFS | **Oui** — SDMX IMF |
| BIS | **Oui** — SDMX BIS |
| IEA | **Oui** — clé requise |
| BLS — CEX | **Non** (détail CEX) — téléchargement |
| EXIOBASE | **Non** — fichiers |
| Comptabilité nationale (ONU / pays) | **Partiel** |
| Comptabilité nationale — entreprises | **Partiel** (Eurostat/OCDE oui) |
| USAspending | **Oui** — REST |
| BOAMP / data.gouv | **Oui** — data.gouv |
| UBS Global Wealth Report | **Non** — rapports |
| Forbes / Bloomberg | **Non** |
| Wealth-X | **Non** |
| EDGAR / Global Carbon Atlas | **Non** (usage §4 complément) |

[Catalogue](./catalogue-sources.md)
