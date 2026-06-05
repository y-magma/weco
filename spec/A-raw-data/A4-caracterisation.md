# A4 — Caractérisation des données

*Décrire **explicitement** ce que représente chaque série ou jeu de données — concept, périmètre, granularité — sans trancher entre sources.*

Catalogue des bases : [A2](./A2-sources/catalogue-sources.md). Forme brute : [A3](./A3-forme-du-brut.md). Besoins d'observation : [A1](./A1-ce-qu-on-veut-observer.md).

---

## Axes de caractérisation

Chaque donnée (brute, clean ou unified) doit pouvoir être lue selon ces dimensions :

| Axe | Exemples de valeurs |
|-----|---------------------|
| **Source** | WID, SILC, FMI GFS… + vintage / date d'export |
| **Objet** (lien A1) | Revenu, patrimoine, budget public, énergie… |
| **Concept** | Pré-impôt / post-impôt ; patrimoine net / brut ; revenu disponible |
| **Périmètre** | Pays, années, population couverte (ménages, secteur sociétés…) |
| **Granularité** | Macro pays · décile · centile · micro unitaire |
| **Stock / flux** | Stock · flux · mixte |
| **Unité** | %, EUR, USD PPP, tCO₂… |
| **Type** | Série officielle · enquête micro · rapport · liste nommée |
| **Limites** | Pays sous-représentés, révisions, trou temporel, accès restreint |

Ces champs alimentent les métadonnées [B1](../B-clean-data/B1-formats-clean.md) (optionnels) et l'affichage [C](../C-visualizations/).

---

## Règles

1. **Nommer la source** et le **concept** sur toute série affichée ou exportée.
2. **Ne pas fusionner** silencieusement des concepts distincts (pré- vs post-impôt, tranches non comparables) : les caractériser côte à côte.
3. **Documenter la notation** des tranches (centile WID, quintile Eurostat, décile OECD…) — pas d'homogénéisation sans table de correspondance écrite.
4. **Distinguer** distribution agrégée (centiles, parts) et listes d'individus nommés (Forbes, UBS) : types différents, pas la même lecture statistique.
5. **Tracer le vintage** : snapshot daté vs consultation live (date de capture obligatoire pour la reproductibilité).
6. Le convertisseur [B2](../B-clean-data/B2-brut-vers-clean.md) **renseigne** la caractérisation ; il ne **choisit pas** entre deux sources pour le même indicateur.
7. L'unificateur [B3](../B-clean-data/B3-clean-vers-unified.md) **aligne la structure** ; les différences de concept restent **visibles** dans les métadonnées.

---

## Cas limites (comment caractériser)

| Situation | Caractérisation attendue |
|-----------|--------------------------|
| Même indicateur, WID vs SILC | Deux concepts explicites (ex. pré-tax vs disponible) ; pas de moyenne unique |
| Quintile (HBS) vs centile (WID) | Notations et granularités distinctes ; correspondance documentée si jointure |
| Listes milliardaires vs centiles WID | Type « liste nommée » vs « distribution agrégée » |
| Carbone territorial vs inégalité ménage | Objets A1 différents ; ne pas présenter comme même série |
| Base sans API | Acceptable si snapshot versionné ([acces-api](./A2-sources/acces-api.md)) ; vintage obligatoire |

---

[A2](./A2-sources/) · [B — Clean Data](../B-clean-data/)
