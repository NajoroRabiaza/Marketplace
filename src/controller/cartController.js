const cartService = require('../service/cartService');

module.exports = {
    // GET /api/panier  (client seulement)
    async voir(req, res, next) {
        try {
            const panier = await cartService.obtenirPanier(req.utilisateur._id);
            res.json(panier);
        } catch (err) {
            next(err);
        }
    },

    // POST /api/panier/articles  (client seulement)
    async ajouter(req, res, next) {
        try {
            const { produitId, quantite = 1 } = req.body;
            const panier = await cartService.ajouterArticle(
                req.utilisateur._id,
                produitId,
                Number(quantite)
            );
            res.status(201).json(panier);
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/panier/articles/:produitId  (client seulement)
    async retirer(req, res, next) {
        try {
            const panier = await cartService.retirerArticle(
                req.utilisateur._id,
                req.params.produitId
            );
            res.json(panier);
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/panier  (vide tout le panier)
    async vider(req, res, next) {
        try {
            await cartService.vider(req.utilisateur._id);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
};
