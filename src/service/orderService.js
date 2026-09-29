const orderRepo = require('../repository/orderRepository');
const cartRepo = require('../repository/cartRepository');
const productRepo = require('../repository/productRepository');
const creerErreur = require('../utils/creerErreur');
const idDe = require('../utils/idDe');

module.exports = {
    // Cree une commande a partir du panier actuel du client
    async passerCommande(clientId) {
        // On recupere le panier du client
        const panier = await cartRepo.findByClientId(clientId);

        if (!panier || panier.articles.length === 0) {
            throw creerErreur(400, 'Votre panier est vide');
        }

        // ETAPE 1 : on verifie chaque produit et on prepare les lignes de la commande
        // (le nom du produit est copie dans la commande pour garder une trace)
        const lignes = [];
        for (const article of panier.articles) {
            const produitId = idDe(article.produitId);
            const produit = await productRepo.findById(produitId);

            if (!produit) {
                throw creerErreur(400, 'Un produit de votre panier n\'existe plus');
            }
            if (produit.stock < article.quantite) {
                throw creerErreur(400, `Stock insuffisant pour : ${produit.nom}`);
            }

            lignes.push({
                produitId,
                nomProduit: produit.nom,
                quantite: article.quantite,
                prixUnitaire: article.prixUnitaire
            });
        }

        // ETAPE 2 : on reserve le stock puis on cree la commande.
        // Si quelque chose echoue, on remet le stock deja retire (annulation).
        const lignesReservees = [];
        let commande;
        try {
            for (const ligne of lignes) {
                // Cette operation refuse de descendre sous zero, meme si un autre client commande en meme temps
                const reserve = await productRepo.decrementerStockSiDisponible(
                    ligne.produitId,
                    ligne.quantite
                );
                if (!reserve) {
                    throw creerErreur(400, `Stock insuffisant pour : ${ligne.nomProduit}`);
                }
                lignesReservees.push(ligne);
            }

            // On calcule le montant total de la commande
            const montantTotal = lignes.reduce(
                (somme, l) => somme + l.prixUnitaire * l.quantite, 0
            );

            commande = await orderRepo.create({ clientId, articles: lignes, montantTotal });
        } catch (err) {
            // Annulation : on rend le stock qu'on avait deja retire
            for (const ligne of lignesReservees) {
                await productRepo.incrementerStock(ligne.produitId, ligne.quantite);
            }
            throw err;
        }

        // On vide le panier apres la commande confirmee
        await cartRepo.vider(clientId);

        return commande;
    },

    // Historique des commandes d'un client
    historique(clientId) {
        return orderRepo.findByClientId(clientId);
    },

    // Recupere le detail d'une commande specifique
    async detail(id, clientId) {
        const commande = await orderRepo.findById(id);
        if (!commande) {
            throw creerErreur(404, 'Commande introuvable');
        }

        // Un client ne peut voir que ses propres commandes
        if (idDe(commande.clientId) !== idDe(clientId)) {
            throw creerErreur(403, 'Acces refuse');
        }

        return commande;
    }
};
