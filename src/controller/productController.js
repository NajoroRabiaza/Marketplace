const productService = require('../service/productService');

module.exports = {
    // GET /api/produits
    async lister(req, res, next) {
        try {
            const resultat = await productService.lister(req.query);
            res.json(resultat);
        } catch (err) {
            next(err);
        }
    },

    // GET /api/produits/:id
    async trouver(req, res, next) {
        try {
            const produit = await productService.trouver(req.params.id);
            res.json(produit);
        } catch (err) {
            next(err);
        }
    },

    // POST /api/produits  (vendeur seulement)
    async creer(req, res, next) {
        try {
            // Le vendeur connecte devient le proprietaire du produit
            const produit = await productService.creer(req.body, req.utilisateur._id);
            res.status(201).json(produit);
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/produits/:id  (vendeur proprietaire seulement)
    async modifier(req, res, next) {
        try {
            const produit = await productService.modifier(
                req.params.id,
                req.body,
                req.utilisateur._id
            );
            res.json(produit);
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/produits/:id  (vendeur proprietaire seulement)
    async supprimer(req, res, next) {
        try {
            await productService.supprimer(req.params.id, req.utilisateur._id);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
};
