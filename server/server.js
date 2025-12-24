const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {
  sequelize,
  User,
  AiModel,
  Cluster,
  Node,
  Reservation,
  Gateway,      // ✅ Ajouté pour corriger ReferenceError
  Application,  // ✅ Ajouté pour corriger ReferenceError
  Namespace,    // ✅ Ajouté pour les nouvelles routes
  initDb
} = require('./database');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialisation de la DB au démarrage
initDb();

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Recalcule les métriques d'un noeud en fonction de ses réservations actives
 * Retourne un objet avec les compteurs à jour.
 */
async function updateNodeMetrics(nodeId) {
  const node = await Node.findByPk(nodeId, {include: 'reservations'});
  if (!node) return {};

  let usedGpus = 0;
  let usedMem = 0;
  let usedCpu = 0;

  if (node.reservations) {
    node.reservations.forEach(res => {
      if (res.isActive) {
        usedGpus += res.gpusRequested || 0;
        usedMem += res.memoryRequest || 0;
        usedCpu += res.cpuRequest || 0;
      }
    });
  }

  // C'est ici que se joue la correction des noms pour le frontend
  return {
    used_gpus: usedGpus,
    reserved_gpus: usedGpus,

    // CORRECTION : On utilise les noms attendus par le frontend (gpu.model.ts)
    reserved_memory_gb: usedMem,   // Au lieu de total_used_memory_gb
    reserved_cpu_cores: usedCpu,   // Au lieu de total_used_cpu_cores

    // On garde aussi les anciens noms au cas où le Cluster global les utilise
    total_used_memory_gb: usedMem,
    total_used_cpu_cores: usedCpu,

    // Calcul du pourcentage d'usage GPU
    gpu_usage_percent: node.physical_gpus > 0 ? Math.round((usedGpus / node.physical_gpus) * 100) : 0
  };
}

// ==========================================
// ROUTES API
// ==========================================

// --- AUTHENTIFICATION ---
app.post('/api/auth/login', async (req, res) => {
  const {username, password} = req.body;

  try {
    const user = await User.findOne({where: {username}});
    if (!user) return res.status(401).json({message: 'Identifiants incorrects'});

    // Comparaison du mot de passe haché
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({message: 'Identifiants incorrects'});

    // Renvoi des infos utilisateur (sans le mot de passe)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      avatar: user.avatar
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Erreur serveur'});
  }
});

// --- CLUSTERS (Structure complexe pour le Frontend) ---
app.get('/api/clusters', async (req, res) => {
  try {
    const clustersDb = await Cluster.findAll({
      include: [{
        model: Node,
        as: 'nodes',
        include: [{model: Reservation, as: 'reservations'}]
      }]
    });

    const responseData = await Promise.all(clustersDb.map(async (c) => {
      const cJson = c.toJSON();
      cJson.cluster_name = c.name;

      const nodesMap = {};
      let clusterUsedGpu = 0;
      let clusterUsedMem = 0; // ✅ Variable pour le total RAM
      let clusterUsedCpu = 0; // ✅ Variable pour le total CPU

      for (const n of c.nodes) {
        const metrics = await updateNodeMetrics(n.id);

        // Cumul des métriques pour le cluster global
        clusterUsedGpu += metrics.used_gpus;
        clusterUsedMem += metrics.total_used_memory_gb || 0;
        clusterUsedCpu += metrics.total_used_cpu_cores || 0;

        // Transformation des réservations avec Alias de sécurité
        const mappedReservations = n.reservations.map(r => {
          const rJson = r.toJSON();
          return {
            ...rJson,
            // 1. Mapping obligatoire pour le backend
            namespace: r.namespaceName,
            application: r.applicationName,

            // 2. Alias de compatibilité (au cas où le front utilise 'ram' ou 'cpu')
            ram: r.memoryRequest,      // Alias pour memoryRequest
            memory: r.memoryRequest,   // Alias pour memoryRequest
            cpu: r.cpuRequest,         // Alias pour cpuRequest

            // 3. Info contextuelle utile
            nodeName: n.name,
            clusterName: c.name
          };
        });

        nodesMap[n.name] = {
          ...n.toJSON(),
          ...metrics,
          status: n.status,
          owner: n.owner,
          reservations: mappedReservations
        };
      }

      cJson.nodes = nodesMap;

      // ✅ Assignation des totaux calculés (pour les jauges du dashboard)
      cJson.total_used_gpus = clusterUsedGpu;
      cJson.total_used_memory_gb = clusterUsedMem;
      cJson.total_used_cpu_cores = clusterUsedCpu;

      // Calcul des pourcentages globaux
      cJson.global_gpu_usage_percent = c.total_physical_gpus > 0
        ? Math.round((clusterUsedGpu / c.total_physical_gpus) * 100) : 0;

      // Optionnel : Ajout des pourcentages globaux CPU/RAM si le front les utilise
      // cJson.global_memory_usage_percent = ...

      return cJson;
    }));

    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: err.message});
  }
});

// --- CRÉATION RÉSERVATION ---
app.post('/api/reservations', async (req, res) => {
  const {cluster, node, namespace, application, modelName, gpusRequested, memoryRequest, cpuRequest} = req.body;

  try {
    // 1. Trouver le Namespace (optionnel, pour lier proprement si on veut)
    let nsEntity = null;
    if (namespace) {
      nsEntity = await Namespace.findOne({where: {name: namespace}});
    }

    // 2. Trouver le Noeud cible
    const targetNode = await Node.findOne({where: {name: node}});
    if (!targetNode) return res.status(404).json({message: "Nœud introuvable"});

    // 3. Création
    const newRes = await Reservation.create({
      namespaceName: namespace, // Pour compatibilité front
      NamespaceId: nsEntity ? nsEntity.id : null,
      applicationName: application,
      modelName,
      gpusRequested: Number(gpusRequested) || 0,
      memoryRequest: Number(memoryRequest) || 0,
      cpuRequest: Number(cpuRequest) || 0,
      NodeId: targetNode.id,
      status: 'Running',
      isActive: true
    });

    res.json({message: 'Réservation créée', reservation: newRes});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Erreur lors de la création de la réservation"});
  }
});

// --- TOGGLE STATUS (Activer/Désactiver) ---
app.post('/api/reservations/toggle', async (req, res) => {
  const {node, namespace} = req.body;
  try {
    const targetNode = await Node.findOne({where: {name: node}});
    if (!targetNode) return res.status(404).json({message: "Nœud introuvable"});

    // On cherche la réservation via le Node ID et le Namespace
    // (Note: Idéalement, il faudrait utiliser l'ID unique de la réservation)
    const resItem = await Reservation.findOne({
      where: {NodeId: targetNode.id, namespaceName: namespace}
    });

    if (resItem) {
      resItem.isActive = !resItem.isActive;
      resItem.status = resItem.isActive ? 'Running' : 'Stopped';
      await resItem.save();
      return res.json({message: `Réservation ${resItem.isActive ? 'activée' : 'désactivée'}`});
    }
    res.status(404).json({message: "Réservation introuvable sur ce noeud"});
  } catch (e) {
    res.status(500).json({message: "Erreur serveur"});
  }
});

// --- SUPPRESSION RÉSERVATION ---
app.delete('/api/reservations', async (req, res) => {
  const {node, namespace} = req.body;
  try {
    const targetNode = await Node.findOne({where: {name: node}});
    if (!targetNode) return res.status(404).json({message: "Nœud introuvable"});

    const deleted = await Reservation.destroy({
      where: {NodeId: targetNode.id, namespaceName: namespace}
    });

    if (deleted) return res.json({message: "Réservation supprimée"});
    res.status(404).json({message: "Réservation introuvable"});
  } catch (e) {
    res.status(500).json({message: "Erreur serveur"});
  }
});

// --- CONFIGURATION : APPLICATIONS ---
app.get('/api/config/applications', async (req, res) => {
  try {
    const apps = await Application.findAll();
    // Le front attend un tableau de chaînes de caractères (noms)
    res.json(apps.map(a => a.name));
  } catch (e) {
    res.status(500).json({message: "Erreur récupération applications"});
  }
});

// --- CONFIGURATION : MODÈLES IA ---
app.get('/api/config/models', async (req, res) => {
  try {
    const models = await AiModel.findAll();
    // Mapping pour le format attendu par le front
    const response = models.map(m => ({
      id: m.idName,
      name: m.name,
      type: m.type,
      vramRequiredGb: m.vramRequiredGb,
      source: m.source,
      tags: m.tags
    }));
    res.json(response);
  } catch (e) {
    res.status(500).json({message: "Erreur récupération modèles"});
  }
});

// --- GATEWAYS ---
app.get('/api/gateways', async (req, res) => {
  try {
    const gateways = await Gateway.findAll();
    res.json(gateways);
  } catch (e) {
    res.status(500).json({message: "Erreur récupération gateways"});
  }
});

// --- NAMESPACES ---
app.get('/api/config/namespaces', async (req, res) => {
  try {
    const namespaces = await Namespace.findAll();
    res.json(namespaces);
  } catch (err) {
    res.status(500).json({message: "Erreur récupération namespaces"});
  }
});

app.post('/api/config/namespaces', async (req, res) => {
  try {
    const {name, owner, quotaGpu} = req.body;
    // Vérifier unicité si besoin
    const newNs = await Namespace.create({name, owner, quotaGpu});
    res.json(newNs);
  } catch (err) {
    res.status(500).json({message: "Erreur création namespace"});
  }
});

app.put('/api/reservations/model', async (req, res) => {
  // Le frontend envoie : { cluster, node, namespace, modelName }
  const {node, namespace, modelName} = req.body;

  try {
    // 1. On identifie le noeud
    const targetNode = await Node.findOne({where: {name: node}});
    if (!targetNode) return res.status(404).json({message: "Nœud introuvable"});

    // 2. On cherche la réservation correspondante
    const resItem = await Reservation.findOne({
      where: {NodeId: targetNode.id, namespaceName: namespace}
    });

    if (resItem) {
      // 3. Mise à jour du champ modelName
      resItem.modelName = modelName;
      await resItem.save(); // Persistance en BDD

      return res.json({message: `Modèle mis à jour vers ${modelName}`});
    }

    res.status(404).json({message: "Réservation introuvable"});
  } catch (e) {
    console.error(e);
    res.status(500).json({message: "Erreur serveur lors de la mise à jour du modèle"});
  }
});

// --- DÉMARRAGE SERVEUR ---
app.listen(port, () => {
  console.log(`✅ Serveur DB (SQLite) démarré sur http://localhost:${port}`);
  console.log(`   Base de données : server/ferme.sqlite`);
});
