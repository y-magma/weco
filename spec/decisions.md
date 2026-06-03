# Décisions de projet (clarifications verrouillées)

Document de référence pour les sections A–E. Toute évolution majeure doit mettre à jour ce fichier.

---

## 1. Objectif produit

**Décision :** Application web publique de démonstration et d’exploration (dashboard Nuxt), complétée par des scripts Python offline pour prototypage (zoom fractal, régressions).

**Hors scope MVP :** génération PDF automatique, notebook Jupyter intégré.

---

## 2. MVP vs vision

| Élément | MVP (phase 1) | Vision (phase 2+) |
|---------|---------------|-------------------|
| Pays | FR, US (prioritaires) + 6 autres (GB, DE, BR, IN, ZA, CN) | Extension via API `listCountries` |
| Années | 1980–2023 | Aligné sur disponibilité WID par indicateur |
| Graphiques | Série temporelle, barres percentiles, scatter pays×année | Lorenz, courbe revenu/richesse log+lin, zoom fractal, heatmap |
| Indicateurs | Parts revenu (sptinc, sptop1), Gini, patrimoine moyen (ahwbus) | Types de revenu/capital détaillés, CO₂/énergie |
| Sources | WID.world (API + échantillon offline) | WIR, Eurostat, OCDE, fichiers sectoriels SFC |

---

## 3. Source de vérité des données

**Décision :** Double mode avec règle explicite.

1. **Développement / démo sans clé :** données d’échantillon (`sampleData.ts`, `metadata.sample: true`).
2. **Production / recherche :** API WID live si `NUXT_PUBLIC_WID_API_KEY` est définie.
3. **Phase 2 :** snapshots CSV versionnés dans le dépôt (`data/raw/wid/{date}/`) pour reproductibilité et CI ; l’API live reste option pour rafraîchissement.

**Règle de bascule :** si l’API échoue ou renvoie vide → afficher l’erreur et proposer l’échantillon (pas de mélange silencieux).

---

## 4. Langage du pipeline clean

| Couche | Langage | Rôle |
|--------|---------|------|
| Webapp (MVP) | TypeScript | Ingestion WID, validation, mapping vers types clean (`widSource`, futur `widRawToClean`) |
| Exploration | Python | Prototypes (`zoom_fractal.py`), stats lourdes, export figures |
| Contrat d’échange | JSON | Fichiers clean versionnés ; Parquet en phase 2 si volume |

**Justification :** cohérence avec Nuxt/ECharts ; Python pour ce qui est déjà prototypé hors webapp.

---

## 5. Dette et stock-flow consistency (SFC)

**Phase 1 :** documentation et schémas conceptuels uniquement ([E-economic-models.md](./E-economic-models.md)). Pas de solveur SFC.

**Phase 2 :** visualisation pédagogique d’une balance sectorielle minimale (État / ménages / entreprises / reste du monde).

**Question dette publique :** traitée comme **hypothèse de lecture** à documenter (État comme secteur endetté vs « banque centrale + secteur privé ») — pas tranchée quantitativement en MVP.

---

## 6. « Stress » et hypothèses

**Décision :** `stress_index` reste **hors MVP réel** — marqué `sample: true`, retiré des conclusions du rapport.

**MVP hypothèses :** corrélations et régressions sur indicateurs WID réels (ex. sptinc vs ghini, capital vs patrimoine quand codes disponibles).

---

## 7. Positionnement (valeur ajoutée)

Par rapport à la littérature existante (50+ chercheurs sur l’inégalité) :

1. **Pipeline Raw→Clean documenté et reproductible** (spec B + tests fixtures).
2. **UX zoomable** : vision globale + zoom fractal sur percentiles WID (inspiré `zoom_fractal.py`).
3. **Synthèse multi-indicateurs** dans un même dashboard avec traçabilité source.
4. **Pont pédagogique** vers SFC / éconophysique sans prétendre rivaliser avec des modèles calibrés.

---

## 8. Livrables académiques

| Livrable | Emplacement |
|----------|-------------|
| Spec technique | `samuel-gscop-26/spec/` (ce dépôt) |
| Fiches de lecture / notes permanentes | Hors repo (Zettelkasten personnel) ; concepts clés **résumés** dans le rapport de stage |
| Code webapp + scripts | Dépôt `samuel-gscop-26` + racine `Stage_gscop/` pour prototypes Python |

---

## 9. Hébergement

**Décision :** site **statique** via `nuxt generate` (GitHub Pages, Netlify, etc.).

**Clé API WID :** variable d’environnement côté build ou client public (`NUXT_PUBLIC_*`) — acceptable pour démo stage ; **phase 2 :** proxy Nitro si exposition publique devient problématique.

Pas de backend dédié en MVP.

---

## 10. Qualité et maintenance des données

| Aspect | MVP | Cible |
|--------|-----|-------|
| Tests | Fixtures JSON WID anonymisées ; tests unitaires convertisseurs | Golden files pipeline |
| Typecheck | `nuxi typecheck` sur webapp | CI GitHub Actions |
| Données | Revue manuelle à chaque release majeure WID | Script de refresh + date `vintage` en métadonnées |
| Visuels | Revue manuelle dashboard | Tests snapshot optionnels phase 2 |

---

## Révisions

| Date | Changement |
|------|------------|
| 2026-06 | Création initiale (10 décisions) |
