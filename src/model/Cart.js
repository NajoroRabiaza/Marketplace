const mongoose = require('mongoose');

// Schema pour les articles dans le panier
const cartItemSchema = new mongoose.Schema({
    produitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantite: {
        type: Number,
        required: true,
        min: [1, 'La quantite doit etre au moins 1'],
        default: 1
    },
    // Prix capture au moment de l'ajout (pour eviter les surprises si le prix change)
    prixUnitaire: {
        type: Number,
        required: true
    }
}, { _id: false });

// Schema principal du panier - un seul panier par client
const cartSchema = new mongoose.Schema({
    // Reference vers le client proprietaire du panier
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    articles: [cartItemSchema]
}, {
    timestamps: true
});

// Calcul du total du panier (methode virtuelle, non stockee en base)
cartSchema.virtual('total').get(function () {
    return this.articles.reduce((somme, article) => {
        return somme + article.prixUnitaire * article.quantite;
    }, 0);
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
