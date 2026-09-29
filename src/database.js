const mongoose = require('mongoose');

// Fonction qui etablit la connexion a MongoDB
async function connectDB(uri) {
    const mongoUri = uri || process.env.MONGO_URI;
    // Si MongoDB n'est pas lance, on abandonne apres 5 secondes (au lieu de 30)
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    // On n'affiche pas l'adresse complete : elle peut contenir un mot de passe
    console.log('Connexion MongoDB etablie');
}

// Fonction pour fermer la connexion (utile dans les tests)
async function disconnectDB() {
    await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
