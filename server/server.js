const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// --- DONNÉES SIMULÉES CÔTÉ BACKEND ---
// (Dans un vrai cas, ces données viendraient d'une Base de Données)

const MOCK_CLUSTERS = [
  {
    cluster_name: 'Cluster BACKEND (Live)',
    total_physical_gpus: 20,
    total_virtual_gpus: 20,
    total_used_gpus: 5, // Un peu d'usage pour l'exemple
    global_gpu_usage_percent: 25,
    total_memory_gb: 1024,
    total_cpu_cores: 256,
    total_used_memory_gb: 128,
    total_used_cpu_cores: 32,
    nodes: {
      "SRV-01": {
        owner: 'Backend Team', status: 'En ligne',
        physical_gpus: 10, virtual_gpus: 10, reserved_gpus: 5, used_gpus: 5,
        gpu_usage_percent: 50,
        total_memory_gb: 512, reserved_memory_gb: 64,
        total_cpu_cores: 128, reserved_cpu_cores: 16,
        reservations: []
      },
      "SRV-02": {
        owner: 'Admin', status: 'En ligne',
        physical_gpus: 10, virtual_gpus: 10, reserved_gpus: 0, used_gpus: 0,
        gpu_usage_percent: 0,
        total_memory_gb: 512, reserved_memory_gb: 0,
        total_cpu_cores: 128, reserved_cpu_cores: 0,
        reservations: []
      }
    }
  }
];

const APP_CONFIG = {
  applications: ['Python Script', 'Docker Job', 'NodeJS Server', 'Backend Service'],
  models: [
    {id: 'gpt-4-turbo', name: 'GPT-4 Turbo (API)', type: 'LLM', vramRequiredGb: 0, source: 'OpenAI', tags: ['Cloud']},
    {id: 'bert-base', name: 'Bert Base', type: 'NLP', vramRequiredGb: 2, source: 'HuggingFace', tags: ['Local']}
  ]
};

// --- ROUTES API (GET) ---

// 1. Récupérer les clusters
app.get('/api/clusters', (req, res) => {
  console.log('[GET] /api/clusters - Données envoyées');
  res.json(MOCK_CLUSTERS);
});

// 2. Config : Applications
app.get('/api/config/applications', (req, res) => {
  res.json(APP_CONFIG.applications);
});

// 3. Config : Modèles
app.get('/api/config/models', (req, res) => {
  res.json(APP_CONFIG.models);
});

// 4. Config : Gateways (Pour votre service GatewayDataService)
app.get('/api/gateways', (req, res) => {
  res.json([
    {id: 'gw-live-1', name: 'Gateway Production', ipAddress: '10.0.0.254', status: 'Online'},
    {id: 'gw-live-2', name: 'Gateway Backup', ipAddress: '10.0.0.253', status: 'Offline', errorMessage: 'Maintenance'}
  ]);
});


// --- ROUTES API (POST/ACTIONS) ---

app.post('/api/nodes/:nodeName/reallocate', (req, res) => {
  const nodeName = req.params.nodeName;
  console.log(`[POST] Réallocation demandée pour : ${nodeName}`);
  res.json({message: `Réallocation pour ${nodeName} initiée côté serveur.`});
});

// Ajout pour gérer les autres actions du service (évite les erreurs 404)
app.post('/api/reservations', (req, res) => {
  console.log('[POST] Création réservation reçue:', req.body);
  res.json({message: 'Réservation enregistrée sur le serveur'});
});

// --- DEMARRAGE ---
app.listen(port, () => {
  console.log(`--------------------------------------------------`);
  console.log(`✅ Serveur BACKEND (Live API) démarré sur port ${port}`);
  console.log(`   Testez l'URL : http://localhost:${port}/api/clusters`);
  console.log(`--------------------------------------------------`);
});
