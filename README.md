# 🚀 FermeGPU Dashboard

Bienvenue sur le projet FermeGPU ! Il s'agit d'une application web Angular moderne conçue pour surveiller et gérer les ressources (GPU, CPU, Mémoire) au sein d'un ou plusieurs clusters de calcul.

L'application offre une interface claire et réactive pour visualiser l'état des nœuds et gérer les réservations de ressources pour différentes applications et namespaces.

## ✨ Fonctionnalités Principales

Ce projet utilise une architecture moderne basée sur les **Signaux Angular** et les **Composants Standalone**.

* **🖥️ Dashboard Principal** : Une vue d'ensemble de tous les clusters, affichant l'utilisation globale des GPU, de la mémoire et des CPU à l'aide de jauges personnalisées.
* **📋 Gestion des Réservations** :
  * **Création** : Un formulaire dédié pour créer de nouvelles réservations de ressources (GPU, CPU, Mémoire) pour une application et un namespace spécifiques sur un nœud choisi.
  * **Liste & Actions** : Une table listant toutes les réservations existantes.
  * **Actions Modales** : Possibilité de basculer le statut (Actif/Inactif), de supprimer, ou de déplacer une réservation vers un autre nœud via une modale de confirmation.
* **📱 Vue Applicative** : Une vue "accordéon" qui regroupe toutes les réservations par nom d'application, affichant les namespaces associés à chacune.
* **⚡ Gestion des Nœuds** : Une liste détaillée de tous les nœuds de tous les clusters, avec leurs métriques individuelles.
* **🌐 Gestion des Gateways** : Un panneau pour surveiller l'état des gateways réseau (Online, Offline). Affiche les messages d'erreur et permet de simuler une relance des gateways hors ligne.
* **🔒 Authentification** : Une page de connexion basique et un service d'authentification (`AuthService`) pour protéger l'accès au layout principal.

## 🛠️ Stack Technique

* **Framework** : Angular 17+
* **UI** : Angular Material
* **Architecture** : 100% Composants Standalone
* **Gestion d'état** : Signaux Angular (`signal`, `computed`)
* **Typage** : TypeScript

## 🔌 Backend (Simulation)

Actuellement, ce projet fonctionne avec un service de données simulées (`GpuDataServiceMock` et `GatewayDataMockService`).

Pour offrir une expérience de développement réaliste, **les données sont persistées dans le `localStorage` du navigateur**. Cela signifie que vos réservations, changements de statut et relances de gateway seront sauvegardés entre les rechargements de page.

Un service "réel" (`GpuDataService`) est en place, prêt à être connecté à une véritable API.

## 🚀 Démarrage

1.  Clonez le dépôt.
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    ng serve -o
    ```
    L'application sera disponible sur `http://localhost:4200/`.
