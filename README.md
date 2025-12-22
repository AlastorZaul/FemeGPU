# 🚀 Ferme GPU - Dashboard de Gestion de Ressources

Bienvenue sur le projet **Ferme GPU** ! Cette application web moderne, basée sur **Angular 18**, est conçue pour la surveillance et la gestion centralisée de clusters de calcul haute performance (GPU, CPU, Mémoire).

L'application offre une interface claire pour visualiser l'état des nœuds et gérer les réservations de ressources pour différentes applications et namespaces.

---

## 🛠️ Présentation Technique

### Architecture & Framework

* **Frontend** : Architecture 100% **Composants Standalone** avec Angular 18.
* **Gestion d'état** : Utilisation intensive des **Signaux Angular** (`signal`, `computed`) pour une réactivité optimale.
* **UI & Design** : Intégration d'**Angular Material**, **Bootstrap 5** et **ECharts** pour les visualisations de données.
* **Sécurité** : Système d'authentification avec protection des routes par `roleGuard` (Rôles : ADMIN, USER).

### Backend & Persistance

* **API Mock** : Un serveur **Express** (Node.js) simule une API réelle sur le port 3000.
* **Stockage** : Les données sont persistées dans le `localStorage` du navigateur pour conserver les modifications entre les sessions.
* **Endpoints Clés** :
  * `GET /api/clusters` : Récupération des données serveurs et clusters.
  * `POST /api/reservations` : Création et enregistrement des réservations en mémoire serveur.

---

## 🚀 Démarrage

Suivez ces étapes pour lancer l'environnement complet de développement.

### 1. Installation

Installez les dépendances du projet :

```bash
npm install

🚀 Ferme GPU - Dashboard de Gestion
📝 Présentation du Projet
Ferme GPU est une application web moderne développée avec Angular 18, conçue pour la surveillance et la gestion centralisée de ressources de calcul (GPU, CPU, Mémoire) au sein de clusters.

L'outil permet aux administrateurs et aux utilisateurs de visualiser en temps réel l'état de santé des nœuds, de gérer les cycles de vie des réservations de ressources et de surveiller l'infrastructure réseau (gateways) via une interface intuitive et réactive.

✨ Fonctionnalités Clés
Tableau de Bord Holistique : Visualisation globale des clusters via des jauges personnalisées pour l'utilisation GPU, CPU et RAM.

Gestion Avancée des Réservations :

Création de réservations spécifiques par application, namespace et modèle d'IA.

Actions interactives : activation/désactivation, suppression ou migration de réservations entre les nœuds via des modales de confirmation.

Monitoring des Nœuds : Liste détaillée des serveurs incluant le propriétaire, le statut et les métriques de performance individuelles.

Contrôle des Gateways : Panneau de surveillance des passerelles réseau avec détection d'erreurs et simulation de redémarrage.

Sécurité : Système d'authentification (AuthService) protégé par un garde de route (AuthGuard).

🛠️ Stack Technique
Frontend : Angular 18 (100% Standalone Components), Angular Signals pour une gestion d'état réactive, Angular Material pour l'UI.

Visualisation : ECharts, ngx-charts et D3.js pour les graphiques et jauges.

Backend (Simulation & Live) :

Serveur Node.js/Express pour simuler une API réelle.

Persistance locale via localStorage pour le mode mock, permettant de conserver les données entre les sessions.

📖 Mode Opératoire (MODOP)
1. Prérequis
Node.js (v18+)

Angular CLI (npm install -g @angular/cli)

Navigateur Web récent (Chrome, Firefox, Edge)

2. Installation et Lancement
Clonage et Dépendances :

Bash

# Installer les modules
npm install
Lancement du Backend (Live API) : Ouvrez un terminal dédié pour le serveur de simulation :

Bash

node server/server.js
Le serveur sera accessible sur http://localhost:3000/api/clusters.

Lancement du Frontend : Dans un autre terminal :

Bash

ng serve -o
L'application s'ouvrira automatiquement sur http://localhost:4200/.

3. Utilisation de l'Application
A. Connexion
Accédez à la page de login.

Utilisez vos identifiants pour accéder au layout principal protégé par le AuthGuard.

B. Création d'une Réservation
Naviguez vers la section "Réservations".

Remplissez le formulaire :

Sélectionnez l'Application (ex: Python Script, Docker Job).

Choisissez le Modèle d'IA (ex: GPT-4, Bert).

Allouez les ressources (Nombre de GPU, Coeurs CPU, Mémoire RAM).

Sélectionnez le Nœud cible (ex: SRV-01).

Validez. La réservation sera enregistrée en mémoire vive sur le serveur (si l'API est active) ou en local.

C. Gestion des Gateways
Allez dans le panneau Gateway Management.

Si une gateway affiche le statut "Offline", utilisez le bouton de simulation pour tenter une relance.

D. Monitoring des Ressources
Consultez le Dashboard principal pour voir les jauges de consommation globale.

Utilisez la Node List pour voir quel propriétaire utilise quel serveur et vérifier le nombre de GPUs physiques vs virtuels.

4. Tests
Pour vérifier le bon fonctionnement de l'application :

Bash

# Lancer les tests unitaires (Karma/Jasmine)
npm test

# Lancer les tests de bout en bout (Playwright)
npx playwright test
