# 🚀 Tableau de Bord pour Ferme de GPU

Tableau de bord moderne et réactif pour le monitoring en temps réel d'une ferme de GPUs, développé avec Angular 17+ et Angular Material. L'application offre une interface claire et dynamique pour visualiser l'état des GPUs regroupés par clusters.

## ✨ Fonctionnalités

* **Monitoring en Temps Réel** : Données mises à jour à intervalle régulier via une simulation de flux de données (RxJS).
* **Organisation par Clusters** : Les GPUs sont regroupés dans des panneaux extensibles pour une meilleure lisibilité.
* **Navigation Complète** : Une barre de navigation latérale et un fil d'Ariane dynamique pour une navigation aisée.
* **Cartes GPU Dynamiques** : Chaque carte GPU met en avant une métrique principale différente pour éviter la répétition visuelle et affiche les autres en tant qu'informations secondaires.
* **Modale de Détails** : Un clic sur un GPU ouvre une fenêtre affichant ses statistiques actuelles et un graphique de l'historique de sa température.
* **Sélection Multiple par Cluster** : Un sélecteur personnalisé permet de sélectionner plusieurs GPUs pour de futures actions groupées.
* **Authentification** : Une page de connexion simple protège l'accès au tableau de bord principal.

## 🛠️ Stack Technique

* **Framework Principal** : [Angular](https://angular.io/) (v17+) avec composants Standalone.
* **UI / Composants** : [Angular Material](https://material.angular.io/) pour la mise en page, les modales, les panneaux, etc.
* **Graphiques** : [@swimlane/ngx-charts](https://github.com/swimlane/ngx-charts) pour les graphiques historiques.
* **Jauges** : Un composant de jauge SVG personnalisé pour un contrôle total du visuel.
* **Gestion d'état** : RxJS pour les flux de données asynchrones et les **Signals** d'Angular pour un état réactif.

## 📂 Structure du Projet

Le projet est organisé par fonctionnalités pour une meilleure maintenance :

```
/src
├── /app
│   ├── /components       # Composants réutilisables (carte GPU, jauge, breadcrumb, etc.)
│   ├── /layout           # Composant de la mise en page principale (avec sidebar)
│   ├── /models           # Interfaces et types de données (gpu.model.ts)
│   ├── /pages            # Composants principaux (Dashboard, Login, Settings, etc.)
│   ├── /services         # Logique métier et services (auth.guard, gpu-data)
│   ├── app.config.ts     # Configuration de l'application
│   └── app.routes.ts     # Définition des routes
└── ...
```

## ⚙️ Démarrage Rapide

1. **Prérequis** : Assurez-vous d'avoir [Node.js](https://nodejs.org/) (v18+) et Angular CLI installés.

2. **Installer les dépendances :**

   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**

   ```bash
   ng serve
   ```

4. **Accéder à l'application :**
   Ouvrez votre navigateur et allez sur `http://localhost:4200/`. Vous serez redirigé vers la page de connexion.

## 🧩 Détail des Composants

* **`AppComponent`** : Le point d'entrée de l'application, qui contient le routeur principal.
* **`LayoutComponent`** : Le squelette de l'application authentifiée. Il contient la `mat-sidenav` (barre de navigation) et le `<router-outlet>` où les pages sont affichées.
* **`DashboardComponent`** : La page principale. Elle récupère les données des clusters, gère la logique de sélection multiple et affiche les panneaux de clusters.
* **`GpuCardComponent`** : Affiche les informations d'un seul GPU en faisant un roulement de la métrique principale.
* **`CustomGaugeComponent`** : Notre propre composant de jauge SVG, pour un contrôle total sur l'animation et le style.
* **`GpuHistoryChartComponent`** : La modale qui s'ouvre pour afficher les détails d'un GPU, y compris son historique de température.
* **`BreadcrumbComponent`** : Lit dynamiquement les données des routes pour afficher un fil d'Ariane de navigation.

## 🔮 Améliorations Possibles

* **Connexion à une API réelle** : Remplacer le `GpuDataService` par un service utilisant `HttpClient`.
* **Actions Groupées** : Implémenter des actions (ex: "Redémarrer") sur les GPUs sélectionnés.
* **Améliorer l'authentification** : Remplacer la simulation `localStorage` par une vraie solution (JWT, OAuth).
* **Tests Unitaires et End-to-End** : Ajouter une couverture de tests pour garantir la stabilité de l'application.
