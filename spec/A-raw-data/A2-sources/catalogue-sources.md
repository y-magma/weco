# A2 — Catalogue des sources

*Quelles bases permettent de nourrir [A1 — Ce qu’on veut observer](../A1-ce-qu-on-veut-observer.md) ?*

Pour l’**accès programmatique** (API ou non), voir [acces-api.md](./acces-api.md).

**Légende qualité :**

- **Haute** — méthodologie publiée, usage académique courant, séries longues ou micro harmonisé
- **Moyenne** — utile mais couverture inégale, ruptures méthodologiques ou agrégats trop grossiers
- **Complément** — narrative, listes nommées ou agrégats non distributifs ; ne remplace pas les comptes nationaux

---

## Types de données

| Types | Sources les plus pertinentes |
|-------|------------------------------|
| §1 Revenus | WID, LIS, OECD IDD, Eurostat SILC, enquêtes nationales (SCF, HFCS, Filosofi…) |
| §2 Patrimoines | WID, LWS, HFCS, SCF, enquêtes patrimoine nationales |
| §3 Types de capital | WID (composition), HFCS, SCF, LWS |
| §4 Énergie / CO₂ | WID climat, Eurostat énergie, IEA, enquêtes budget (HBS, CEX) + EXIOBASE |
| §5 État | Comptabilité nationale, IMF GFS, OECD Revenue Statistics & SOCX, Eurostat gouvernement |
| §6 Entreprises | Comptabilité nationale, OECD STAN, Eurostat SBS, BIS |
| §7 Très riches | WID (centiles extrêmes), listes Fortune/Forbes (complément qualitatif) |

---

## 1. Revenus et inégalité des ménages

| Source | URL | Ce qu’elle apporte | Couverture | Granularité | Qualité |
|--------|-----|-------------------|------------|-------------|---------|
| **World Inequality Database (WID)** | [wid.world](https://wid.world/) | Revenu national, parts des top %, Gini, composition revenu (`cshinc*`) | ~170 pays | Centiles / déciles | **Haute** — DINA |
| **Luxembourg Income Study (LIS)** | [lisdatacenter.org](https://www.lisdatacenter.org/) | Micro harmonisé : salaires, prestations, travail, capital | ~50 pays | Micro → quantiles | **Haute** — chercheur |
| **OECD — IDD** | [oecd.org/social/income-distribution-database.htm](https://www.oecd.org/social/income-distribution-database.htm) | Déciles revenu disponible, Gini, pauvreté | OCDE+ | Déciles | **Haute** |
| **Eurostat — SILC** | [eurostat SILC](https://ec.europa.eu/eurostat/web/income-and-living-conditions) | Revenu disponible, pauvreté, types de revenu | Europe | Déciles | **Haute** |
| **SCF (Fed)** | [federalreserve.gov/scf](https://www.federalreserve.gov/econres/scfindex.htm) | Revenu + patrimoine, USA | USA | Micro | **Haute** (USA) |
| **Insee — Filosofi** | [data.gouv.fr](https://www.data.gouv.fr) | Revenus fiscaux, prestations, géo fine | France | Micro agrégée | **Haute** (France) |
| **World Bank — PIP** | [pip.worldbank.org](https://pip.worldbank.org/) | Pauvreté, Gini (Sud) | Mondial | Déciles | **Moyenne** |

---

## 2. Patrimoines et richesse des ménages

| Source | URL | Ce qu’elle apporte | Couverture | Granularité | Qualité |
|--------|-----|-------------------|------------|-------------|---------|
| **WID** | [wid.world](https://wid.world/) | Patrimoine moyen, distribution par centile | Mondial | Centiles | **Haute** |
| **LWS** | [LWS database](https://www.lisdatacenter.org/our-data/lws-database/) | Patrimoine brut/net, actifs, dettes | Pays LIS | Micro | **Haute** |
| **ECB — HFCS** | [ecb HFCS](https://www.ecb.europa.eu/stats/ecb_surveys/hfcs/) | Patrimoine, dette, composition actifs | Zone euro+ | Micro | **Haute** |
| **SCF (Fed)** | voir §1 | Patrimoine détaillé | USA | Micro | **Haute** |
| **OECD — Household wealth** | [oecd.org/social/family/wealth.htm](https://www.oecd.org/social/family/wealth.htm) | Agrégats patrimoine | OCDE | Macro | **Moyenne** |
| **UBS Global Wealth Report** | Rapports UBS | Stocks mondiaux, millionnaires | Mondial | Agrégats | **Complément** |

---

## 3. Types de capital (immobilier, financier, dette)

| Source | URL | Ce qu’elle apporte | Couverture | Qualité |
|--------|-----|-------------------|------------|---------|
| **WID** | [wid.world](https://wid.world/) | Parts immobilier, financier, dette (`cshweal*`) | Pays WID | **Haute** |
| **HFCS / SCF / LWS** | voir §2 | Décomposition actifs au micro | UE / USA / LIS | **Haute** |
| **Eurostat — prix et loyers** | [eurostat](https://ec.europa.eu/eurostat) | Contexte logement | Europe | **Complément** |
| **OECD — Housing** | [oecd.org/housing](https://www.oecd.org/housing/) | Propriété, loyers | OCDE | **Moyenne** |

---

## 4. Énergie et empreinte carbone

| Source | URL | Ce qu’elle apporte | Couverture | Qualité |
|--------|-----|-------------------|------------|---------|
| **WID — climat** | [wid.world](https://wid.world/) | Empreinte par revenu/patrimoine | Grands pays | **Haute** |
| **IEA** | [iea.org/data](https://www.iea.org/data-and-statistics) | Bilans énergie | Mondial | **Moyenne** |
| **Eurostat — énergie** | [eurostat energy](https://ec.europa.eu/eurostat/web/energy) | Conso finale, mix | Europe | **Moyenne** |
| **Eurostat — HBS** | [HBS](https://ec.europa.eu/eurostat/web/household-budget-surveys) | Dépenses énergie par quintile | Europe | **Haute** |
| **BLS — CEX** | [bls.gov/cex](https://www.bls.gov/cex/) | Dépenses USA dont énergie | USA | **Haute** |
| **EXIOBASE** | [exiobase.eu](https://www.exiobase.eu/) | IO → empreinte par poste | Mondial | **Moyenne** |

*EDGAR, Global Carbon Atlas : émissions **territoriales**, complément seulement (pas par centile de revenu).*

---

## 5. État — recettes et dépenses publiques

| Source | URL | Ce qu’elle apporte | Qualité |
|--------|-----|-------------------|---------|
| **FMI — GFS** | [imf.org/Data](https://www.imf.org/en/Data) | Recettes, dépenses par fonction | **Haute** |
| **OECD — Revenue Statistics** | [oecd.org/tax/revenue-statistics](https://www.oecd.org/tax/revenue-statistics/) | Fiscalité par impôt | **Haute** |
| **OECD — SOCX** | [oecd.org/social/expenditure](https://www.oecd.org/social/expenditure/) | Prestations, santé, chômage | **Haute** |
| **Eurostat — gouvernement** | [gov finance](https://ec.europa.eu/eurostat/web/government-finance-statistics) | Comptes publics UE | **Haute** |
| **Comptabilité nationale** | [unstats.un.org](https://unstats.un.org/) ; Insee, BEA… | Investissement public, agrégats | **Haute** |
| **WID** | voir §1 | Revenu ménages pré/post impôt (pas budget État) | **Complément** |

---

## 6. Entreprises

| Source | URL | Ce qu’elle apporte | Qualité |
|--------|-----|-------------------|---------|
| **Comptabilité nationale** | Sources nationales + SNA | VA, profits, masse salariale | **Haute** |
| **OECD — STAN** | [oecd.org/sti/ind](https://www.oecd.org/sti/ind/) | VA par branche | **Moyenne** à **Haute** |
| **Eurostat — SBS** | [SBS](https://ec.europa.eu/eurostat/web/structural-business-statistics) | CA, emploi, charges | **Haute** |
| **BIS** | [bis.org/statistics](https://www.bis.org/statistics/) | Crédit, flux financiers | **Moyenne** |
| **OECD — FDI** | [oecd.org/investment](https://www.oecd.org/investment/) | Profits, dividendes internationaux | **Moyenne** |
| **Subventions** | Eurostat, BOAMP, USAspending… | Aides publiques | **Moyenne** |

---

## 7. Très riches et « oligarques »

| Source | Ce qu’elle apporte | Qualité |
|--------|-------------------|---------|
| **WID** | Top 1 %, 0,1 %, 0,01 % ; fractal | **Haute** |
| **Forbes / Bloomberg** | Fortunes nommées | **Complément** |
| **Wealth-X / UBS billionaires** | Ultra-high-net-worth | **Complément** |
| **HFCS, SCF, LWS** | Queue de distribution micro | **Haute** (par pays) |

---

## Sources « hub » recommandées

| Priorité | Source | Rôle |
|----------|--------|------|
| 1 | **WID** | Socle mondial : revenu, patrimoine, top %, composition, carbone distributif |
| 2 | **LIS / LWS** | Micro harmonisé revenu & patrimoine |
| 3 | **OECD + Eurostat** | SILC, IDD, SOCX, SBS, gouvernement |
| 4 | **Enquêtes nationales** | SCF, HFCS, Filosofi — profondeur pays pilote |
| 5 | **IMF GFS + comptabilité nationale** | État et entreprises |
| 6 | **HBS / CEX + WID climat** | Revenu → énergie / CO₂ |

---

## Fiabilité et limites transverses

| Limite | Conséquence |
|--------|---------------|
| Pré-tax / post-tax | Documenter le concept à chaque série |
| Sud sous-représenté en micro | WID en macro ; LIS/LWS plus restrictif |
| État & entreprises en macro | Pas de centile fiscal sans micro |
| Listes milliardaires | Illustration, pas série officielle longue |
| Carbone territorial | ≠ inégalité entre ménages |

Caractérisation des séries : [A4-caracterisation.md](../A4-caracterisation.md).

[Accès API](./acces-api.md)
