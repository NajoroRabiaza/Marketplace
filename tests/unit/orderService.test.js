const mongoose = require('mongoose');

jest.mock('../../src/repository/orderRepository');
jest.mock('../../src/repository/cartRepository');
jest.mock('../../src/repository/productRepository');

const orderService = require('../../src/service/orderService');
const orderRepo = require('../../src/repository/orderRepository');
const cartRepo = require('../../src/repository/cartRepository');
const productRepo = require('../../src/repository/productRepository');

// Vrais modeles Mongoose (sans base) pour fabriquer un panier realiste
const Cart = require('../../src/model/Cart');
const Product = require('../../src/model/Product');

const clientId = new mongoose.Types.ObjectId();

function creerProduit(nom, stock = 10) {
    return new Product({
        nom,
        description: 'Description',
        prix: 300000,
        stock,
        categorie: 'Electronique',
        vendeurId: new mongoose.Types.ObjectId()
    });
}

// Panier dont les produits sont charges en entier (comme avec populate)
function creerPanier(lignes) {
    return new Cart({
        clientId,
        articles: lignes.map(({ produit, quantite }) => ({
            produitId: produit,
            quantite,
            prixUnitaire: produit.prix
        }))
    });
}

// Configure les mocks pour un panier donne : findById renvoie le bon produit
function preparer(panier, produits) {
    cartRepo.findByClientId.mockResolvedValue(panier);
    productRepo.findById.mockImplementation(async (id) =>
        produits.find(p => p._id.toString() === String(id)) || null
    );
    productRepo.decrementerStockSiDisponible.mockResolvedValue({});
    productRepo.incrementerStock.mockResolvedValue({});
    orderRepo.create.mockImplementation(async (data) => ({ ...data, statut: 'en_attente' }));
    cartRepo.vider.mockResolvedValue(true);
}

describe('orderService - passerCommande', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit creer la commande, retirer le stock et vider le panier', async () => {
        const telephone = creerProduit('Telephone');
        const casque = creerProduit('Casque');
        const panier = creerPanier([
            { produit: telephone, quantite: 2 },
            { produit: casque, quantite: 1 }
        ]);
        preparer(panier, [telephone, casque]);

        const commande = await orderService.passerCommande(clientId);

        // 2 x 300000 + 1 x 300000
        expect(commande.montantTotal).toBe(900000);
        expect(commande.articles).toHaveLength(2);
        expect(commande.articles[0].nomProduit).toBe('Telephone');
        expect(productRepo.decrementerStockSiDisponible).toHaveBeenCalledWith(telephone._id.toString(), 2);
        expect(productRepo.decrementerStockSiDisponible).toHaveBeenCalledWith(casque._id.toString(), 1);
        expect(cartRepo.vider).toHaveBeenCalledWith(clientId);
    });

    test('doit refuser si le panier est vide (400)', async () => {
        cartRepo.findByClientId.mockResolvedValue({ clientId, articles: [] });

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.status).toBe(400);
        expect(orderRepo.create).not.toHaveBeenCalled();
    });

    test('doit refuser si le client n\'a pas de panier (400)', async () => {
        cartRepo.findByClientId.mockResolvedValue(null);

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.status).toBe(400);
    });

    test('doit refuser si le stock est insuffisant, sans rien modifier', async () => {
        const telephone = creerProduit('Telephone', 1);
        preparer(creerPanier([{ produit: telephone, quantite: 5 }]), [telephone]);

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.status).toBe(400);
        expect(erreur.message).toContain('Telephone');
        expect(productRepo.decrementerStockSiDisponible).not.toHaveBeenCalled();
        expect(orderRepo.create).not.toHaveBeenCalled();
        expect(cartRepo.vider).not.toHaveBeenCalled();
    });

    test('doit refuser si un produit du panier n\'existe plus (400)', async () => {
        const telephone = creerProduit('Telephone');
        // Le produit est dans le panier mais plus dans la base
        preparer(creerPanier([{ produit: telephone, quantite: 1 }]), []);

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.status).toBe(400);
        expect(orderRepo.create).not.toHaveBeenCalled();
    });

    test('doit annuler (rendre le stock) si un autre client a pris le dernier produit', async () => {
        const telephone = creerProduit('Telephone');
        const casque = creerProduit('Casque');
        preparer(creerPanier([
            { produit: telephone, quantite: 2 },
            { produit: casque, quantite: 1 }
        ]), [telephone, casque]);

        // Le premier produit est reserve, mais le deuxieme n'a plus de stock (vole par un autre client)
        productRepo.decrementerStockSiDisponible
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce(null);

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.status).toBe(400);
        // Le stock du premier produit est remis
        expect(productRepo.incrementerStock).toHaveBeenCalledTimes(1);
        expect(productRepo.incrementerStock).toHaveBeenCalledWith(telephone._id.toString(), 2);
        expect(orderRepo.create).not.toHaveBeenCalled();
        expect(cartRepo.vider).not.toHaveBeenCalled();
    });

    test('doit rendre le stock si la creation de la commande echoue', async () => {
        const telephone = creerProduit('Telephone');
        preparer(creerPanier([{ produit: telephone, quantite: 2 }]), [telephone]);
        orderRepo.create.mockRejectedValue(new Error('Panne de la base'));

        const erreur = await orderService.passerCommande(clientId).catch(e => e);

        expect(erreur.message).toBe('Panne de la base');
        expect(productRepo.incrementerStock).toHaveBeenCalledWith(telephone._id.toString(), 2);
        expect(cartRepo.vider).not.toHaveBeenCalled();
    });
});

describe('orderService - historique et detail', () => {
    beforeEach(() => jest.clearAllMocks());

    test('historique doit retourner les commandes du client', async () => {
        orderRepo.findByClientId.mockResolvedValue([{ _id: 'c1' }, { _id: 'c2' }]);

        const resultat = await orderService.historique(clientId);

        expect(resultat).toHaveLength(2);
        expect(orderRepo.findByClientId).toHaveBeenCalledWith(clientId);
    });

    test('detail doit retourner la commande du client', async () => {
        orderRepo.findById.mockResolvedValue({ _id: 'c1', clientId });

        const resultat = await orderService.detail('c1', clientId);

        expect(resultat._id).toBe('c1');
    });

    test('detail doit refuser (403) la commande d\'un autre client', async () => {
        orderRepo.findById.mockResolvedValue({ _id: 'c1', clientId: new mongoose.Types.ObjectId() });

        const erreur = await orderService.detail('c1', clientId).catch(e => e);

        expect(erreur.status).toBe(403);
    });

    test('detail doit lancer une erreur 404 si la commande n\'existe pas', async () => {
        orderRepo.findById.mockResolvedValue(null);

        const erreur = await orderService.detail('inconnue', clientId).catch(e => e);

        expect(erreur.status).toBe(404);
    });
});
