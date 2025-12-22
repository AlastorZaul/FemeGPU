Voici le contenu complet et optimisé pour votre fichier `README.md`. Ce document regroupe la présentation du projet, les détails techniques et le mode opératoire (MODOP) pour une utilisation clé en main.

Vous pouvez copier-coller le bloc ci-dessous directement dans un fichier nommé `README.md` à la racine de votre projet.

```markdown
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

## 📖 Mode Opératoire (MODOP)

### A. Connexion

1. Accédez à l'URL de l'application.
2. Connectez-vous avec vos identifiants pour débloquer le dashboard.

### B. Créer une Réservation

1. Naviguez dans l'onglet **Réservations**.
2. Cliquez sur le bouton de création.
3. Sélectionnez l'application (ex: `Python Script`) et le modèle d'IA (ex: `GPT-4 Turbo`).
4. Ajustez les ressources nécessaires (GPU, CPU, RAM) et choisissez un nœud cible (ex: `SRV-01`).
5. Validez. La réservation apparaît dans la table et impacte immédiatement les jauges de ressources du nœud.

### C. Gérer les Incidents Réseau

1. Rendez-vous dans la section **Gateway Management**.
2. Si une passerelle est marquée comme `Offline`, consultez le message d'erreur.
3. Utilisez l'action de relance pour simuler une reprise d'activité.

### D. Maintenance des Nœuds

* Consultez la **Node List** pour identifier les serveurs saturés ou inactifs.
* Utilisez l'option de réallocation pour libérer des ressources sur un nœud spécifique.

---

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests de bout en bout (Playwright)
npx playwright test

```

---

*Projet développé par AlastorZaul pour la gestion intelligente de ressources GPU.*

```

```
