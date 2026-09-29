const orderService = require('../service/orderService');

module.exports = {
    // POST /api/commandes  (passe une commande depuis le panier)
    async passer(req, res, next) {
        try {
            const commande = await orderService.passerCommande(req.utilisateur._id);
            res.status(201).json(commande);
        } catch (err) {
            next(err);
        }
    },

    // GET /api/commandes  (historique des commandes du client connecte)
    async historique(req, res, next) {
        try {
            const commandes = await orderService.historique(req.utilisateur._id);
            res.json(commandes);
        } catch (err) {
            next(err);
        }
    },

    // GET /api/commandes/:id  (detail d'une commande)
    async detail(req, res, next) {
        try {
            const commande = await orderService.detail(req.params.id, req.utilisateur._id);
            res.json(commande);
        } catch (err) {
            next(err);
        }
    }
};
