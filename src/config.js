// src/config.js
// Charge les variables d'environnement et verifie les valeurs obligatoires
require('dotenv').config();

// On arrete le serveur immediatement si une variable critique est absente
if (!process.env.JWT_SECRET) {
    console.error('ERREUR : JWT_SECRET est manquant dans le fichier .env');
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error('ERREUR : MONGO_URI est manquant dans le fichier .env');
    process.exit(1);
}

// On exporte les valeurs pour les utiliser partout dans le projet
module.exports = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
