# Documenter d'un point de vue conceptuel l'architecture du projet

## L'architecture globale (déjà implémentée)

(extraction des données -> ... -> affichage des graphiques)

Choix d'une architecture logicielle en couches telle que :

- **La couche graphique** qui gère l'interaction homme machine notamment avec l'affichage des graphiques et la manipulation de ceux-ci via un site web.
- **La couche application** qui gère la communication entre la couche graphique et la couche domaine.
- **La couche domaine** qui récupère de la couche infrastucture les bonnes données demandées par la couche graphique.
- **La couche infrastructure** qui récupère les données brutes de différentes sources via API ou fichiers csv passé à l'application depuis le site web.

Elle permettra un developpement plus modulaire de l'application en assurant sa maintenabilité.

## Focus sur *la couche graphique*

*Je voudrais créer une nouvelle page sur le site pour porter les contraintes ci-dessous*

Cette nouvelle page s'appelera "Exploration et analyse" et sera un "cas d'étude".

Pour une exploration des données à tous niveaux et avec différentes méthodes, il nous faut garantir un certain ordre de sélection et d'analyse des données.

### Sur la page :

1- Sélectionner la source de données désirée (pour le moment on se limitera au WID.world) : donc avoir une section qui permettrait de faire cette sélection ou d'importer un fichier csv.

2- Sélectionner la donnée qu'on voudrait afficher notamment des pour le WID.world via le choix du pays, de l'année, de la population cible, de l'age.

3- Faire le choix du type de graphique qu'on voudrait : 2 axes (avec l'un des axes qui est obligatoirement les parts de population), un sankey, etc.

4- Faire des choix de transfo d'axes : passer un log ou pas sur les 2 axes ou pas, appliquer une fonction particulière sur les axes ou pas, etc.

5- Pour un graphique donné afficher l'intégrale ou la densité

6- Choisir des graphiques soit en nuage de points, en batons ou en courbe continue ou une superposition de 2 ou plusieurs de ces graphiques.

7- Choisir le découpage des axes pour différents niveaux d'observation et d'analyse 

8- Faire des approximations sur ces intervalles en affichant soit des histogrammes, trapèses, des densités de loi connues (manuellement ou automatiquement), des stats/optim

Tous cela avec des "?" pour expliquer certain paramètre et clarifier l'usage de l'outil.

**N.B.** : ce n'est un ordre de sélection (on pourra les modifier indépendamment) c'est juste qu'il faudrait que des sections claires apparaissent.

### Dans le détail du fonctionnement :

1- Faciliter le zoom en utilisant le zoom natif de EChart, activer la fonction d'écoute. Càd avoir un zoom centralisé pour toute cette partie.

1.bis- En plus du zoom centralisé rajouter des fonctions particulières pour le drill down, etc.

2- Rendre paramétrique le plus de choses. Par exemple les noms des axes, leurs unités

3- Pour les données du WID.world (catalogue courant : 5 variables du panneau — `ahweal`, `thweal`, `aptinc`, `tptinc`, `lpfcar`), les combinaisons **pays / année / âge / population** disponibles sont interrogées via l’API (`countries-available-variables`, `countries-variables`) et **restreignent automatiquement** les listes de sélection.

   - **Changement de variable** : initialiser les défauts du groupe ; recharger la plage d'années ; si un paramètre (année, âge, population) est ajusté, toast éphémère + pastille « ! » sous le champ concernée (survol pour revoir le message).
   - **Paramètres avancés (âge, population)** : modifiables librement par l’utilisateur, dans la plage filtrée — les défauts ne verrouillent pas les sélecteurs.
   - **Changement de pays** : conserver âge/pop/année si encore valides ; ajuster uniquement ce qui sort de la plage (*clamp*).
   - **Année** : parmi les valeurs disponibles pour la combo courante ; bascule vers la plus récente si l’année choisie n’existe plus.
   - **Prefetch** : métadonnées du catalogue préchargées au montage des pages panneau/grille ; cache longue durée côté infrastructure.

4- Il faudrait que le changement d'un paramètre ne réactualise pas tous l'affichage. Que les modifications se fassent tout en gardant les paramétrages qui n'ont été changés.

