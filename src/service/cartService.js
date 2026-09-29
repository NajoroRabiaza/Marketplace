const cartRepo = require('../repository/cartRepository');
const productRepo = require('../repository/productRepository');
const creerErreur = require('../utils/creerErreur');
const idDe = require('../utils/idDe');

module.exports = {
    // Recupere le panier d'un client ou en cree un s'il n'existe pas encore
    async obtenirPanier(clientId) {
        let panier = await cartRepo.findByClientId(clientId);
        if (!panier) {
            return cartRepo.create(clientId);
        }

        // Si un vendeur a supprime un produit, on le retire aussi du panier
        const articlesValides = panier.articles.filter((a) => a.produitId);
        if (articlesValides.length !== panier.articles.length) {
            panier.articles = articlesValides;
            await cartRepo.save(panier);
        }
        return panier;
    },

    // Ajoute un produit au panier ou augmente sa quantite s'il est deja present
    async ajouterArticle(clientId, produitId, quantite) {
        if (!produitId || typeof produitId !== 'string') {
            throw creerErreur(400, 'Le produit est obligatoire');
        }
        if (!Number.isInteger(quantite) || quantite < 1) {
            throw creerErreur(400, 'La quantite doit etre un nombre entier d\'au moins 1');
        }

        // On verifie que le produit existe
        const produit = await productRepo.findById(produitId);
        if (!produit) {
            throw creerErreur(404, 'Produit introuvable');
        }

        let panier = await cartRepo.findByClientId(clientId);
        if (!panier) {
            panier = await cartRepo.create(clientId);
        }

        // On cherche si ce produit est deja dans le panier
        // (idDe permet de comparer meme si le produit a ete charge en entier)
        const indexExistant = panier.articles.findIndex(
            (a) => idDe(a.produitId) === idDe(produitId)
        );

        const quantiteTotale = indexExistant >= 0
            ? panier.articles[indexExistant].quantite + quantite
            : quantite;

        // On verifie que la quantite demandee ne depasse pas le stock disponible
        if (quantiteTotale > produit.stock) {
            throw creerErreur(400, `Stock insuffisant (disponible : ${produit.stock})`);
        }

        if (indexExistant >= 0) {
            // Produit deja present : on met a jour la quantite
            panier.articles[indexExistant].quantite = quantiteTotale;
        } else {
            // Nouveau produit dans le panier
            panier.articles.push({
                produitId,
                quantite,
                prixUnitaire: produit.prix
            });
        }

        await cartRepo.save(panier);

        // On recharge le panier pour renvoyer aussi le nom et le stock des produits
        return cartRepo.findByClientId(clientId);
    },

    // Retire un produit du panier
    async retirerArticle(clientId, produitId) {
        const panier = await cartRepo.findByClientId(clientId);
        if (!panier) {
            throw creerErreur(404, 'Panier introuvable');
        }

        const avant = panier.articles.length;
        panier.articles = panier.articles.filter(
            (a) => idDe(a.produitId) !== idDe(produitId)
        );

        if (panier.articles.length === avant) {
            throw creerErreur(404, 'Produit non trouve dans le panier');
        }

        await cartRepo.save(panier);
        return cartRepo.findByClientId(clientId);
    },

    // Vide entierement le panier
    vider(clientId) {
        return cartRepo.vider(clientId);
    }
};
