# 🚀 Ferme GPU - Dashboard de Gestion de Ressources

[![Angular](https://img.shields.io/badge/Angular-18.2-DD0031?style=for-the-badge&logo=angular)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 📝 Présentation

**Ferme GPU** est une solution de monitoring et de gestion centralisée pour les clusters de calcul haute performance. Développée avec **Angular 18**, cette plateforme permet de superviser en temps réel l'utilisation des ressources critiques (GPU, CPU, Mémoire) et d'orchestrer les réservations pour des applications variées (IA, Scripts Python, Docker Jobs).

---

## ✨ Fonctionnalités Clés

### 🖥️ Monitoring & Visualisation

* **Tableau de Bord Holistique** : Vue d'ensemble de la santé des clusters avec des jauges dynamiques pour l'utilisation globale des ressources.
* **Gestion des Nœuds** : Liste détaillée des serveurs (ex: `SRV-01`, `SRV-02`) affichant le statut (En ligne/Hors ligne), le propriétaire, et la répartition des GPUs physiques et virtuels.
* **Contrôle des Gateways** : Panneau dédié pour surveiller les passerelles réseau et simuler des relances en cas de panne.

### 📋 Gestion des Réservations

* **Création Flexible** : Formulaire complet pour allouer des ressources par application, namespace et modèle d'IA.
* **Actions interactives** : Possibilité d'activer/désactiver, supprimer ou migrer des réservations entre les nœuds via des modales de confirmation.
* **Persistance intelligente** : Utilisation du `localStorage` pour le mode mock et d'une API Express pour le mode live.

### 🔒 Sécurité & Accès

* **Authentification** : Système de login avec protection des routes via `AuthGuard`.
* **Contrôle des Rôles** : Gestion des accès différenciés entre les profils **ADMIN** et **USER**.

---

## 🛠️ Stack Technique

* **Frontend** : Angular 18 (Composants Standalone, Signaux Angular).
* **UI Framework** : Angular Material & Bootstrap 5.
* **Visualisation** : ECharts, ngx-charts, D3.js.
* **Backend (Mock)** : Node.js avec Express.
* **Qualité** : Playwright (E2E), Jasmine/Karma (Unit tests).

---

## 🚀 Installation et Démarrage

### 1. Prérequis

* **Node.js** (v18+)
* **Angular CLI** (`npm install -g @angular/cli`)

### 2. Installation
```bash
# Installation des dépendances
npm install

```

### 3. Lancement du Backend (API Live)

Dans un premier terminal, lancez le serveur de simulation pour permettre la persistance des données :

```bash
node server/server.js

```

*Le serveur écoute sur le port **3000**. Testez l'accès via : `http://localhost:3000/api/clusters*`.

### 4. Lancement du Frontend

Dans un second terminal, démarrez l'application Angular :

```bash
ng serve -o

```

*L'interface sera disponible sur `http://localhost:4200/*`.

---

#Voici un mode opératoire (MODOP) détaillé pour l'installation, la configuration et l'utilisation de la plateforme **Ferme GPU**. Ce guide est conçu pour accompagner aussi bien les administrateurs système que les utilisateurs finaux.

---

# 📖 Mode Opératoire Détaillé - Ferme GPU

Ce document décrit les procédures standard pour exploiter l'application de gestion de ressources GPU.

## 🛠️ 1. Installation et Préparation de l'Environnement

### A. Prérequis Techniques

* **Node.js** : Version 18.0.0 ou supérieure requise pour assurer la compatibilité avec Angular 18.
* **Angular CLI** : Installable via la commande `npm install -g @angular/cli`.
* **Navigateur** : Chrome, Firefox ou Edge dans leurs versions récentes pour le support des Signaux Angular.

### B. Procédure d'Installation

1. **Récupération du projet** : Clonez le dépôt sur votre machine locale.
2. **Installation des dépendances** : Exécutez la commande suivante à la racine du projet pour installer les bibliothèques nécessaires (Angular Material, ECharts, RxJS, etc.) :

```bash
npm install

```



---

## 🚀 2. Lancement des Services

L'application nécessite le démarrage simultané du serveur de données et de l'interface utilisateur.

### Étape 1 : Démarrage du Backend (API de Simulation)

Ouvrez un terminal et lancez le serveur Express. Ce serveur gère la persistance en mémoire des réservations et simule les endpoints des clusters.

```bash
node server/server.js

```

> **Note** : Le serveur est configuré par défaut sur le port **3000**.

### Étape 2 : Démarrage du Frontend

Dans un second terminal, lancez le serveur de développement Angular :

```bash
ng serve -o

```

L'application sera accessible sur `http://localhost:4200/`.

---

## 🔐 3. Authentification et Accès

L'accès à l'application est protégé par un service d'authentification (`AuthService`) et des gardes de route (`AuthGuard` et `RoleGuard`).

1. **Page de Connexion** : Saisissez vos identifiants sur la page de login.
2. **Rôles Utilisateurs** :

* **ADMIN** : Accès complet à toutes les fonctionnalités de gestion et de configuration.
* **USER** : Accès restreint à la consultation et aux réservations simples.

---

## 📊 4. Utilisation du Dashboard de Monitoring

Le tableau de bord principal fournit une vision macroscopique de l'infrastructure.

* **Jauges Globales** : Visualisez instantanément le pourcentage d'utilisation totale des **GPU**, de la **Mémoire** et du **CPU** sur l'ensemble des clusters connectés.
* **Node List** : Consultez la liste détaillée de chaque nœud (ex: `SRV-01`) pour vérifier :
* Le **Statut** (En ligne / Hors ligne).
* Le **Propriétaire** affecté au serveur.
* Le ratio entre **GPUs physiques** et **GPUs virtuels** disponibles.

---

## 📋 5. Gestion des Réservations de Ressources

C'est le cœur opérationnel de l'application. Elle permet d'allouer précisément la puissance de calcul.

### A. Créer une Réservation

1. Naviguez vers l'onglet **"Réservations"** puis cliquez sur le formulaire de création.
2. **Configuration** :

* Sélectionnez l'**Application** et le **Namespace** concerné.
* Choisissez le **Modèle d'IA** (ex: GPT-4 Turbo, Bert) pour lequel vous réservez les ressources.
* Définissez les quantités : Nombre de GPU, cœurs CPU et Go de RAM.


3. **Validation** : Une fois validée, la réservation est envoyée au backend via un appel `POST /api/reservations` et stockée dans le `localStorage` pour persistance locale.

### B. Actions sur les Réservations existantes

Dans la table des réservations, vous pouvez effectuer trois types d'actions via une modale de confirmation :

* **Basculer le Statut** : Activez ou désactivez une réservation sans la supprimer.
* **Déplacer (Move)** : Transférez une réservation d'un nœud vers un autre pour équilibrer la charge (Load Balancing).
* **Suppression** : Libérez définitivement les ressources occupées.

---

## 🌐 6. Maintenance des Gateways

Le panneau **Gateway Management** permet de surveiller la connectivité réseau du cluster.

1. **Surveillance** : Identifiez les passerelles en statut `Offline`.
2. **Dépannage** : En cas de panne simulée, utilisez le bouton de **Relance** pour tenter de rétablir la connexion de la gateway.

---

## 🧪 7. Procédures de Test

Pour s'assurer que l'application fonctionne correctement après une modification :

* **Tests Unitaires** : Exécutez `npm test` pour vérifier la logique des composants et services.
* **Tests de bout en bout (E2E)** : Utilisez `npx playwright test` pour simuler des parcours utilisateurs complets (connexion, création de réservation).

---

Souhaitez-vous que j'ajoute une section spécifique sur la personnalisation des seuils d'alerte pour les jauges de ressources ?
