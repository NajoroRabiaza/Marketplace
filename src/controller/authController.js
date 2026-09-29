const authService = require('../service/authService');

module.exports = {
    // POST /api/auth/inscription
    async inscrire(req, res, next) {
        try {
            const resultat = await authService.inscrire(req.body);
            res.status(201).json(resultat);
        } catch (err) {
            // On passe l'erreur au gestionnaire d'erreurs (middleware/errorHandler.js)
            next(err);
        }
    },

    // POST /api/auth/connexion
    async connecter(req, res, next) {
        try {
            const resultat = await authService.connecter(req.body);
            res.json(resultat);
        } catch (err) {
            next(err);
        }
    },

    // GET /api/auth/moi  (route protegee - retourne l'utilisateur connecte)
    moi(req, res) {
        const u = req.utilisateur;
        res.json({
            id: u._id,
            nom: u.nom,
            email: u.email,
            role: u.role
        });
    }
};
