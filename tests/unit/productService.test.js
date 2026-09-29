jest.mock('../../src/repository/productRepository');

const productService = require('../../src/service/productService');
const productRepo = require('../../src/repository/productRepository');

const vendeurId = 'vendeur_1';
const autreVendeurId = 'vendeur_2';

// Un produit tel que le repository le renvoie (le vendeur est charge avec populate)
const produitMock = {
    _id: 'produit_123',
    nom: 'Telephone Test',
    prix: 300000,
    stock: 10,
    vendeurId: { _id: vendeurId, nom: 'Vendeur Test' }
};

describe('productService - lister', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit utiliser page 1 et limit 10 par defaut', async () => {
        productRepo.findAll.mockResolvedValue([produitMock]);
        productRepo.count.mockResolvedValue(1);

        const resultat = await productService.lister({});

        expect(productRepo.findAll).toHaveBeenCalledWith({}, 0, 10);
        expect(resultat).toEqual({ produits: [produitMock], total: 1, page: 1, limit: 10 });
    });

    test('doit calculer le skip a partir de la page', async () => {
        productRepo.findAll.mockResolvedValue([]);
        productRepo.count.mockResolvedValue(25);

        const resultat = await productService.lister({ page: '3', limit: '5' });

        // page 3 avec 5 produits par page : on saute les 10 premiers
        expect(productRepo.findAll).toHaveBeenCalledWith({}, 10, 5);
        expect(resultat.page).toBe(3);
        expect(resultat.total).toBe(25);
    });

    test('doit filtrer par categorie et par vendeur', async () => {
        productRepo.findAll.mockResolvedValue([]);
        productRepo.count.mockResolvedValue(0);

        await productService.lister({ categorie: 'Electronique', vendeurId: 'abc' });

        const filtre = { categorie: 'Electronique', vendeurId: 'abc' };
        expect(productRepo.findAll).toHaveBeenCalledWith(filtre, 0, 10);
        expect(productRepo.count).toHaveBeenCalledWith(filtre);
    });

    test('doit corriger les valeurs de pagination absurdes', async () => {
        productRepo.findAll.mockResolvedValue([]);
        productRepo.count.mockResolvedValue(0);

        const resultat = await productService.lister({ page: '-4', limit: '99999' });

        expect(resultat.page).toBe(1);
        expect(resultat.limit).toBe(100);
    });

    test('doit ignorer un filtre categorie qui n\'est pas du texte simple', async () => {
        productRepo.findAll.mockResolvedValue([]);
        productRepo.count.mockResolvedValue(0);

        // Equivalent de ?categorie[$ne]=x dans l'URL
        await productService.lister({ categorie: { $ne: 'x' } });

        const filtre = productRepo.findAll.mock.calls[0][0];
        expect(typeof filtre.categorie).toBe('string');
    });
});

describe('productService - trouver', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit retourner le produit', async () => {
        productRepo.findById.mockResolvedValue(produitMock);
        expect(await productService.trouver('produit_123')).toEqual(produitMock);
    });

    test('doit lancer une erreur 404 si le produit n\'existe pas', async () => {
        productRepo.findById.mockResolvedValue(null);
        const erreur = await productService.trouver('inconnu').catch(e => e);
        expect(erreur.status).toBe(404);
    });
});

describe('productService - creer', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit prendre le vendeur du token et ignorer celui du corps de la requete', async () => {
        productRepo.create.mockResolvedValue(produitMock);

        await productService.creer(
            { nom: 'Casque', description: 'Un casque', prix: 5000, stock: 3, categorie: 'Audio', vendeurId: 'pirate' },
            vendeurId
        );

        expect(productRepo.create).toHaveBeenCalledWith({
            nom: 'Casque',
            description: 'Un casque',
            prix: 5000,
            stock: 3,
            categorie: 'Audio',
            vendeurId: vendeurId
        });
    });
});

describe('productService - modifier', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit modifier le produit si le vendeur est le proprietaire', async () => {
        productRepo.findById.mockResolvedValue(produitMock);
        productRepo.update.mockResolvedValue({ ...produitMock, nom: 'Nouveau nom' });

        const resultat = await productService.modifier('produit_123', { nom: 'Nouveau nom' }, vendeurId);

        expect(productRepo.update).toHaveBeenCalledWith('produit_123', { nom: 'Nouveau nom' });
        expect(resultat.nom).toBe('Nouveau nom');
    });

    test('ne doit jamais laisser changer le proprietaire du produit', async () => {
        productRepo.findById.mockResolvedValue(produitMock);
        productRepo.update.mockResolvedValue(produitMock);

        await productService.modifier(
            'produit_123',
            { prix: 100, vendeurId: autreVendeurId, _id: 'autre' },
            vendeurId
        );

        // Seul le prix est transmis a la base
        expect(productRepo.update).toHaveBeenCalledWith('produit_123', { prix: 100 });
    });

    test('doit refuser (403) si le vendeur n\'est pas le proprietaire', async () => {
        productRepo.findById.mockResolvedValue(produitMock);

        const erreur = await productService.modifier('produit_123', {}, autreVendeurId).catch(e => e);

        expect(erreur.status).toBe(403);
        expect(productRepo.update).not.toHaveBeenCalled();
    });

    test('doit lancer une erreur 404 si le produit n\'existe pas', async () => {
        productRepo.findById.mockResolvedValue(null);
        const erreur = await productService.modifier('id_inconnu', {}, vendeurId).catch(e => e);
        expect(erreur.status).toBe(404);
    });
});

describe('productService - supprimer', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit supprimer le produit du proprietaire', async () => {
        productRepo.findById.mockResolvedValue(produitMock);
        productRepo.delete.mockResolvedValue(produitMock);

        await productService.supprimer('produit_123', vendeurId);

        expect(productRepo.delete).toHaveBeenCalledWith('produit_123');
    });

    test('doit refuser (403) si le vendeur n\'est pas le proprietaire', async () => {
        productRepo.findById.mockResolvedValue(produitMock);

        const erreur = await productService.supprimer('produit_123', autreVendeurId).catch(e => e);

        expect(erreur.status).toBe(403);
        expect(productRepo.delete).not.toHaveBeenCalled();
    });

    test('doit lancer une erreur 404 si le produit n\'existe pas', async () => {
        productRepo.findById.mockResolvedValue(null);
        const erreur = await productService.supprimer('inconnu', vendeurId).catch(e => e);
        expect(erreur.status).toBe(404);
    });
});
