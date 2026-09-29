const mongoose = require('mongoose');

// Schema pour chaque ligne d'une commande
const orderItemSchema = new mongoose.Schema({
    produitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    nomProduit: {
        type: String,
        required: true
    },
    quantite: {
        type: Number,
        required: true,
        min: 1
    },
    prixUnitaire: {
        type: Number,
        required: true
    }
}, { _id: false });

// Schema principal d'une commande
const orderSchema = new mongoose.Schema({
    // Reference vers le client qui a passe la commande
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    articles: [orderItemSchema],
    montantTotal: {
        type: Number,
        required: true
    },
    // Statut de la commande
    statut: {
        type: String,
        enum: ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'],
        default: 'en_attente'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
