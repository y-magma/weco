# Études comparatives — Catalogue des cas de comparaison

*Inventaire des comparaisons possibles entre WID.world, OECD IDD et World Bank (WDI + PIP), pour alimenter la future page `/etudes`.*

Structure UI et presets par étude : [structure-etudes.md](./structure-etudes.md).  
Caractérisation des concepts : [A4 — Caractérisation](../../A-raw-data/A4-caracterisation.md).

---

## Principe directeur


| Règle                               | Détail                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **WID = socle inchangé**            | Comptes distributifs nationaux (DINA), 127 centiles, pré-impôt pour le revenu (`ptinc`), paramètres `age` / `pop` obligatoires        |
| **OCDE et WB = sources à enrichir** | Enquêtes harmonisées ; l’app expose aujourd’hui un sous-ensemble des indicateurs disponibles via API                                  |
| **Pas de fusion silencieuse**       | Pré- vs post-impôt, centiles vs déciles vs quintiles, revenu vs consommation : toujours **caractérisés côte à côte** (A4)             |
| **Superposition cross-source**      | Autorisée uniquement sur `/etudes`, avec harmonisation explicite — pas sur `/grille` ni `/panneau` (voir [C3](../C3-interactions.md)) |


Catalogues applicatifs de référence :

- WID : `webapp/lib/domain/catalog/widCodes.ts`
- OECD IDD : `webapp/lib/infrastructure/data-sources/oecd-idd/oecdIddCatalog.ts`
- World Bank : `webapp/lib/infrastructure/data-sources/worldbank/worldBankCatalog.ts`

---

## Matrice sources × capacités (état actuel de l’app)


| Thème                          | WID                                           | OECD IDD                                               | World Bank                                          | Granularité          |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | -------------------- |
| **Gini revenu**                | `gptinc` (pré-impôt)                          | `INC_MRKT_GINI`, `INC_DISP_GINI`                       | `PIP_GINI` (0–1), `SI.POV.GINI` (0–100 WDI)         | Scalaire             |
| **Gini patrimoine**            | `ghweal`                                      | — (WDD non implémentée)                                | —                                                   | Scalaire             |
| **Parts par tranche**          | `sptinc`, `shweal` (127 centiles)             | Ratios seulement (`D9_1`, `D5_1`, `D9_5`) ; Palma, QSR | `PIP_DECILE_SHARES` (10), `WDI_QUINTILE_BUNDLE` (5) | 127 / ratio / 10 / 5 |
| **Seuils revenu**              | `tptinc`, `thweal` (seuils par centile)       | `INC_DISP_MEDIAN` (médiane dispo)                      | — (percentiles PIP non exposés)                     | 127 / 1 / 0          |
| **Ratios inter-déciles**       | Calculables depuis `tptinc`                   | Natifs (`INC_DISP_DECILE_RATIOS`)                      | Approximables depuis parts PIP                      | Ratio                |
| **Profil distributif complet** | Oui (`sptinc`, exploration + trapèzes)        | Non (3 ratios, pas de parts D1–D10)                    | Partiel (10 déciles PIP)                            | Courbe               |
| **Pauvreté**                   | —                                             | `PR_INC_DISP_50` (50 % médian national)                | `PIP_HEADCOUNT`, `SI.POV.DDAY` ($/j PPP)            | % pop.               |
| **Niveaux monétaires**         | `aptinc`, `tptinc` (monnaie locale constante) | `INC_DISP_MEDIAN` (monnaie nationale éq.)              | `mean`, `median` PIP (API, non exposés)             | Monnaie              |
| **Composition revenu**         | `apllin`, `apkkin` (travail / capital)        | Composantes SDMX non exposées                          | —                                                   | Profil               |
| **Carbone**                    | `lpfcar`                                      | —                                                      | —                                                   | Profil               |
| **Couverture pays**            | ~170 pays                                     | 38 pays OCDE                                           | Mondial                                             | —                    |


**Paramètres WID par défaut (presets) :** `age=992` (adultes 20+), `pop=j` (adultes equal-split) ; carbone : `age=999`, `pop=i`.

---

## Cas comparables — les 3 sources (WID + OCDE + WB)

Intersection géographique utile : **pays membres de l’OCDE** (~38), avec disponibilité variable par indicateur et par année.


| id                    | Objet                                 | WID                           | OECD                               | WB                                               | Overlay                                          | Tier                                          |
| --------------------- | ------------------------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------ | ------------------------------------------------ | --------------------------------------------- |
| `gini-marche-3way`    | Gini revenu, angle pré-impôt / marché | `gptinc`                      | `INC_MRKT_GINI`                    | `PIP_GINI`                                       | Oui — normaliser Gini 0–1 ; WDI ÷ 100 si utilisé | **Maintenant**                                |
| `gini-dispense-3way`  | Gini post-impôt / enquête             | `gptinc` *(écart documenté)*  | `INC_DISP_GINI`                    | `PIP_GINI`                                       | Oui — 0–1                                        | **Maintenant** *(WID en lecture qualitative)* |
| `ratios-deciles-3way` | Ratios P90/P10, P50/P10, P90/P50      | `tptinc` → calcul             | `INC_DISP_DECILE_RATIOS`           | Parts PIP → approx.                              | Partiel — ratios OCDE + WID ; WB indirect        | **Maintenant**                                |
| `extremes-3way`       | Concentration haut / bas              | `sptinc` (rangs ~5 % / ~95 %) | `PAL_INC_DISP`, `QR_INC_DISP`      | `SI.DST.FRST.10`, `SI.DST.10TH.10` ou D1/D10 PIP | Partiel — ratios et parts, pas même unité        | **Maintenant**                                |
| `evolution-3way`      | Série temporelle Gini, même pays      | `gptinc`                      | `INC_MRKT_GINI` ou `INC_DISP_GINI` | `PIP_GINI`                                       | Oui — Gini harmonisé                             | **Maintenant**                                |
| `profil-3way`         | Forme de la distribution (1 année)    | `sptinc`                      | Parts décile *(à implémenter)*     | Percentiles PIP *(à implémenter)*                | **Non** — granularités incompatibles             | Après enrichissement WB + OCDE                |
| `pauvrete-3way`       | Pauvreté                              | —                             | `PR_INC_DISP_50`                   | `PIP_HEADCOUNT`                                  | **Non** — concepts distincts                     | **Maintenant** *(parallèle seulement)*        |


---

## Cas comparables — deux à deux

### WID ↔ OECD


| id                           | Objet              | Indicateurs                                            | Overlay      | Tier           | Caveats                      |
| ---------------------------- | ------------------ | ------------------------------------------------------ | ------------ | -------------- | ---------------------------- |
| `gini-wid-oecd-marche`       | Gini pré-impôt     | `gptinc` / `INC_MRKT_GINI`                             | Oui          | Maintenant     | DINA vs enquête harmonisée   |
| `ratios-wid-oecd`            | Ratios déciles     | `tptinc` / bundle ratios dispo                         | Oui (ratios) | Maintenant     | WID pré-impôt vs OCDE dispo  |
| `ratios-wid-oecd-marche`     | Ratios marché      | `tptinc` / ratios marché *(à implémenter)*             | Oui          | Après OCDE     | Meilleure paire conceptuelle |
| `gini-patrimoine-wid-oecd`   | Gini patrimoine    | `ghweal` / WDD *(à implémenter)*                       | Oui          | Après OECD WDD | Pays OCDE uniquement         |
| `profil-patrimoine-wid-oecd` | Parts patrimoine   | `shweal` / WDD                                         | Non          | Après OECD WDD | Granularités différentes     |
| `composition-wid-oecd`       | Travail vs capital | `apllin`, `apkkin` / composantes IDD *(à implémenter)* | Non          | Après OCDE     | Pas d’équivalent WB          |


### WID ↔ World Bank


| id                 | Objet                  | Indicateurs                                       | Overlay | Tier                           | Caveats                                                  |
| ------------------ | ---------------------- | ------------------------------------------------- | ------- | ------------------------------ | -------------------------------------------------------- |
| `gini-wid-wb`      | Gini revenu            | `gptinc` / `PIP_GINI`                             | Oui     | Maintenant                     | Pré-impôt vs enquête ; revenu ou consommation selon pays |
| `profil-wid-wb`    | Profil distributif     | `sptinc` / `PIP_DECILE_SHARES` ou percentiles PIP | Non     | Maintenant / après PIP 100 pts | 127 vs 10 vs 100 centiles                                |
| `seuils-wid-wb`    | Seuils p10 / p50 / p90 | `tptinc` / quantiles PIP *(à implémenter)*        | Partiel | Après PIP percentiles          | Unités différentes                                       |
| `extrêmes-wid-wb`  | Top / bottom 10 %      | `sptinc` / D1+D10 PIP ou WDI                      | Non     | Maintenant                     | Parts vs ratios OCDE                                     |
| `evolution-wid-wb` | Série Gini             | `gptinc` / `PIP_GINI`                             | Oui     | Maintenant                     | —                                                        |


### OECD ↔ World Bank


| id                 | Objet                     | Indicateurs                                       | Overlay | Tier       | Caveats                       |
| ------------------ | ------------------------- | ------------------------------------------------- | ------- | ---------- | ----------------------------- |
| `gini-oecd-wb`     | Gini disponible / enquête | `INC_DISP_GINI` / `PIP_GINI`                      | Oui     | Maintenant | Pays OCDE ; welfare_type PIP  |
| `parts-oecd-wb`    | Parts par tranche         | Parts décile OCDE *(à implémenter)* / PIP déciles | Non     | Après OCDE | —                             |
| `pauvrete-oecd-wb` | Pauvreté                  | `PR_INC_DISP_50` / `PIP_HEADCOUNT`                | **Non** | Maintenant | Relative vs absolue ($/j PPP) |
| `ratios-oecd-wb`   | Ratios                    | Bundle OCDE / approx. PIP                         | Partiel | Maintenant | —                             |


### World Bank interne (diagnostic, pas vs WID)


| id                        | Objet          | Indicateurs                                 | Usage                               |
| ------------------------- | -------------- | ------------------------------------------- | ----------------------------------- |
| `wb-wdi-vs-pip-gini`      | Cohérence Gini | `SI.POV.GINI` / `PIP_GINI`                  | Même banque, deux pipelines         |
| `wb-quintiles-vs-deciles` | Granularité    | `WDI_QUINTILE_BUNDLE` / `PIP_DECILE_SHARES` | Effet d’agrégation 5 vs 10 tranches |


---

## Cas non comparables ou études séparées


| Situation                       | Sources                                             | Pourquoi                                            | Affichage recommandé                     |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| Pauvreté relative vs absolue    | OCDE `PR_INC_DISP_50` vs WB `PIP_HEADCOUNT`         | Seuil 50 % médian national vs $/j PPP international | Panneaux parallèles, **pas d’overlay**   |
| Niveaux en monnaie cross-source | WID `aptinc` vs OCDE `INC_DISP_MEDIAN` vs WB `mean` | Pré-impôt / post-impôt / $ PPP jour                 | Indice base 100 ou étude séparée         |
| Carbone ménage                  | WID `lpfcar` seul                                   | Objet A1 différent, pas dans OCDE/WB app            | WID only — hors page comparaison 3 voies |
| Patrimoine WB                   | WID vs WB                                           | PIP/WDI sans patrimoine ménage                      | WID seul ou WID + OECD WDD               |
| Profils à granularités mixtes   | 127 centiles vs 10 déciles                          | Pas d’homogénéisation sans table écrite             | Parallèle ou courbes séparées            |
| Pays hors OCDE                  | Slot OCDE vide                                      | OECD IDD = 38 pays                                  | Griser slot OCDE, autres actifs          |


---

## Fiches cas — tableau extensible

Dupliquer une ligne pour ajouter un nouveau cas. Les études de [structure-etudes.md](./structure-etudes.md) regroupent plusieurs fiches cas.


| id                     | sources                  | concept_WID         | concept_OECD                | concept_WB          | indicateurs (WID / OCDE / WB)           | overlay_possible | tier                 | caveats            |
| ---------------------- | ------------------------ | ------------------- | --------------------------- | ------------------- | --------------------------------------- | ---------------- | -------------------- | ------------------ |
| `gini-marche-3way`     | wid, oecd-idd, worldbank | Pré-impôt DINA      | Revenu marché METH2012      | PIP enquête         | `gptinc` / `INC_MRKT_GINI` / `PIP_GINI` | oui — Gini 0–1   | maintenant           | DINA vs enquêtes   |
| `gini-dispense-3way`   | wid, oecd-idd, worldbank | Pré-impôt *(réf.)*  | Revenu disponible           | PIP enquête         | `gptinc` / `INC_DISP_GINI` / `PIP_GINI` | oui — Gini 0–1   | maintenant           | WID pas post-impôt |
| `ratios-deciles-3way`  | wid, oecd-idd, worldbank | Seuils pré-impôt    | Ratios dispo                | Parts décile        | `tptinc` / bundle / D1–D10              | partiel          | maintenant           | Pré vs post-impôt  |
| `extremes-3way`        | wid, oecd-idd, worldbank | Parts extrêmes      | Palma, QSR                  | Top/bottom 10 %     | `sptinc` / `PAL`, `QR` / WDI ou PIP     | partiel          | maintenant           | Ratios ≠ parts     |
| `evolution-3way`       | wid, oecd-idd, worldbank | Gini pré-impôt      | Gini marché ou dispo        | Gini PIP            | `gptinc` / Gini OCDE / `PIP_GINI`       | oui              | maintenant           | Années communes    |
| `profil-3way`          | wid, oecd-idd, worldbank | Parts 127 pts       | Parts décile                | Percentiles 100 pts | `sptinc` / *(à venir)* / *(à venir)*    | non              | après enrichissement | Granularité        |
| `pauvrete-3way`        | oecd-idd, worldbank      | —                   | Pauvreté relative           | Pauvreté absolue    | — / `PR_INC_DISP_50` / `PIP_HEADCOUNT`  | non              | maintenant           | Concepts distincts |
| `patrimoine-wid-oecd`  | wid, oecd-idd            | Patrimoine net DINA | WDD *(à venir)*             | —                   | `ghweal`, `shweal` / WDD / —            | oui (Gini)       | après WDD            | OCDE only          |
| `composition-wid-oecd` | wid, oecd-idd            | Travail / capital   | Composantes IDD *(à venir)* | —                   | `apllin`, `apkkin` / — / —              | non              | après OCDE           | —                  |
| *(nouveau cas)*        |                          |                     |                             |                     |                                         |                  |                      |                    |


**Valeurs `tier` :** `maintenant` · `apres-enrichissement-wb` · `apres-enrichissement-oecd` · `apres-oecd-wdd` · `hors-scope`

**Valeurs `overlay_possible` :** `oui` · `non` · `partiel` (+ règle : `gini-0-1`, `ratio`, `indice-base-100`)

---

## Enrichissements futurs (OCDE / WB) — liés aux cas bloqués

Priorité décroissante :


| Priorité | Source | Ajout                                                                               | Cas débloqués                                   |
| -------- | ------ | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| P1       | WB     | Endpoint **percentiles PIP** (100 pts : `welfare_share`, `quantile`, `avg_welfare`) | `profil-3way`, `seuils-wid-wb`, `profil-wid-wb` |
| P1       | WB     | Exposer `mean`, `median`, `welfare_type`, `survey_acronym` dans l’UI                | Niveaux, métadonnées presets                    |
| P2       | OCDE   | **Parts décile** revenu disponible (bundle D1–D10)                                  | `profil-3way`, `parts-oecd-wb`                  |
| P2       | OCDE   | **Seuils** D1 / D5 / D9 en monnaie (`XDC_HH_EQ`)                                    | `seuils-wid-wb`, `ratios-wid-oecd-marche`       |
| P2       | OCDE   | Ratios **revenu marché** (`D9_1_INC_MRKT`, …)                                       | `ratios-wid-oecd-marche`, `gini-marche-3way`    |
| P3       | OCDE   | Nouvelle source **WDD** (Wealth Distribution Database)                              | `patrimoine-wid-oecd`                           |
| P3       | OCDE   | Composantes revenu (travail, capital, transferts)                                   | `composition-wid-oecd`                          |


WID : **aucun enrichissement prévu** — socle de référence stable.

---

## Annexe — champs PIP disponibles API, non exposés dans l’app

Requête type : `GET épip/v1/pip?country=FRA&format=csv&povline=3.65&year=2021`


| Colonne CSV                     | Description               | Intérêt comparaison                             |
| ------------------------------- | ------------------------- | ----------------------------------------------- |
| `gini`                          | Gini enquête (0–1)        | Déjà exposé (`PIP_GINI`)                        |
| `decile1` … `decile10`          | Parts par décile          | Déjà exposé (bundle)                            |
| `headcount`, `poverty_gap`      | Pauvreté internationale   | Déjà exposés                                    |
| `mean`                          | Welfare moyen ($ PPP/j)   | Niveau agrégé vs WID p50                        |
| `median`                        | Médiane enquête           | vs OCDE `INC_DISP_MEDIAN` *(concept différent)* |
| `mld`                           | Mean log deviation        | Indicateur inégalité alternatif                 |
| `polarization`                  | Polarisation              | Extension future                                |
| `welfare_type`                  | `income` ou `consumption` | **Preset obligatoire** à afficher               |
| `survey_acronym`, `survey_year` | Enquête source            | Reproductibilité (A4)                           |
| `reporting_level`               | national / urban / rural  | Filtre preset futur                             |


Percentiles 100 points : dataset **PIP Percentiles** (API / CSV séparé) — non branché dans l’app.

---

[Structure des études](./structure-etudes.md) · [C3 — Interactions](../C3-interactions.md) · [A4 — Caractérisation](../../A-raw-data/A4-caracterisation.md)