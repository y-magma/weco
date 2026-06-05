# A1 — Ce qu’on veut observer

*Sur quelles données veut-on analyser, visualiser et comparer — par acteur, par flux et par niveau de richesse ?*

Le périmètre ci-dessous décrit **l’ambition analytique** du projet. Le MVP s’appuie surtout sur les comptes distributifs WID (ménages, revenu et patrimoine agrégés) ; les blocs État, entreprises et détail des flux sont en grande partie **phase 2**, avec sources complémentaires (comptabilité nationale, WIR, enquêtes).

---

## 1. Revenus (ménages et agrégats nationaux)


| Sous-thème               | Ce qu’on veut voir                                                          | Granularité visée                            | MVP / Phase 2                                              |
| ------------------------ | --------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **Revenu global**        | Niveau et dispersion du revenu national (avant ou après impôt, selon série) | Pays, années ; parts des hauts revenus, Gini | Sur les plus petites tranches de population possible, Gini |
| **Revenu du travail**    | Salaires et revenus d’activité                                              | Pays ; idéalement par tranche de population  | Phase 2                                                    |
| **Revenu du capital**    | Dividendes, intérêts, loyers, plus-values récurrentes                       | Pays ; par tranche de population             | Phase 2                                                    |
| **Prestations sociales** | Transferts monétaires aux ménages (retraites, chômage, famille, etc.)       | Pays ; par tranche ou décile                 | Phase 2                                                    |
| **Salaires**             | Rémunération du travail salarié (niveau moyen ou part dans le revenu)       | Pays, secteur si possible                    | Phase 2                                                    |


**Lecture MVP :** le revenu « global » et l’inégalité (parts, Gini) servent de **socle** ; le découpage travail / capital / prestations / salaires est une **extension** nécessaire pour les questions sur la répartition du revenu entre facteurs et politiques sociales.

---

## 2. Patrimoines


| Sous-thème                    | Ce qu’on veut voir                                        | Granularité visée                | MVP / Phase 2                                    |
| ----------------------------- | --------------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| **Patrimoine net global**     | Stock moyen ou médian par ménage                          | Pays, années                     | **MVP** (WID : patrimoine moyen ménages)         |
| **Patrimoine par tranche**    | Niveau de richesse selon la position dans la distribution | Pays × centiles / tranches fines | **MVP** (distribution percentile)                |
| **Composition du patrimoine** | Parts immobilier, financier, dette, autres actifs         | Pays, tranches                   | Phase 2 (WID `cshweal`*, enquêtes patrimoniales) |


---

## 3. Types de capital (structure des actifs)


| Sous-thème         | Ce qu’on veut voir                                         | Granularité visée | MVP / Phase 2 |
| ------------------ | ---------------------------------------------------------- | ----------------- | ------------- |
| **Immobilier**     | Part du patrimoine ou du revenu implicite liée au logement | Ménages, tranches | Phase 2       |
| **Financier**      | Actions, obligations, liquidités, fonds                    | Ménages, tranches | Phase 2       |
| **Autres / dette** | Actifs professionnels, dette des ménages                   | Ménages           | Phase 2       |


Objectif : distinguer **où** se concentre la richesse (brique immobilière vs financière), pas seulement **combien** au total.

---

## 4. Énergie et empreinte carbone


| Sous-thème                 | Ce qu’on veut voir                                  | Granularité visée                             | MVP / Phase 2 |
| -------------------------- | --------------------------------------------------- | --------------------------------------------- | ------------- |
| **Consommation d’énergie** | Usage par niveau de revenu ou de patrimoine         | Pays, quintiles ou centiles                   | Phase 2       |
| **Émissions CO₂**          | Empreinte liée à la consommation ou au style de vie | Pays, tranches (surtout haut de distribution) | Phase 2       |


Lien analytique visé : croiser inégalité économique et inégalité **écologique** (qui consomme / émet quoi).

---

## 5. État (secteur public)

### Recettes


| Flux                          | Ce qu’on veut voir                      | MVP / Phase 2                         |
| ----------------------------- | --------------------------------------- | ------------------------------------- |
| **Taxes et impôts**           | Prélèvements sur ménages et entreprises | Phase 2 (comptabilité nationale, WIR) |
| **Prélèvements obligatoires** | Cotisations, impôts sociaux, TVA, etc.  | Phase 2                               |


### Dépenses


| Flux                                | Ce qu’on veut voir                                                                 | MVP / Phase 2 |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ------------- |
| **Prestations sociales monétaires** | Pensions de retraite, chômage, assurance maladie et aides sociales versées en cash | Phase 2       |
| **Infrastructures**                 | Dépenses d’investissement et de service public (routes, écoles, hôpitaux, etc.)    | Phase 2       |


L’État n’est pas couvert par le pilote WID ménages en MVP ; il alimente la lecture [SFC](../E-economic-models/E2-sfc.md) et des comparaisons revenu privé ↔ redistribution publique en phase 2.

---

## 6. Entreprises (secteur privé productif)

### Recettes


| Flux                    | Ce qu’on veut voir                                                            | MVP / Phase 2 |
| ----------------------- | ----------------------------------------------------------------------------- | ------------- |
| **Aides de l’État**     | Subventions, crédits d’impôt, commandes publiques                             | Phase 2       |
| **Activité économique** | Chiffre d’affaires, valeur ajoutée, profits                                   | Phase 2       |
| **Dividendes**          | Revenus distribués aux actionnaires (lien avec revenu du capital des ménages) | Phase 2       |


### Dépenses


| Flux                     | Ce qu’on veut voir                                  | MVP / Phase 2 |
| ------------------------ | --------------------------------------------------- | ------------- |
| **Taxes et impôts**      | Impôts sur les sociétés et charges fiscales         | Phase 2       |
| **Salaires**             | Masse salariale, coût du travail                    | Phase 2       |
| **Cotisations sociales** | Part employeur (et lien avec prestations côté État) | Phase 2       |


---

## 7. Les plus riches (oligarques et extrême haut de distribution)


| Sous-thème                 | Ce qu’on veut voir                                                         | Granularité visée | MVP / Phase 2                                              |
| -------------------------- | -------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| **Top 1 %, 0,1 %, 0,01 %** | Parts de revenu et de patrimoine détenues par les toutes petites fractions | Pays, années      | **MVP** (parts revenu WID ; patrimoine par tranches fines) |


---

## Vue d’ensemble — indicateurs pilote WID (MVP)

Pour le MVP, les séries WID suivantes couvrent une **partie** des thèmes 1, 2 et 7 :


| Code WID (référence)   | Couvre approximativement                        |
| ---------------------- | ----------------------------------------------- |
| `sptinc`, `sptop1`     | Revenu global — inégalité (parts des riches)    |
| `ghini`                | Revenu global — dispersion                      |
| `ahwbus`, `thwealj992` | Patrimoine global et par tranche                |
| `cshinc`* (phase 2)    | Détail revenu travail / capital / prestations   |
| `cshweal`* (phase 2)   | Types de capital (immobilier, financier, dette) |


[Dictionnaire WID](https://wid.world/codes-dictionary/#using-graphing).

---

## Lacunes, proxies et limites


| Besoin                             | Donnée idéale                                | MVP                    | Limite                                             |
| ---------------------------------- | -------------------------------------------- | ---------------------- | -------------------------------------------------- |
| État et entreprises (sections 5–6) | Comptabilité nationale, matrices flux        | Non ingéré             | Phase 2 — [E2 SFC](../E-economic-models/E2-sfc.md) |
| Énergie / CO₂ (section 4)          | Enquêtes budget, données carbone par centile | Non                    | Phase 2 — sources dédiées                          |
| Salaires vs prestations vs capital | Micro ou composition WID                     | Agrégats seulement     | Phase 2                                            |
| Capital travail vs patrimoine      | Séries jumelées                              | Indicateurs séparés    | Analyses [D](../D-statistics/D3-hypotheses.md)     |
| Oligarques nommés                  | Listes Forbes, enquêtes patrimoniales        | Centiles WID seulement | Complément qualitatif ou phase 2                   |


---

## Priorité thématique


| Domaine                                            | MVP           | Phase 2                                        |
| -------------------------------------------------- | ------------- | ---------------------------------------------- |
| Revenu global et inégalité (parts, Gini)           | Oui           | Détail travail, capital, prestations, salaires |
| Patrimoine (niveau et distribution)                | Oui           | Composition et types de capital                |
| Très riches / oligarques (centiles extrêmes)       | Oui (partiel) | sources qualitatives                           |
| Énergie / CO₂                                      | Non           | Par tranche de revenu ou patrimoine            |
| État (recettes et dépenses)                        | Non           | Prestations, infrastructures, fiscalité        |
| Entreprises (recettes et dépenses)                 | Non           | Aides, activité, dividendes, charges           |
| Lien entre secteurs (État ↔ ménages ↔ entreprises) | Non           | Matrice flux, lecture SFC                      |

