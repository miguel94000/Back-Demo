const express = require('express');
const app = express();
const port = 3000;
const square = require("./src/module/square");

app.get('/', (req, res) => {
   res.send(`hello voiture ${square.area(55)}`)
});

app.listen(port, () => {
    console.log(`Exemple app listing on port ${port}!`)
});

