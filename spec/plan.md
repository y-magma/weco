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

