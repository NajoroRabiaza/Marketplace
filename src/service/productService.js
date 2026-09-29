const productRepo = require('../repository/productRepository');
const creerErreur = require('../utils/creerErreur');
const idDe = require('../utils/idDe');

// Les seuls champs qu'un vendeur a le droit d'envoyer.
// Cela l'empeche de changer le proprietaire du produit (vendeurId) par exemple.
const CHAMPS_AUTORISES = ['nom', 'description', 'prix', 'stock', 'categorie'];

function garderChampsAutorises(data) {
    const propre = {};
    for (const champ of CHAMPS_AUTORISES) {
        if (data[champ] !== undefined) {
            propre[champ] = data[champ];
        }
    }
    return propre;
}

module.exports = {
    // Liste les produits avec pagination et filtres optionnels (categorie, vendeur)
    async lister({ categorie, vendeurId, page = 1, limit = 10 }) {
        // On corrige les valeurs bizarres : page >= 1 et limit entre 1 et 100
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        // String() garantit qu'on filtre avec du texte simple
        const where = {};
        if (categorie) where.categorie = String(categorie);
        if (vendeurId) where.vendeurId = String(vendeurId);

        // On lance les deux requetes en meme temps pour gagner du temps
        const [produits, total] = await Promise.all([
            productRepo.findAll(where, skip, limitNum),
            productRepo.count(where)
        ]);

        return { produits, total, page: pageNum, limit: limitNum };
    },

    // Recupere un seul produit par son ID
    async trouver(id) {
        const produit = await productRepo.findById(id);
        if (!produit) {
            throw creerErreur(404, 'Produit introuvable');
        }
        return produit;
    },

    // Cree un nouveau produit - reserve aux vendeurs
    // Le vendeurId vient du token (jamais du corps de la requete)
    creer(data, vendeurId) {
        return productRepo.create({ ...garderChampsAutorises(data), vendeurId });
    },

    // Modifie un produit - le vendeur doit etre le proprietaire
    async modifier(id, data, vendeurId) {
        const produit = await productRepo.findById(id);
        if (!produit) {
            throw creerErreur(404, 'Produit introuvable');
        }

        // On verifie que c'est bien le vendeur du produit qui veut le modifier
        if (idDe(produit.vendeurId) !== idDe(vendeurId)) {
            throw creerErreur(403, 'Vous ne pouvez modifier que vos propres produits');
        }

        return productRepo.update(id, garderChampsAutorises(data));
    },

    // Supprime un produit - le vendeur doit etre le proprietaire
    async supprimer(id, vendeurId) {
        const produit = await productRepo.findById(id);
        if (!produit) {
            throw creerErreur(404, 'Produit introuvable');
        }

        if (idDe(produit.vendeurId) !== idDe(vendeurId)) {
            throw creerErreur(403, 'Vous ne pouvez supprimer que vos propres produits');
        }

        return productRepo.delete(id);
    }
};
