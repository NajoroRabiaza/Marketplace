const User = require('../model/User');

// Couche d'acces aux donnees pour les utilisateurs
module.exports = {
    // Cherche un utilisateur par son email
    findByEmail: (email) => User.findOne({ email }),

    // Cherche un utilisateur par son ID
    findById: (id) => User.findById(id),

    // Cree et sauvegarde un nouvel utilisateur
    create: (data) => User.create(data)
};
