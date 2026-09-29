const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema pour les utilisateurs
// role : 'vendeur' peut creer des produits, 'client' peut acheter
const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'email est obligatoire'],
        unique: true,
        lowercase: true,
        trim: true
    },
    motDePasse: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: [6, 'Le mot de passe doit avoir au moins 6 caracteres']
    },
    role: {
        type: String,
        enum: ['vendeur', 'client'],
        required: [true, 'Le role est obligatoire']
    }
}, {
    // Ajoute automatiquement createdAt et updatedAt
    timestamps: true
});

// Avant de sauvegarder, on hache le mot de passe
userSchema.pre('save', async function (next) {
    // Si le mot de passe n'a pas ete modifie, on passe directement
    if (!this.isModified('motDePasse')) return next();
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
    next();
});

// Methode pour comparer un mot de passe saisi avec celui hache en base
userSchema.methods.verifierMotDePasse = function (motDePasseSaisi) {
    return bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);
