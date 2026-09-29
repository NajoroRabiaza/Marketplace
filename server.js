require('./src/config');

const express = require('express');
const path = require('path');
const { connectDB } = require('./src/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware pour lire le JSON dans les requetes
app.use(express.json());


// Interface Swagger disponible sur http://localhost:5000/api-docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Sert les fichiers statiques du frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Toutes les routes de l'API sont prefixees par /api
app.use('/api', routes);

// Si aucune route de l'API ne correspond, on repond 404 en JSON
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Route introuvable' });
});

// Middleware de gestion des erreurs (doit etre en dernier)
app.use(errorHandler);

// Demarre la base de donnees puis le serveur
async function demarrer() {
    // Sans cle secrete, les connexions ne peuvent pas fonctionner
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET est manquant. Copiez .env.example vers .env (voir le README).');
        process.exit(1);
    }

    try {
        await connectDB();
    } catch (err) {
        console.error('Impossible de se connecter a MongoDB : ' + err.message);
        console.error('Verifiez que MongoDB est lance et que MONGO_URI est correct (voir le README).');
        process.exit(1);
    }

    app.listen(process.env.PORT, () => {
        console.log(`Marketplace demarree sur http://localhost:${process.env.PORT}`);
    });
}

// On demarre le serveur seulement si ce fichier est lance directement
// (pas quand il est importe dans les tests)
if (require.main === module) {
    demarrer();
}

module.exports = app;
