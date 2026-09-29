const Cart = require('../model/Cart');

// Couche d'acces aux donnees pour le panier
module.exports = {
    // Cherche le panier d'un client et peuple les details des produits
    findByClientId: (clientId) =>
        Cart.findOne({ clientId }).populate('articles.produitId', 'nom prix stock'),

    // Cree un nouveau panier vide pour un client
    create: (clientId) => Cart.create({ clientId, articles: [] }),

    // Sauvegarde un panier modifie
    save: (cart) => cart.save(),

    // Vide completement le panier apres une commande validee
    vider: (clientId) => Cart.findOneAndUpdate({ clientId }, { articles: [] }, { new: true })
};
