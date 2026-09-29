// TESTS D'INTEGRATION DE L'API (sans base de donnees)
// On envoie de vraies requetes HTTP a l'application avec supertest.
// Les routes, les middlewares, les controllers et les services sont VRAIS.
// Seuls les repositories (l'acces a MongoDB) sont simules.
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/repository/userRepository');
jest.mock('../../src/repository/productRepository');
jest.mock('../../src/repository/cartRepository');
jest.mock('../../src/repository/orderRepository');

const app = require('../../server');
const userRepo = require('../../src/repository/userRepository');
const productRepo = require('../../src/repository/productRepository');
const cartRepo = require('../../src/repository/cartRepository');

// Fabrique un token valide pour un utilisateur, et fait croire a la "base" qu'il existe
function connecterEnTantQue(role, id = 'user_1') {
    userRepo.findById.mockResolvedValue({ _id: id, nom: 'Test', role });
    return 'Bearer ' + jwt.sign({ id, role }, process.env.JWT_SECRET);
}

beforeEach(() => jest.clearAllMocks());

describe('API - authentification', () => {
    test('POST /api/auth/inscription sans donnees renvoie 400', async () => {
        const res = await request(app).post('/api/auth/inscription').send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });

    test('POST /api/auth/inscription avec un role inconnu renvoie 400', async () => {
        const res = await request(app).post('/api/auth/inscription').send({
            nom: 'Test', email: 'a@b.mg', motDePasse: 'password123', role: 'admin'
        });

        expect(res.status).toBe(400);
    });

    test('POST /api/auth/inscription valide renvoie 201 et un token', async () => {
        userRepo.findByEmail.mockResolvedValue(null);
        userRepo.create.mockResolvedValue({
            _id: 'u1', nom: 'Test', email: 'a@b.mg', role: 'client'
        });

        const res = await request(app).post('/api/auth/inscription').send({
            nom: 'Test', email: 'a@b.mg', motDePasse: 'password123', role: 'client'
        });

        expect(res.status).toBe(201);
        expect(typeof res.body.token).toBe('string');
        expect(res.body.utilisateur.motDePasse).toBeUndefined();
    });

    test('POST /api/auth/connexion avec un mauvais compte renvoie 401', async () => {
        userRepo.findByEmail.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/connexion')
            .send({ email: 'nobody@test.mg', motDePasse: 'password123' });

        expect(res.status).toBe(401);
    });

    test('un JSON mal ecrit renvoie 400 (et non 500)', async () => {
        const res = await request(app)
            .post('/api/auth/connexion')
            .set('Content-Type', 'application/json')
            .send('{ ceci n\'est pas du json');

        expect(res.status).toBe(400);
    });
});

describe('API - routes protegees et roles', () => {
    test('GET /api/panier sans token renvoie 401', async () => {
        const res = await request(app).get('/api/panier');
        expect(res.status).toBe(401);
    });

    test('GET /api/panier avec un faux token renvoie 401', async () => {
        const res = await request(app).get('/api/panier').set('Authorization', 'Bearer faux.token.ici');
        expect(res.status).toBe(401);
    });

    test('GET /api/panier avec un vendeur renvoie 403', async () => {
        const res = await request(app).get('/api/panier').set('Authorization', connecterEnTantQue('vendeur'));
        expect(res.status).toBe(403);
    });

    test('POST /api/produits avec un client renvoie 403', async () => {
        const res = await request(app)
            .post('/api/produits')
            .set('Authorization', connecterEnTantQue('client'))
            .send({ nom: 'X' });

        expect(res.status).toBe(403);
        expect(productRepo.create).not.toHaveBeenCalled();
    });

    test('POST /api/commandes avec un vendeur renvoie 403', async () => {
        const res = await request(app).post('/api/commandes').set('Authorization', connecterEnTantQue('vendeur'));
        expect(res.status).toBe(403);
    });
});

describe('API - produits', () => {
    test('GET /api/produits est public et renvoie la pagination', async () => {
        productRepo.findAll.mockResolvedValue([{ nom: 'Telephone' }]);
        productRepo.count.mockResolvedValue(1);

        const res = await request(app).get('/api/produits?page=1&limit=5');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ produits: [{ nom: 'Telephone' }], total: 1, page: 1, limit: 5 });
    });

    test('GET /api/produits/:id inconnu renvoie 404', async () => {
        productRepo.findById.mockResolvedValue(null);

        const res = await request(app).get('/api/produits/123');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Produit introuvable');
    });

    test('un identifiant invalide renvoie 400 (erreur CastError de Mongoose)', async () => {
        const erreurCast = new Error('Cast to ObjectId failed');
        erreurCast.name = 'CastError';
        productRepo.findById.mockRejectedValue(erreurCast);

        const res = await request(app).get('/api/produits/pas-un-id');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Identifiant invalide');
    });

    test('une erreur de validation Mongoose renvoie 400', async () => {
        const erreurValidation = new Error('Validation failed');
        erreurValidation.name = 'ValidationError';
        erreurValidation.errors = { prix: { message: 'Le prix ne peut pas etre negatif' } };
        productRepo.create.mockRejectedValue(erreurValidation);

        const res = await request(app)
            .post('/api/produits')
            .set('Authorization', connecterEnTantQue('vendeur'))
            .send({ nom: 'X', prix: -5 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Le prix ne peut pas etre negatif');
    });

    test('POST /api/produits par un vendeur renvoie 201 et utilise le vendeur du token', async () => {
        productRepo.create.mockResolvedValue({ _id: 'p1', nom: 'Casque' });

        const res = await request(app)
            .post('/api/produits')
            .set('Authorization', connecterEnTantQue('vendeur', 'vendeur_42'))
            .send({ nom: 'Casque', description: 'd', prix: 100, stock: 2, categorie: 'Audio', vendeurId: 'pirate' });

        expect(res.status).toBe(201);
        expect(productRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ vendeurId: 'vendeur_42' })
        );
    });

    test('PUT /api/produits/:id d\'un autre vendeur renvoie 403', async () => {
        productRepo.findById.mockResolvedValue({ _id: 'p1', vendeurId: { _id: 'vendeur_A' } });

        const res = await request(app)
            .put('/api/produits/p1')
            .set('Authorization', connecterEnTantQue('vendeur', 'vendeur_B'))
            .send({ prix: 1 });

        expect(res.status).toBe(403);
        expect(productRepo.update).not.toHaveBeenCalled();
    });

    test('DELETE /api/produits/:id du proprietaire renvoie 204', async () => {
        productRepo.findById.mockResolvedValue({ _id: 'p1', vendeurId: { _id: 'vendeur_A' } });
        productRepo.delete.mockResolvedValue({});

        const res = await request(app)
            .delete('/api/produits/p1')
            .set('Authorization', connecterEnTantQue('vendeur', 'vendeur_A'));

        expect(res.status).toBe(204);
    });
});

describe('API - panier et commandes', () => {
    test('POST /api/panier/articles avec une quantite invalide renvoie 400', async () => {
        const res = await request(app)
            .post('/api/panier/articles')
            .set('Authorization', connecterEnTantQue('client'))
            .send({ produitId: 'p1', quantite: 0 });

        expect(res.status).toBe(400);
    });

    test('POST /api/commandes avec un panier vide renvoie 400', async () => {
        cartRepo.findByClientId.mockResolvedValue({ articles: [] });

        const res = await request(app)
            .post('/api/commandes')
            .set('Authorization', connecterEnTantQue('client'));

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Votre panier est vide');
    });
});

describe('API - routes inconnues', () => {
    test('une route /api inconnue renvoie 404 en JSON', async () => {
        const res = await request(app).get('/api/nimporte-quoi');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Route introuvable');
    });
});
