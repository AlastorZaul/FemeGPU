# Tableau de Bord pour Ferme de GPU

Ce projet est une application web moderne développée avec Angular pour le monitoring en temps réel d'une ferme de GPUs, organisée par clusters. L'application offre une interface claire, dynamique et interactive pour visualiser l'état de chaque GPU.

## 🚀 Fonctionnalités Clés

* **Monitoring en Temps Réel** : Les données des GPUs (température, utilisation, etc.) sont mises à jour dynamiquement à intervalle régulier.
* **Organisation par Clusters** : Les GPUs sont regroupés dans des panneaux extensibles par cluster, permettant de gérer des infrastructures de grande taille.
* **Navigation par Sidebar** : Une barre de navigation latérale permet de naviguer entre les différentes pages de l'application (Dashboard, Workers, Settings).
* **Cartes GPU Dynamiques** : Chaque carte GPU met en avant une métrique principale différente pour éviter la répétition visuelle et affiche les autres en tant qu'informations secondaires.
* **Modale de Détails** : Un clic sur une carte ouvre une modale affichant les statistiques actuelles du GPU et un graphique de l'historique de sa température.
* **Sélection Multiple** : Chaque cluster dispose d'un sélecteur multiple pour sélectionner des GPUs spécifiques, ouvrant la voie à des actions groupées.
* **Fil d'Ariane (Breadcrumb)** : Un fil d'Ariane dynamique indique la position de l'utilisateur dans l'application.

## 🛠️ Technologies Utilisées

* **Framework** : Angular 17+
* **Architecture** : Composants Standalone
* **UI/UX** : Angular Material (Sidebar, Modales, Panneaux, Sélecteurs, etc.)
* **Jauges** : Composant SVG personnalisé pour un contrôle total du visuel
* **Graphiques** : `@swimlane/ngx-charts` pour les graphiques historiques
* **Gestion d'état** : RxJS (Observables, BehaviorSubject) et Signals Angular pour une réactivité optimale

## 📂 Structure du Projet

Le projet est organisé de manière modulaire pour une maintenance facile :

```
/src
├── /app
│   ├── /components       # Composants réutilisables
│   │   ├── /breadcrumb
│   │   ├── /custom-gauge
│   │   ├── /gpu-card
│   │   └── /gpu-history-chart
│   ├── /models           # Interfaces et types de données (gpu.model.ts)
│   ├── /pages            # Composants principaux agissant comme des pages
│   │   ├── /dashboard
│   │   ├── /settings
│   │   └── /workers
│   ├── /services         # Logique métier et gestion des données (gpu-data.service.ts)
│   ├── app.component.ts  # Composant racine avec la mise en page principale
│   ├── app.config.ts     # Configuration de l'application
│   └── app.routes.ts     # Définition des routes
└── ...
```

## ⚙️ Installation et Démarrage

Pour lancer le projet en local, suivez ces étapes :

1. **Cloner le dépôt :**

   ```bash
   git clone <url-du-depot>
   cd nom-du-projet
   ```

2. **Installer les dépendances :**

   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**

   ```bash
   ng serve
   ```

   L'application sera accessible à l'adresse `http://localhost:4200/`.

## 🧩 Détail des Composants

* **`AppComponent`** : Le squelette de l'application. Il contient la `mat-toolbar` (barre d'outils supérieure), la `mat-sidenav` (barre de navigation) et le `<router-outlet>` où les pages sont affichées.
* **`DashboardComponent`** : La page principale. Elle récupère les données des clusters via le `GpuDataService`, gère la logique de sélection multiple et affiche les panneaux de clusters.
* **`GpuCardComponent`** : Affiche les informations d'un seul GPU. Ce composant intelligent fait un roulement de la métrique principale affichée pour éviter la monotonie visuelle.
* **`CustomGaugeComponent`** : Notre propre composant de jauge SVG, créé pour un contrôle total sur l'animation, la couleur et le positionnement du texte, résolvant les problèmes de la bibliothèque externe.
* **`GpuHistoryChartComponent`** : La modale qui s'ouvre pour afficher les détails d'un GPU, y compris ses statistiques actuelles et son historique de température via `ngx-charts`.
* **`BreadcrumbComponent`** : Lit dynamiquement les données des routes pour afficher un fil d'Ariane de navigation.

## 🔮 Améliorations Possibles

* **Connexion à une API réelle** : Remplacer le `GpuDataService` par un service utilisant `HttpClient` pour récupérer des données réelles.
* **Actions Groupées** : Implémenter des actions (ex: "Redémarrer", "Appliquer un profil") sur les GPUs sélectionnés via le sélecteur multiple.
* **Authentification** : Ajouter une page de connexion pour sécuriser l'accès au tableau de bord.
* **Thème Sombre/Clair** : Intégrer un interrupteur pour permettre à l'utilisateur de choisir son thème préféré.
