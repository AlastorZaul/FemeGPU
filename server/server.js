// Exemple simple dans server/index.js
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Votre API de réallocation
app.post('/api/nodes/:nodeName/reallocate', (req, res) => {
  const nodeName = req.params.nodeName;

  // -----------
  // ICI : Ajoutez la vraie logique de réallocation
  // (ex: exécuter un script shell, appeler un orchestrateur, etc.)
  // -----------

  console.log(`Demande de réallocation reçue pour le nœud : ${nodeName}`);

  // Répondre au frontend que c'est OK
  res.json({message: `Réallocation pour ${nodeName} initiée.`});
});

app.listen(port, () => {
  console.log(`Serveur backend démarré sur http://localhost:${port}`);
});
