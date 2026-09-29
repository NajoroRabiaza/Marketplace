// Middleware de gestion globale des erreurs.
// Il est appele automatiquement quand un controller fait next(err).
function errorHandler(err, req, res, next) {
    // JSON mal ecrit dans le corps de la requete
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Le JSON envoye est invalide' });
    }

    // Erreur de validation Mongoose (champ obligatoire manquant, prix negatif...)
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    // Erreur de duplicate (email deja utilise par exemple)
    if (err.code === 11000) {
        const champ = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `Ce ${champ} est deja utilise` });
    }

    // Erreur d'ID MongoDB invalide
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    // Erreur que l'on a creee nous-memes avec un code (404, 403, 400...)
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    }

    // Erreur inattendue : on l'affiche dans la console et on repond 500
    console.error('Erreur serveur :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
}

module.exports = errorHandler;
