const mongoose = require('mongoose');

// Schema pour les produits publies par les vendeurs
const productSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom du produit est obligatoire'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description est obligatoire'],
        trim: true
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est obligatoire'],
        min: [0, 'Le prix ne peut pas etre negatif']
    },
    stock: {
        type: Number,
        required: [true, 'Le stock est obligatoire'],
        min: [0, 'Le stock ne peut pas etre negatif'],
        default: 0
    },
    categorie: {
        type: String,
        required: [true, 'La categorie est obligatoire'],
        trim: true
    },
    // Reference vers le vendeur qui a cree ce produit
    vendeurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
