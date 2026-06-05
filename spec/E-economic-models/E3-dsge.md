# E3 — DSGE (équilibre général stochastique)

*Modèles macro dynamiques fondés sur l’optimisation d’agents et l’équilibre sur les marchés — complément de lecture pour [E1](./E1-econophysique.md) (micro empirique) et [E2](./E2-sfc.md) (comptabilité sectorielle).*

---

## Objet

Un DSGE exprime des **relations structurelles** entre variables agrégées (production, inflation, taux, emploi, parfois inégalité simplifiée) à partir de comportements d’agents et de contraintes. Il sert surtout à :

- formaliser un mécanisme économique (transmission d’une politique, choc technologique, choc de prix…) ;
- **simuler** des trajectoires d’équilibre après un choc ;
- comparer des **moments** ou corrélations du modèle à des faits stylisés empiriques.

---

## Ce qu’on peut en faire ici

| Usage | Données entrée ([B](../B-clean-data/)) | Sortie / lecture |
|-------|----------------------------------------|------------------|
| **Fiche de lecture** | — | Schéma blocs (ménages, firmes, banque centrale, règle fiscale) ; équations clés en langage humain |
| **Tableau moments modèle ↔ données** | **Série** (PIB, inflation, taux, chômage…) ; **Distribution** (Gini, parts de revenu si disponibles) | Écart modèle / empirique ; discussion des hypothèses |
| **Scénario de choc** | Calibration sur séries **Série** ; conditions initiales | Impulse responses (agrégats) — outil externe (Dynare, gEcon…) |
| **Comparaison de cadres** | Mêmes indicateurs que [E2](./E2-sfc.md) | DSGE (optimisation + équilibre) vs SFC (identités comptables) vs lecture purement empirique [C](../C-visualizations/) |
| **Pont vers l’inégalité** | **Distribution**, Lorenz ([C1](../C-visualizations/C1-graphiques-et-echelles.md)) | Modèles **HANK** ou extensions avec ménages hétérogènes : matcher parts de revenu / patrimoine par tranche ([D1](../D-statistics/D1-analyses.md)) |
| **Validation qualitative** | Séries caractérisées ([A4](../A-raw-data/A4-caracterisation.md)) | Le modèle reproduit-il le signe et l’ordre de grandeur des faits ciblés ? |

---

## Lien avec la chaîne A → B → C → D

```text
Séries macro (B1 Série) ──► cibles de calibration / comparaison moments
Distributions (B1 Distribution) ──► cibles HANK ou extensions inégalité
Simulations DSGE ──► séries simulées (export) ──► graphiques C (courbes)
Moments simulés vs empiriques ──► analyses D (corrélation, écart)
```

Les graphiques du dashboard peuvent superposer une **série empirique** et une **série simulée** (même format **Série** B1) si le modèle est exporté.

---

## Limites (propres au cadre, pas au projet)

| Limite | Conséquence |
|--------|-------------|
| DSGE « agrégé » standard | Peu ou pas de détail par centile ; distributions empiriques fines = lecture [E1](./E1-econophysique.md), pas le cœur du modèle |
| Calibration | Nombreuses hypothèses (forme utilité, rigidités, règles de politique) — à documenter |
| Inégalité distributive | Nécessite modèles enrichis (HANK, TANK) pour exploiter **Distribution** / **Tableau** |
| Données | Chaque série injectée doit être **caractérisée** (concept, unité, vintage) — [A4](../A-raw-data/A4-caracterisation.md) |

---

## Livrables possibles

1. **Fiche DSGE** : blocs, variables d’état, chocs, paramètres interprétables.
2. **Matrice moments** : empirique ([B3](../B-clean-data/B3-clean-vers-unified.md)) vs modèle.
3. **Graphiques** : impulse responses ou comparaison série simulée / observée ([C](../C-visualizations/)).
4. **Note comparative** : DSGE vs SFC ([E2](./E2-sfc.md)) sur une même question macro (ex. choc budgétaire).

---

[E1](./E1-econophysique.md) · [E2](./E2-sfc.md)
