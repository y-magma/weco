# A3 — Formats bruts des bases

*Quels **types et formats** de données chaque base fournit-elle **telle quelle**, avant normalisation ?*

---

## Statut de ce document

**À compléter plus tard.** Les sources candidates sont listées dans [A2 — Catalogue](./A2-sources/catalogue-sources.md).

---

## Idée directrice

Chaque producteur livre le brut sous une **enveloppe technique** (JSON, CSV, SDMX, fichiers statistiques, micro enclave) et une **sémantique métier** (codes variable, libellés, concepts fiscal, tranches de population). A3 doit répondre à :

1. **À quoi ressemble un enregistrement** tel que la base le donne (pas encore « clean ») ?
2. **Quelles dimensions** sont toujours présentes (pays, année, variable, valeur, tranche…) et lesquelles sont optionnelles ?
3. **Quelles conventions** sont propres à la base (notation des centiles, pré/post impôt, devise, vintage) ?

---

## Sémantique cible (indépendante du format)

Quelle que soit la base retenue, on doit pouvoir **interpréter** au minimum les notions suivantes — même si les noms de colonnes ou de champs diffèrent :


| Notion                       | Contenu à pouvoir lire                                 | Exemple lisible                                            |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| **Observation nationale**    | Pays, indicateur, année, valeur                        | France, part des 10 % les plus riches, 2020 → 32,5 %       |
| **Observation distributive** | Pays, indicateur, année, tranche de population, valeur | France, patrimoine moyen, 2024, tranche 50–51 % → 98 500 € |
| **Métadonnées de capture**   | Date ou version du téléchargement (*vintage*)          | « Export du 2024-06-01 »                                   |


Les tranches de population pourront suivre des notations différentes selon la base (ex. centiles WID `p50p51`, déciles OECD, quintiles Eurostat) : **chaque fiche source A3 devra expliciter la notation utilisée**.

---

## Ce qui sera documenté par base (modèle à remplir)

Pour chaque source **choisie**, une fiche du type :


| Rubrique                   | Question à trancher                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------- |
| **Support**                | API (JSON, SDMX…), fichier CSV/Excel/Stata, micro LISSY, autre                        |
| **Unité d’enregistrement** | Une ligne = pays×année×indicateur ? micro ménage ? flux comptable ?                   |
| **Champs livrés**          | Liste des colonnes / clés JSON et leur sens                                           |
| **Granularité**            | Macro pays, décile, centile, micro (et restrictions d’accès)                          |
| **Unités et concepts**     | %, EUR, PPP, pré-impôt / post-impôt, etc. **tels que fournis**                        |
| **Identifiants**           | Codes pays, codes variable, version de la méthodologie                                |
| **Mises à jour**           | Fréquence, révisions, présence d’un vintage ou d’une date de extract                  |
| **Équivalence des modes**  | Même sémantique API ↔ export fichier ? oui / non / partiel                            |
| **Exemple**                | 1–3 enregistrements annotés en langage humain (pas obligatoirement un dump technique) |


*Référence des bases candidates : [catalogue A2](./A2-sources/catalogue-sources.md).*

---

## Exigences transverses (déjà valides, quelle que soit la base)

Ces règles s’appliquent **après lecture** du brut, quel que soit le format d’origine ; elles guideront aussi le bloc B :


| Situation                     | Comportement attendu                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| Valeur absente                | Pas de chiffre inventé ; trou explicite                                |
| Année sans observation        | Lacune visible, pas d’interpolation cachée                             |
| Révision de la base           | Nouvelle capture datée ; ancienne reste identifiable                   |
| Tranche ou code non reconnu   | Rejet explicite, pas d’affichage silencieux                            |
| Même indicateur, deux formats | Une seule sémantique cible documentée en A3 pour chaque source retenue |


## Contenu détaillé par source

*Section réservée — à remplir lors du verrouillage des bases.*


