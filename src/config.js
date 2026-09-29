// Ce fichier charge le fichier .env et donne des valeurs par defaut
// pour que le projet demarre facilement sur n'importe quelle machine.
require('dotenv').config();

process.env.PORT = process.env.PORT || '5000';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marketplace';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Remarque : JWT_SECRET n'a pas de valeur par defaut, c'est une cle secrete.
// Elle doit venir du fichier .env (voir .env.example).
