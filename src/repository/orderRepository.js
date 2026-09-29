const Order = require('../model/Order');

// Couche d'acces aux donnees pour les commandes
module.exports = {
    // Recupere toutes les commandes d'un client specifique
    findByClientId: (clientId) =>
        Order.find({ clientId })
            .populate('articles.produitId', 'nom')
            .sort({ createdAt: -1 }),

    // Cherche une commande par son ID
    findById: (id) => Order.findById(id).populate('articles.produitId', 'nom'),

    // Cree une nouvelle commande
    create: (data) => Order.create(data),

    // Met a jour le statut d'une commande
    updateStatut: (id, statut) =>
        Order.findByIdAndUpdate(id, { statut }, { new: true })
};
