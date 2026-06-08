# Specification du type de visualisation dans l'application Web

Boite à outils pour relier des données et visuels (de richesse)  et théories économiques

Dans cette visualisation j'aurai besoin de :

## Au niveau des données :

- pouvoir extraire des données de plusieurs sources différentes (le WID.world, ...)
- faire des transformations sur ces données afin de les rendre exploitable (tracer de graphique)
- avoir la possibilité de rajouter de nouvelles sources de données

## Au niveau des graphes :

- avoir un graphe avec des variables en abscisse et en ordonnée que je peux modifier de manière indépendante (ces variables seront issues des clean data obtenu avec ou sans "transformations" en plus de l'échelle de temps)
- pouvoir changer le type d'échelle du graphe : passer en échelle log ou linéaire sur chaque axe de manière indépendante.
- zoomer sur le graphe et avoir un niveau de granularité que je peux regler (comme du zoom infini)
- afficher les données avec différents types de graphes : histogramme, diagramme en batons, nuage de point, courbe (courbe intégrale d'un graphe donnée), carte de chaleur.
- (me reserver la possibilité de rajouter d'autre type de graphes)
- avoir la possibilité de superposer 2 différents types de graphes notamment histogramme et nuage de point / courbe
- avoir la possibilité de mettre plusieurs graphes en parallèle

## Pour l'analyse des graphes :

- avoir la possibilité de faire une regression linéaire sur les données dans un intervalle d'abscisse à choisir ou via un algo qui déterminera le meilleur endroit où faire cette regression. Et tracer la droite de regression
- pouvoir superposer une densité d'une loi de proba connue (paramètre à régler) à un graphe obtenu à partir des données.


# Versions 
## Version 1

- Dans cette version nous allons nous contenter des données du WID.world.
- Ces données sont déjà clean 
- Elles nécessitent une transformation (Question ? Est-ce qu'il existe une librairie ou des fonctions qui permettent de tracer la réciproque d'un histogramme qui trace le patrimoine en fonction de des 127 centiles du WID.world)
- Les données sont représentées par 7 paramètres : country, variable, percentile, year, value, age, pop 

- Sur les graphes je veux pouvoir faire :
    - pouvoir choisir une année : les années sont celles du paramètre `year`
    - un nuage de point/histogramme : avec en ordonnées les valeurs `value` associées à un paramètre de `variable` qui commence par 'a' et en abscisse les 127 `percentile` successifs (p0p1, ..., p98p99 ; p99p99.1, ...,p99.8p99.9 ; p99.9p99.91, ...,p99.98p99.99 ; p99.99p99.991, ..., p99.999p100).
    - Inverser les deux axes précédents mais cette fois avoir en abscisse les valeurs `value` associées à un paramètre de `varaible` qui commence par 't'
    - passer en échelle lin ou log sur les abscisses et ordonnées
    - selectionner le nombre de graphique que je veux afficher en parallèle
    - un nuage de point entre 2 variables de `variable`.

- en ce qui concerne la bibliothèque je te laisse me proposer et si besoin d'implémentation propose moi aussi.


# etude 1

