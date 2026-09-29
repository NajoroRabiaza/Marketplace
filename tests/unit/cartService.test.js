const mongoose = require('mongoose');

jest.mock('../../src/repository/cartRepository');
jest.mock('../../src/repository/productRepository');

const cartService = require('../../src/service/cartService');
const cartRepo = require('../../src/repository/cartRepository');
const productRepo = require('../../src/repository/productRepository');

// On utilise les VRAIS modeles Mongoose (sans base de donnees) pour fabriquer
// des paniers qui ressemblent exactement a ceux renvoyes par le repository.
// Avant, les tests utilisaient des faux objets simples, et ils ne detectaient pas un bug.
const Cart = require('../../src/model/Cart');
const Product = require('../../src/model/Product');

const clientId = new mongoose.Types.ObjectId();

// Cree un vrai produit (stock de 10 par defaut)
function creerProduit(stock = 10) {
    return new Product({
        nom: 'Telephone Test',
        description: 'Un telephone',
        prix: 300000,
        stock,
        categorie: 'Electronique',
        vendeurId: new mongoose.Types.ObjectId()
    });
}

// Cree un vrai panier ou les produits sont "peuples" (charges en entier),
// comme le fait cartRepository.findByClientId avec populate
function creerPanier(lignes = []) {
    return new Cart({
        clientId,
        articles: lignes.map(({ produit, quantite }) => ({
            produitId: produit,
            quantite,
            prixUnitaire: produit.prix
        }))
    });
}

// Les mocks du repository : save renvoie le panier, findByClientId aussi
function brancherPanier(panier) {
    cartRepo.findByClientId.mockResolvedValue(panier);
    cartRepo.save.mockImplementation(async (p) => p);
}

describe('cartService - obtenirPanier', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit retourner le panier existant', async () => {
        const panier = creerPanier([{ produit: creerProduit(), quantite: 2 }]);
        brancherPanier(panier);

        const resultat = await cartService.obtenirPanier(clientId);

        expect(resultat.articles).toHaveLength(1);
    });

    test('doit creer un panier si le client n\'en a pas encore', async () => {
        cartRepo.findByClientId.mockResolvedValue(null);
        cartRepo.create.mockResolvedValue({ clientId, articles: [] });

        const resultat = await cartService.obtenirPanier(clientId);

        expect(cartRepo.create).toHaveBeenCalledWith(clientId);
        expect(resultat.articles).toHaveLength(0);
    });

    test('doit retirer du panier les produits supprimes par leur vendeur', async () => {
        const panier = creerPanier([{ produit: creerProduit(), quantite: 1 }]);
        // On simule un produit supprime : populate met null a la place du produit
        panier.articles[0].produitId = null;
        brancherPanier(panier);

        const resultat = await cartService.obtenirPanier(clientId);

        expect(resultat.articles).toHaveLength(0);
        expect(cartRepo.save).toHaveBeenCalled();
    });
});

describe('cartService - ajouterArticle', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit ajouter un nouveau produit au panier', async () => {
        const produit = creerProduit();
        const panier = creerPanier();
        productRepo.findById.mockResolvedValue(produit);
        brancherPanier(panier);

        await cartService.ajouterArticle(clientId, produit._id.toString(), 1);

        expect(panier.articles).toHaveLength(1);
        expect(panier.articles[0].quantite).toBe(1);
        expect(panier.articles[0].prixUnitaire).toBe(300000);
    });

    // TEST DE NON-REGRESSION : ce test echouait avant la correction du bug
    test('doit augmenter la quantite (sans doublon) si le produit est deja dans le panier', async () => {
        const produit = creerProduit();
        const panier = creerPanier([{ produit, quantite: 2 }]);
        productRepo.findById.mockResolvedValue(produit);
        brancherPanier(panier);

        await cartService.ajouterArticle(clientId, produit._id.toString(), 3);

        // Toujours une seule ligne, avec 2 + 3 = 5
        expect(panier.articles).toHaveLength(1);
        expect(panier.articles[0].quantite).toBe(5);
    });

    test('doit refuser si le produit n\'existe pas (404)', async () => {
        productRepo.findById.mockResolvedValue(null);

        const erreur = await cartService
            .ajouterArticle(clientId, 'inconnu', 1)
            .catch(e => e);

        expect(erreur.status).toBe(404);
    });

    test('doit refuser si la quantite depasse le stock (400)', async () => {
        const produit = creerProduit(3);
        productRepo.findById.mockResolvedValue(produit);
        brancherPanier(creerPanier());

        const erreur = await cartService
            .ajouterArticle(clientId, produit._id.toString(), 5)
            .catch(e => e);

        expect(erreur.status).toBe(400);
        expect(erreur.message).toContain('Stock insuffisant');
    });

    test('doit compter ce qui est deja dans le panier pour verifier le stock', async () => {
        const produit = creerProduit(4);
        const panier = creerPanier([{ produit, quantite: 3 }]);
        productRepo.findById.mockResolvedValue(produit);
        brancherPanier(panier);

        // 3 dans le panier + 2 demandes = 5, mais il n'y en a que 4
        const erreur = await cartService
            .ajouterArticle(clientId, produit._id.toString(), 2)
            .catch(e => e);

        expect(erreur.status).toBe(400);
    });

    test.each([
        ['zero', 0],
        ['negative', -2],
        ['decimale', 1.5],
        ['pas un nombre', NaN]
    ])('doit refuser une quantite %s (400)', async (nomDuCas, quantite) => {
        const erreur = await cartService
            .ajouterArticle(clientId, 'produit_1', quantite)
            .catch(e => e);

        expect(erreur.status).toBe(400);
        expect(productRepo.findById).not.toHaveBeenCalled();
    });

    test('doit refuser un produit qui n\'est pas un texte (400)', async () => {
        const erreur = await cartService
            .ajouterArticle(clientId, { $ne: null }, 1)
            .catch(e => e);

        expect(erreur.status).toBe(400);
    });
});

describe('cartService - retirerArticle', () => {
    beforeEach(() => jest.clearAllMocks());

    // TEST DE NON-REGRESSION : ce test echouait aussi avant la correction
    test('doit retirer un produit du panier', async () => {
        const produit = creerProduit();
        const autre = creerProduit();
        const panier = creerPanier([
            { produit, quantite: 1 },
            { produit: autre, quantite: 2 }
        ]);
        brancherPanier(panier);

        await cartService.retirerArticle(clientId, produit._id.toString());

        expect(panier.articles).toHaveLength(1);
        expect(panier.articles[0].quantite).toBe(2);
    });

    test('doit lancer une erreur 404 si le produit n\'est pas dans le panier', async () => {
        brancherPanier(creerPanier([{ produit: creerProduit(), quantite: 1 }]));

        const erreur = await cartService
            .retirerArticle(clientId, new mongoose.Types.ObjectId().toString())
            .catch(e => e);

        expect(erreur.status).toBe(404);
    });

    test('doit lancer une erreur 404 si le client n\'a pas de panier', async () => {
        cartRepo.findByClientId.mockResolvedValue(null);

        const erreur = await cartService.retirerArticle(clientId, 'x').catch(e => e);

        expect(erreur.status).toBe(404);
    });
});

describe('cartService - vider', () => {
    test('doit appeler le repository pour vider le panier', () => {
        cartService.vider(clientId);
        expect(cartRepo.vider).toHaveBeenCalledWith(clientId);
    });
});
