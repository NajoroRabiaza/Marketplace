const Product = require('../model/Product');

// Couche d'acces aux donnees pour les produits
module.exports = {
    // Recupere tous les produits avec filtres optionnels et pagination
    // (les plus recents en premier pour que les pages restent stables)
    findAll: (where, skip, take) =>
        Product.find(where)
            .populate('vendeurId', 'nom email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(take),

    // Compte le total des produits (pour la pagination)
    count: (where) => Product.countDocuments(where),

    // Cherche un produit par son ID
    findById: (id) => Product.findById(id).populate('vendeurId', 'nom email'),

    // Cree un nouveau produit
    create: (data) => Product.create(data),

    // Met a jour un produit (runValidators : les regles du schema s'appliquent aussi ici)
    update: (id, data) =>
        Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

    // Supprime un produit par son ID
    delete: (id) => Product.findByIdAndDelete(id),

    // Retire du stock SEULEMENT s'il en reste assez.
    // La verification et la modification se font en une seule operation,
    // donc deux clients en meme temps ne peuvent pas depasser le stock.
    // Retourne null si le stock est insuffisant.
    decrementerStockSiDisponible: (id, quantite) =>
        Product.findOneAndUpdate(
            { _id: id, stock: { $gte: quantite } },
            { $inc: { stock: -quantite } },
            { new: true }
        ),

    // Remet du stock (utilise pour annuler une commande qui a echoue)
    incrementerStock: (id, quantite) =>
        Product.findByIdAndUpdate(id, { $inc: { stock: quantite } }, { new: true })
};
