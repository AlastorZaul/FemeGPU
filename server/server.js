const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. GESTION DE LA PERSISTANCE (JSON)
// ==========================================

const DB_FILE = path.join(__dirname, 'db.json');

// --- DONNÉES PAR DÉFAUT (Utilisées si db.json n'existe pas) ---
const DEFAULT_DATA = {
  config: {
    applications: ['Python Script', 'Docker Job', 'NodeJS Server', 'Backend Service'],
    models: [
      {id: 'gpt-4-turbo', name: 'GPT-4 Turbo (API)', type: 'LLM', vramRequiredGb: 0, source: 'OpenAI', tags: ['Cloud']},
      {id: 'bert-base', name: 'Bert Base', type: 'NLP', vramRequiredGb: 2, source: 'HuggingFace', tags: ['Local']},
      {id: 'llama-3-70b', name: 'Llama 3 70B', type: 'LLM', vramRequiredGb: 40, source: 'Meta', tags: ['Local']}
    ]
  },
  // UTILISATEURS POUR L'AUTHENTIFICATION
  users: [
    {
      id: 'u1',
      username: 'admin',
      password: '123',
      email: 'admin@fermegpu.com',
      roles: ['ADMIN', 'USER'],
      avatar: 'assets/avatars/admin.png'
    },
    {
      id: 'u2',
      username: 'user',
      password: '123',
      email: 'user@fermegpu.com',
      roles: ['USER'],
      avatar: 'assets/avatars/user.png'
    }
  ],
  clusters: [
    {
      cluster_name: 'Cluster BACKEND (Live)',
      total_physical_gpus: 20, total_virtual_gpus: 20,
      total_used_gpus: 0, global_gpu_usage_percent: 0,
      total_memory_gb: 1024, total_cpu_cores: 256,
      total_used_memory_gb: 0, total_used_cpu_cores: 0,
      nodes: {
        "SRV-01": {
          owner: 'Backend Team', status: 'En ligne',
          physical_gpus: 10, virtual_gpus: 10, reserved_gpus: 0, used_gpus: 0,
          gpu_usage_percent: 0,
          total_memory_gb: 512, reserved_memory_gb: 0, total_used_memory_gb: 0,
          total_cpu_cores: 128, reserved_cpu_cores: 0, total_used_cpu_cores: 0,
          reservations: [
            {
              id: 'res-init-1', namespace: 'backend-core', application: 'Backend Service', modelName: '-',
              gpusRequested: 5, memoryRequest: 64, cpuRequest: 16,
              status: 'Running', isActive: true, createdAt: new Date().toISOString()
            }
          ]
        },
        "SRV-02": {
          owner: 'Admin', status: 'En ligne',
          physical_gpus: 10, virtual_gpus: 10, reserved_gpus: 0, used_gpus: 0,
          gpu_usage_percent: 0,
          total_memory_gb: 512, reserved_memory_gb: 0, total_used_memory_gb: 0,
          total_cpu_cores: 128, reserved_cpu_cores: 0, total_used_cpu_cores: 0,
          reservations: []
        }
      }
    }
  ]
};

// Variables en mémoire
let APP_CONFIG = DEFAULT_DATA.config;
let MOCK_USERS = DEFAULT_DATA.users;
let MOCK_CLUSTERS = DEFAULT_DATA.clusters;

// --- FONCTIONS DE CHARGEMENT / SAUVEGARDE ---

function loadData() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const rawData = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(rawData);
      APP_CONFIG = data.config || DEFAULT_DATA.config;
      MOCK_CLUSTERS = data.clusters || DEFAULT_DATA.clusters;
      MOCK_USERS = data.users || DEFAULT_DATA.users;
      console.log('📂 Données chargées depuis db.json');
    } catch (err) {
      console.error('⚠️ Erreur lecture db.json, utilisation des défauts:', err);
      saveData();
    }
  } else {
    console.log('✨ Création du fichier db.json avec les données par défaut');
    saveData();
  }
}

function saveData() {
  const data = {
    config: APP_CONFIG,
    users: MOCK_USERS,
    clusters: MOCK_CLUSTERS
  };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Erreur sauvegarde db.json:', err);
  }
}

// ==========================================
// 2. LOGIQUE MÉTIER (Recalculs)
// ==========================================

function updateMetrics(clusterName, nodeName) {
  const cluster = MOCK_CLUSTERS.find(c => c.cluster_name === clusterName);
  if (!cluster) return;

  const node = cluster.nodes[nodeName];
  if (!node) return;

  // Reset
  node.used_gpus = 0;
  node.reserved_gpus = 0;
  node.total_used_memory_gb = 0;
  node.reserved_memory_gb = 0;
  node.total_used_cpu_cores = 0;
  node.reserved_cpu_cores = 0;

  // Somme
  if (node.reservations) {
    node.reservations.forEach(res => {
      if (res.isActive) {
        const gpus = Number(res.gpusRequested) || 0;
        node.used_gpus += gpus;
        node.reserved_gpus += gpus;

        const ram = Number(res.memoryRequest) || 0;
        node.total_used_memory_gb += ram;
        node.reserved_memory_gb += ram;

        const cpu = Number(res.cpuRequest) || 0;
        node.total_used_cpu_cores += cpu;
        node.reserved_cpu_cores += cpu;
      }
    });
  }

  // % Nœud
  if (node.physical_gpus > 0) {
    node.gpu_usage_percent = Math.round((node.used_gpus / node.physical_gpus) * 100);
  } else {
    node.gpu_usage_percent = 0;
  }

  // % Cluster
  let clusterGpu = 0;
  let clusterMem = 0;
  let clusterCpu = 0;

  Object.values(cluster.nodes).forEach(n => {
    clusterGpu += n.used_gpus;
    clusterMem += n.total_used_memory_gb;
    clusterCpu += n.total_used_cpu_cores;
  });

  cluster.total_used_gpus = clusterGpu;
  cluster.total_used_memory_gb = clusterMem;
  cluster.total_used_cpu_cores = clusterCpu;

  if (cluster.total_physical_gpus > 0) {
    cluster.global_gpu_usage_percent = Math.round((cluster.total_used_gpus / cluster.total_physical_gpus) * 100);
  }
}

// Initialisation au démarrage
loadData();
MOCK_CLUSTERS.forEach(c => Object.keys(c.nodes).forEach(n => updateMetrics(c.cluster_name, n)));
saveData();

// ==========================================
// 3. ROUTES API
// ==========================================

// --- AUTHENTIFICATION ---
app.post('/api/auth/login', (req, res) => {
  const {username, password} = req.body;
  console.log(`🔑 Login: ${username}`);

  // Recherche dans les données chargées
  const user = MOCK_USERS.find(u => u.username === username && u.password === password);

  if (user) {
    // On renvoie l'user sans le mot de passe
    const {password, ...userWithoutPass} = user;
    res.json(userWithoutPass);
  } else {
    res.status(401).json({message: 'Identifiants incorrects'});
  }
});

app.get('/api/clusters', (req, res) => res.json(MOCK_CLUSTERS));

// --- RESERVATIONS ---
app.post('/api/reservations', (req, res) => {
  const {cluster, node, namespace, application, modelName, gpusRequested, memoryRequest, cpuRequest} = req.body;

  const targetCluster = MOCK_CLUSTERS.find(c => c.cluster_name === cluster);
  if (!targetCluster) return res.status(404).json({message: "Cluster introuvable"});

  const targetNode = targetCluster.nodes[node];
  if (!targetNode) return res.status(404).json({message: "Nœud introuvable"});

  const newRes = {
    id: `res-${Date.now()}`,
    namespace, application, modelName,
    gpusRequested: Number(gpusRequested) || 0,
    memoryRequest: Number(memoryRequest) || 0,
    cpuRequest: Number(cpuRequest) || 0,
    status: 'Running', isActive: true, createdAt: new Date().toISOString()
  };

  targetNode.reservations.push(newRes);
  updateMetrics(cluster, node);
  saveData();

  res.json({message: 'Réservation créée', reservation: newRes});
});

app.post('/api/reservations/toggle', (req, res) => {
  const {cluster, node, namespace} = req.body;
  const c = MOCK_CLUSTERS.find(x => x.cluster_name === cluster);
  if (c && c.nodes[node]) {
    const resItem = c.nodes[node].reservations.find(r => r.namespace === namespace);
    if (resItem) {
      resItem.isActive = !resItem.isActive;
      resItem.status = resItem.isActive ? 'Running' : 'Stopped';
      updateMetrics(cluster, node);
      saveData();
      return res.json({message: `Réservation ${resItem.isActive ? 'activée' : 'désactivée'}`});
    }
  }
  res.status(404).json({message: "Réservation introuvable"});
});

app.post('/api/reservations/move', (req, res) => {
  const {cluster, sourceNode, targetNode, namespace} = req.body;
  const c = MOCK_CLUSTERS.find(x => x.cluster_name === cluster);

  if (!c || !c.nodes[sourceNode] || !c.nodes[targetNode]) {
    return res.status(404).json({message: "Source ou Cible introuvable"});
  }

  const sourceList = c.nodes[sourceNode].reservations;
  const resIndex = sourceList.findIndex(r => r.namespace === namespace);

  if (resIndex > -1) {
    const [reservationToMove] = sourceList.splice(resIndex, 1);
    c.nodes[targetNode].reservations.push(reservationToMove);

    updateMetrics(cluster, sourceNode);
    updateMetrics(cluster, targetNode);
    saveData();
    return res.json({message: `Migration réussie vers ${targetNode}`});
  }
  res.status(404).json({message: "Réservation introuvable"});
});

app.delete('/api/reservations', (req, res) => {
  const {cluster, node, namespace} = req.body;
  const c = MOCK_CLUSTERS.find(x => x.cluster_name === cluster);

  if (c && c.nodes[node]) {
    const initialLength = c.nodes[node].reservations.length;
    c.nodes[node].reservations = c.nodes[node].reservations.filter(r => r.namespace !== namespace);

    if (c.nodes[node].reservations.length < initialLength) {
      updateMetrics(cluster, node);
      saveData();
      return res.json({message: "Réservation supprimée"});
    }
  }
  res.status(404).json({message: "Introuvable"});
});

app.put('/api/reservations/model', (req, res) => {
  const {cluster, node, namespace, modelName} = req.body;
  const c = MOCK_CLUSTERS.find(x => x.cluster_name === cluster);
  if (c && c.nodes[node]) {
    const resItem = c.nodes[node].reservations.find(r => r.namespace === namespace);
    if (resItem) {
      resItem.modelName = modelName;
      saveData();
      return res.json({message: `Modèle mis à jour vers ${modelName}`});
    }
  }
  res.status(404).json({message: "Introuvable"});
});

app.post('/api/reservations/deploy', (req, res) => {
  const {cluster, namespace} = req.body;
  console.log(`🚀 [MOCK] Début déploiement: ${namespace}`);
  setTimeout(() => console.log(`✅ [MOCK] Fin déploiement: ${namespace}`), 2000);
  res.json({message: `Déploiement initié pour ${namespace}`});
});

// --- CONFIG ---
app.get('/api/config/applications', (req, res) => res.json(APP_CONFIG.applications));
app.get('/api/config/models', (req, res) => res.json(APP_CONFIG.models));

app.post('/api/config/models', (req, res) => {
  const newModel = {id: `model-${Date.now()}`, ...req.body};
  APP_CONFIG.models.push(newModel);
  saveData();
  res.json(newModel);
});

app.delete('/api/config/models/:id', (req, res) => {
  const id = req.params.id;
  APP_CONFIG.models = APP_CONFIG.models.filter(m => m.id !== id);
  saveData();
  res.json({message: 'Modèle supprimé'});
});

app.get('/api/gateways', (req, res) => {
  res.json([
    {id: 'gw-1', name: 'Gateway Production', ipAddress: '10.0.0.254', status: 'Online'},
    {id: 'gw-2', name: 'Gateway Backup', ipAddress: '10.0.0.253', status: 'Offline', errorMessage: 'Timeout'}
  ]);
});

// --- DÉMARRAGE ---
app.listen(port, () => {
  console.log(`✅ Serveur DÉMARRÉ sur http://localhost:${port}`);
  console.log(`   Base de données : ${DB_FILE}`);
});
