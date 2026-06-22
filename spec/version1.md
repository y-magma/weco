# Version 1 — Périmètre et spécification

*Première version livrable, dérivée de la section « Version 1 » de [plan.md](./plan.md). Réécriture intégrant les corrections techniques WID.*

---

## Périmètre

- **Source unique : WID.world**.
- Données structurées mais nécessitant une **mise en forme** (tri, filtres) avant traçage — pas « clean » au sens prêt-à-tracer.
- Pas d'autre source, pas de modèles économiques (E), pas de régression auto.

---

/!\ Il faudrait mettre différentes pages web pour chaque type de graphes. /!\ 



## Schéma brut WID

Chaque enregistrement porte **7 champs** :


| Champ        | Rôle                   | Remarque                                   |
| ------------ | ---------------------- | ------------------------------------------ |
| `country`    | Filtre                 | Code pays                                  |
| `variable`   | Filtre + sémantique    | Préfixe = type de mesure (voir ci-dessous) |
| `percentile` | **Axe** (ou jointure)  | 127 g-percentiles à **trier par rang**     |
| `year`       | Filtre                 | Année choisie par l'utilisateur            |
| `value`      | **Axe**                | Valeur mesurée                             |
| `age`        | **Filtre obligatoire** | Ex. `992` = adultes 20+                    |
| `pop`        | **Filtre obligatoire** | Ex. `j` = equal-split, `i` = individus     |


> **Attention :** `age` et `pop` ne sont **pas** des axes d'affichage. Si on ne les fixe pas, plusieurs séries se superposent → points en double par percentile, graphe faux.

---

## Sémantique des préfixes de `variable`


| Préfixe | Signification                                                         | Exemple patrimoine | Exemple revenu |
| ------- | --------------------------------------------------------------------- | ------------------ | -------------- |
| `a…`    | **Average** — valeur moyenne dans la tranche                          | `ahweal`           | `aptinc`       |
| `t…`    | **Threshold** — seuil d'entrée dans le percentile (fonction quantile) | `thweal`           | `tptinc`       |


Le seuil t_p est par définition la **fonction quantile** : t_p = F^{-1}(p).

---

## Les 127 g-percentiles

Notation WID, à **trier par rang numérique parsé** (un tri alphabétique casse, ex. `p99.9p99.91` vs `p100`) :

```text
p0p1, p1p2, …, p98p99                 (tranches « larges » 0–99 %)
p99p99.1, …, p99.8p99.9               (zoom top 1 %)
p99.9p99.91, …, p99.98p99.99          (zoom top 0,1 %)
p99.99p99.991, …, p99.999p100         (zoom top 0,01 %)
```

> Ces g-percentiles **sont** déjà le « zoom multi-niveaux » sur le haut de distribution évoqué dans les versions suivantes.

---

## Graphes demandés (à `country / year / age / pop` fixés)


| #   | Graphe                            | Abscisse                                   | Ordonnée                                   | Notes                                                                         |
| --- | --------------------------------- | ------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | **Choix de l'année**              | —                                          | —                                          | `year` parmi les valeurs disponibles                                          |
| 2   | **Profil moyen** (bâtons / nuage) | 127 `percentile` ordonnés                  | `value` d'une variable `a…` (ex. `ahweal`) | Patrimoine/revenu moyen par tranche                                           |
| 3   | **CDF empirique** (axes inversés) | `value` d'une variable `t…` (ex. `thweal`) | `percentile`                               | Réciproque **vraie uniquement** pour une variable seuil `t`                   |
| 4   | **Bascule lin / log**             | par axe                                    | par axe                                    | Garde-fou si `value ≤ 0` (patrimoine négatif) ; mode queue haute `log(1 − p)` |
| 5   | **Multi-panneaux**                | —                                          | —                                          | Choisir le nombre de graphes en parallèle                                     |
| 6   | **Nuage 2 variables**             | `value` var1                               | `value` var2                               | Un point = un `percentile` ; même `age/pop`                                   |


---

## Transformations nécessaires (couche dérivée B4)


| Transformation          | Détail                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Tri des percentiles** | Parser le rang (borne basse) pour ordonner les 127 tranches                         |
| **Filtrage age/pop**    | Fixer une combinaison unique par série ; listes restreintes aux combos disponibles (API WID) ; défauts par groupe de variable |
| **Échange d'axes**      | Permuter les tableaux X/Y — c'est la « réciproque » ; **pas de librairie dédiée**   |
| **Valeurs manquantes**  | Trou explicite, pas d'interpolation cachée ([A3](./A-raw-data/A3-forme-du-brut.md)) |


> La « réciproque d'un histogramme » = échange des données des deux axes. Sur une variable `**t` (seuil)** elle donne une **vraie CDF** (monotone). Sur une variable `**a` (moyenne)** ce n'est qu'une **transposition visuelle**, pas une réciproque mathématique.

---

## Bibliothèque

- **ECharts** (déjà dans la stack) couvre V1 : nuage, bâtons, axes `log` / `value`, multi-panneaux (`grid`), permutation d'axes.
- Transformations (tri, échange d'axes, ECDF) = **code maison** côté dérivées ; `d3-array` optionnel pour helpers quantile.
- Régression / densité (versions ultérieures) : `simple-statistics`.

---

## Points de vigilance

1. `**age` / `pop`** : filtres obligatoires, sinon données mélangées.
2. **Tri des g-percentiles** : par rang, jamais alphabétique.
3. **Log + valeurs ≤ 0** : patrimoine négatif au bas de distribution → garde-fou (`symlog`, filtre, ou log réservé à la queue haute).
4. **Réciproque** : mathématiquement valide seulement pour les variables seuil `t`.
5. **Nuage 2 variables** : clé de jointure = `percentile` ; variables comparables (même `age/pop`).

---

## Correspondance spec


| Élément V1                                 | Bloc spec                                                     |
| ------------------------------------------ | ------------------------------------------------------------- |
| Schéma brut 7 champs, age/pop, percentiles | [A3](./A-raw-data/A3-forme-du-brut.md) (à compléter pour WID) |
| Tri, filtres, échange d'axes, CDF          | [B4](./B-clean-data/B4-transformations-derivees.md)           |
| Bâtons, nuage, CDF                         | [C1](./C-visualizations/C1-graphiques-et-echelles.md)         |
| Lin/log, multi-panneaux, sélecteur axes    | [C3](./C-visualizations/C3-interactions.md)                   |


---

[plan.md](./plan.md) · [README](./README.md) · [critique](./critique-plan-et-spec.md)