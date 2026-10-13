# Vérification du jeu

## Parcours joués dans l’interface

- Création de carrière et choix d’un club en Premier League et en Championship.
- Avance du calendrier au travers de matchs amicaux et d’événements de marché.
- Nouvelle carrière sur une origine locale isolée, quatre amicaux déroulés, puis match de championnat joué en direct avec décision de mi-temps; Manchester City a gagné 1–0 contre Sunderland, et le classement ainsi que l’auto-sauvegarde ont progressé à 1/38 journée.
- Deux matchs de championnat disputés jusqu’au bout : Manchester City–Sunderland (2–0) et Leicester–Sheffield Wednesday (0–1).
- Achat d’un joueur, affichage de son contrat, classement et progression de la saison après match.
- Recherche de club testée avec « liverpool »; changement de championnat et sélection de clubs vérifiés.
- Premier League affichée avec 20 clubs et 38 journées; Championship avec 24 clubs et 46 journées.
- Aucune erreur console observée pendant ces parcours.

## Écrans et tailles testés

| Taille de fenêtre | Résultat observé |
| --- | --- |
| 1920 × 940 | Menu sans défilement de page; les 20 clubs de Premier League tiennent dans la grille sur ce format. |
| 1024 × 768 | Écrans de carrière tiennent dans la fenêtre; navigation adaptée en barre horizontale. |
| 390 × 844 | Menu et carrière tiennent dans la fenêtre; contenu long défilable dans son panneau, navigation et commandes de jeu restent accessibles. |
| 320 × 568 | Menu utilisable; sélection de club dans une zone dédiée à défilement intérieur. |
| 844 × 390 | Mode paysage compact testé pour le menu et un écran de carrière. |

Le défilement restant est limité aux listes et panneaux qui peuvent contenir plus d’éléments que la fenêtre, au lieu de faire défiler toute la page.

## Parcours longs et limites de la preuve

- La simulation automatisée couvre dix saisons de sauvegarde/rechargement, les 38 journées de Premier League et les 46 de Championship, les fenêtres de transferts, les effectifs jouables, les contrats et l’identité unique des joueurs prêtés. Un test séparé vérifie que la division secondaire finit sa saison même quand le calendrier du manager est plus court.
- Des tests ciblés vérifient les changements de club, le transfert de l’effectif sortant au monde simulé, les montées/descentes entre divisions et les contrats conservés au changement de saison. Ces simulations accélérées révèlent des régressions de logique; elles ne remplacent pas des saisons manuelles.
- Les matchs et la progression de calendrier ont été testés en direct dans l’interface. Aucun test humain continu de 1 h, 3 h, 10 h ou 30 h n’a été réalisé. On ne peut donc pas garantir honnêtement que la boucle reste captivante après 10 h ou 30 h : cela nécessite des sessions humaines étalées sur plusieurs jours et des retours de joueurs.
- Évaluation de rythme : 10 minutes suffisent à créer une carrière et jouer un ou plusieurs matchs; une heure permet d’explorer une séquence de championnat et sa gestion; trois heures devraient permettre d’évaluer une première saison selon la vitesse de jeu. Ces durées sont des estimations de parcours, pas des mesures chronométrées. À 10–30 h, le jeu propose une progression de carrière, du recrutement, des coupes, des objectifs, une académie, des infrastructures et des changements de poste. La gestion a plusieurs leviers, mais les blessures, les statistiques individuelles et la vie des clubs concurrents restent plus simples que dans une simulation exhaustive; la variété après plusieurs dizaines d’heures reste à éprouver.
- Les matchs de championnat utilisent le moteur jouable; le tableau de barrage de promotion ajouté est simulé automatiquement selon la force des équipes et le terrain, pas joué par l’utilisateur. Le prototype est cohérent pour démarrer plusieurs carrières, mais pas complet au sens d’un gestionnaire commercial exhaustif.

## Défauts corrigés pendant l’audit

- Composition des clubs de Premier League et de Championship 2025–2026 incorrecte; listes et nombres de journées corrigés.
- Notes de joueurs pouvant dépasser 99; les notes affichées et générées sont désormais plafonnées à 99.
- Identifiants de contrats instables lors de transferts; migration des anciennes sauvegardes et stabilité corrigées.
- Défaites en coupe qui affectaient à tort certains indicateurs du conseil; résultats de coupe séparés des évaluations de championnat.
- Durée des saisons de ligues à 22 et 24 clubs calculée correctement (42 et 46 journées).
- Mise en page adaptative ajoutée pour remplir la fenêtre et garder la navigation, les commandes et les informations principales visibles.
- Promotions et relégations : échange des clubs dans les divisions du calendrier suivant, en gardant le club déplacé unique dans le monde IA.
- Changement d’emploi : reprise de l’effectif du club visé, conservation du profil de gestion propre à chaque club, et bascule de l’ancien club vers la simulation IA sans doublon.
- Les barrages de promotion ne reposent plus sur un pile-ou-face : résultats déterministes influencés par les effectifs et le classement.
- Les contrats encore actifs gardent leur durée au renouvellement de saison; seuls les contrats échus ou absents reçoivent une nouvelle durée.

## Résultat des tests automatisés

- `node --test tests/*.test.cjs tests/long-career-stress.cjs` : 11 tests réussis, 0 échec lors du dernier passage.
- Vérifications couvertes : dix saisons, calendriers de divisions différentes, prêts, contrats, barrages, montées/descentes, changement de club et sauvegarde/rechargement JSON.
