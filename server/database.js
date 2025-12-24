// server/database.js
const {Sequelize, DataTypes} = require('sequelize');
const bcrypt = require('bcrypt');
const path = require('path');

// Initialisation de SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'ferme.sqlite'),
  logging: false
});

// ==========================================
// 1. DÉFINITION DES MODÈLES
// ==========================================

const User = sequelize.define('User', {
  username: {type: DataTypes.STRING, unique: true, allowNull: false},
  password: {type: DataTypes.STRING, allowNull: false},
  email: {type: DataTypes.STRING},
  roles: {type: DataTypes.JSON},
  avatar: {type: DataTypes.STRING}
});

const Gateway = sequelize.define('Gateway', {
  name: {type: DataTypes.STRING, allowNull: false}, // Retiré 'unique: true' pour éviter conflits simples, ou utiliser findOrCreate
  ipAddress: {type: DataTypes.STRING},
  status: {type: DataTypes.STRING, defaultValue: 'Online'},
  lastPing: {type: DataTypes.DATE}
});

const Application = sequelize.define('Application', {
  name: {type: DataTypes.STRING, unique: true, allowNull: false},
  description: {type: DataTypes.STRING},
  dockerImageDefault: {type: DataTypes.STRING}
});

const Namespace = sequelize.define('Namespace', {
  name: {type: DataTypes.STRING, unique: true, allowNull: false},
  owner: {type: DataTypes.STRING},
  quotaGpu: {type: DataTypes.INTEGER, defaultValue: 0}
});

const AiModel = sequelize.define('AiModel', {
  idName: {type: DataTypes.STRING, unique: true},
  name: {type: DataTypes.STRING},
  type: {type: DataTypes.STRING},
  vramRequiredGb: {type: DataTypes.INTEGER},
  source: {type: DataTypes.STRING},
  tags: {type: DataTypes.JSON}
});

const Cluster = sequelize.define('Cluster', {
  name: {type: DataTypes.STRING, unique: true},
  total_physical_gpus: {type: DataTypes.INTEGER, defaultValue: 0},
  total_virtual_gpus: {type: DataTypes.INTEGER, defaultValue: 0},
  total_memory_gb: {type: DataTypes.INTEGER, defaultValue: 0},
  total_cpu_cores: {type: DataTypes.INTEGER, defaultValue: 0}
});

const Node = sequelize.define('Node', {
  name: {type: DataTypes.STRING},
  owner: {type: DataTypes.STRING},
  status: {type: DataTypes.STRING, defaultValue: 'En ligne'},
  physical_gpus: {type: DataTypes.INTEGER},
  virtual_gpus: {type: DataTypes.INTEGER},
  total_memory_gb: {type: DataTypes.INTEGER},
  total_cpu_cores: {type: DataTypes.INTEGER}
});

const Reservation = sequelize.define('Reservation', {
  namespaceName: {type: DataTypes.STRING},
  applicationName: {type: DataTypes.STRING},
  modelName: {type: DataTypes.STRING},
  gpusRequested: {type: DataTypes.INTEGER},
  memoryRequest: {type: DataTypes.INTEGER},
  cpuRequest: {type: DataTypes.INTEGER},
  status: {type: DataTypes.STRING, defaultValue: 'Running'},
  isActive: {type: DataTypes.BOOLEAN, defaultValue: true},
  createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
});

// ==========================================
// 2. RELATIONS
// ==========================================

Cluster.hasMany(Node, {as: 'nodes'});
Node.belongsTo(Cluster);

Node.hasMany(Reservation, {as: 'reservations'});
Reservation.belongsTo(Node);

Namespace.hasMany(Reservation, {as: 'reservations'});
Reservation.belongsTo(Namespace);

Application.hasMany(Reservation);
Reservation.belongsTo(Application);

// ==========================================
// 3. SEEDING INTELLIGENT (C'est ici que ça change)
// ==========================================

async function initDb() {
  await sequelize.sync({alter: true});
  console.log("✅ Schéma Base de données synchronisé.");

  // --- 1. USERS (Avec de vrais noms pour le réalisme) ---
  console.log('👤 Vérification des utilisateurs...');

  // Mot de passe pour tous : "123"
  const defaultPasswordHash = await bcrypt.hash('123', 10);

  const users = [
    // --- ADMINS ---
    {
      username: 'j.desvaux',
      email: 'jerome.desvaux@ferme.com',
      roles: ['ADMIN', 'USER'],
      avatar: 'assets/avatars/admin.png', // Gardez vos images si elles existent
      password: defaultPasswordHash
    },
    {
      username: 'a.camuset',
      email: 'arnaud.camuset@ferme.com',
      roles: ['ADMIN'],
      avatar: 'manage_accounts', // Icône Material si pas d'image
      password: defaultPasswordHash
    },

    // --- DEVOPS & INFRA ---
    {
      username: 'lucas.b',
      email: 'lucas.bernard@ferme.com',
      roles: ['USER'],
      avatar: 'engineering',
      password: defaultPasswordHash
    },
    {
      username: 'thomas.w',
      email: 'thomas.weber@ferme.com',
      roles: ['USER'],
      avatar: 'router',
      password: defaultPasswordHash
    },

    // --- DATA SCIENTISTS (Utilisateurs de GPU) ---
    {
      username: 'e.petit',
      email: 'elodie.petit@ferme.com',
      roles: ['USER'],
      avatar: 'psychology',
      password: defaultPasswordHash
    },
    {
      username: 'm.yilmaz',
      email: 'mehmet.yilmaz@ferme.com',
      roles: ['USER'],
      avatar: 'bar_chart',
      password: defaultPasswordHash
    },
    {
      username: 'a.durand',
      email: 'alice.durand@ferme.com',
      roles: ['USER'],
      avatar: 'school',
      password: defaultPasswordHash
    }
  ];

  for (const u of users) {
    await User.findOrCreate({
      where: {username: u.username},
      defaults: u
    });
  }

  // 2. APPLICATIONS
  const apps = [
    {name: 'Python Script', description: 'Script Python standard'},
    {name: 'Docker Job', description: 'Conteneur éphémère'},
    {name: 'NodeJS Server', description: 'Serveur Web Node'},
    {name: 'Backend Service', description: 'Service permanent'}
  ];
  for (const app of apps) {
    await Application.findOrCreate({where: {name: app.name}, defaults: app});
  }

  // 3. GATEWAYS
  const gateways = [
    {name: 'Gateway Production', ipAddress: '10.0.0.254', status: 'Online'},
    {name: 'Gateway Backup', ipAddress: '10.0.0.253', status: 'Offline'}
  ];
  for (const gw of gateways) {
    await Gateway.findOrCreate({where: {name: gw.name}, defaults: gw});
  }

  // 4. NAMESPACES
  const namespaces = [
    {name: 'backend-core', owner: 'DevOps Team', quotaGpu: 10},
    {name: 'ai-research', owner: 'Data Science', quotaGpu: 50}
  ];
  for (const ns of namespaces) {
    await Namespace.findOrCreate({where: {name: ns.name}, defaults: ns});
  }

  // 5. AI MODELS
  const models = [
    {
      idName: 'gpt-4-turbo',
      name: 'GPT-4 Turbo (API)',
      type: 'LLM',
      vramRequiredGb: 0,
      source: 'OpenAI',
      tags: ['Cloud']
    },
    {idName: 'bert-base', name: 'Bert Base', type: 'NLP', vramRequiredGb: 2, source: 'HuggingFace', tags: ['Local']}
  ];
  for (const model of models) {
    await AiModel.findOrCreate({where: {idName: model.idName}, defaults: model});
  }

  // 6. CLUSTERS & NODES (Correction ici !)
  const [cluster] = await Cluster.findOrCreate({
    where: {name: 'Cluster BACKEND (Live)'},
    defaults: {
      total_physical_gpus: 20, total_virtual_gpus: 20,
      total_memory_gb: 1024, total_cpu_cores: 256
    }
  });

  // Vérification explicite : Est-ce que ce cluster a des nœuds ?
  const nodeCount = await Node.count({where: {ClusterId: cluster.id}});

  if (nodeCount === 0) {
    console.log('os Nœuds manquants détectés, création en cours...');
    const node1 = await Node.create({
      name: 'SRV-01', ClusterId: cluster.id,
      owner: 'Backend Team', physical_gpus: 10, virtual_gpus: 10,
      total_memory_gb: 512, total_cpu_cores: 128
    });

    await Node.create({
      name: 'SRV-02', ClusterId: cluster.id,
      owner: 'Admin', physical_gpus: 10, virtual_gpus: 10,
      total_memory_gb: 512, total_cpu_cores: 128
    });

    // Recréation de la réservation démo si nécessaire
    const nsBackend = await Namespace.findOne({where: {name: 'backend-core'}});
    const appService = await Application.findOne({where: {name: 'Backend Service'}});

    if (nsBackend && appService) {
      await Reservation.create({
        namespaceName: nsBackend.name,
        NamespaceId: nsBackend.id,
        applicationName: appService.name,
        ApplicationId: appService.id,
        modelName: '-',
        gpusRequested: 5, memoryRequest: 64, cpuRequest: 16,
        NodeId: node1.id,
        status: 'Running', isActive: true
      });
    }
  }
}

// N'oubliez pas de garder l'export à la fin du fichier
module.exports = {
  sequelize, User, AiModel, Cluster, Node, Reservation,
  Gateway, Application, Namespace,
  initDb
};
