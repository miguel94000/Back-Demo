// Import des modèles déclarés dans la solution
require("./modele/db")
require("./modele/user")

// Déclaration du serveur
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

//Déclartion des modules
const square = require("./module/square");
const authroute = require("./routes/auth");

// Implémentation des fonctionnalités du serveur
app.use(bodyParser.json({ limit: "50mb", extended: true}));

app.use(authroute);

app.get('/', (req, res) => {
   res.send(`hello voiture ${square.area(55)}`)
});

app.listen(port, () => {
    console.log(`Exemple app listing on port ${port}!`)
});

