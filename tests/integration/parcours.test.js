// TEST DE PARCOURS COMPLET AVEC UNE VRAIE BASE MONGODB
// Ce test simule un vrai scenario : inscription, publication d'un produit,
// panier, commande, historique... avec de vraies requetes HTTP et une vraie base.
//
// Il ne tourne que si MONGO_URI_TEST est defini (voir le README).
// ATTENTION : la base de test est VIDEE au debut, ne pas utiliser la base normale !
const request = require('supertest');

const uriTest = process.env.MONGO_URI_TEST;
const decrireSiMongo = uriTest ? describe : describe.skip;

decrireSiMongo('Parcours complet (vraie base de donnees)', () => {
    const mongoose = require('mongoose');
    const app = require('../../server');
    const { connectDB, disconnectDB } = require('../../src/database');

    // Les donnees partagees entre les etapes du scenario
    let vendeur, vendeur2, client, client2, produit;

    // Petite fonction pour s'inscrire et recuperer le token
    async function inscrire(nom, role) {
        const res = await request(app).post('/api/auth/inscription').send({
            nom,
            email: `${nom.toLowerCase().replace(/\s/g, '')}@test.mg`,
            motDePasse: 'password123',
            role
        });
        expect(res.status).toBe(201);
        return { token: 'Bearer ' + res.body.token, id: res.body.utilisateur.id };
    }

    beforeAll(async () => {
        await connectDB(uriTest);
        // On repart d'une base vide
        await mongoose.connection.dropDatabase();
        // On attend que les index (email unique...) soient crees
        await Promise.all(Object.values(mongoose.models).map(m => m.init()));
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await disconnectDB();
    });

    test('inscription des vendeurs et des clients', async () => {
        vendeur = await inscrire('Vendeur Un', 'vendeur');
        vendeur2 = await inscrire('Vendeur Deux', 'vendeur');
        client = await inscrire('Client Un', 'client');
        client2 = await inscrire('Client Deux', 'client');
    });

    test('refuse un email deja utilise (400) et un formulaire incomplet (400)', async () => {
        const doublon = await request(app).post('/api/auth/inscription').send({
            nom: 'Autre', email: 'clientun@test.mg', motDePasse: 'password123', role: 'client'
        });
        expect(doublon.status).toBe(400);

        const incomplet = await request(app).post('/api/auth/inscription').send({ nom: 'Sans email' });
        expect(incomplet.status).toBe(400);
    });

    test('connexion avec le bon et le mauvais mot de passe', async () => {
        const ok = await request(app)
            .post('/api/auth/connexion')
            .send({ email: 'clientun@test.mg', motDePasse: 'password123' });
        expect(ok.status).toBe(200);
        expect(ok.body.token).toBeDefined();

        const mauvais = await request(app)
            .post('/api/auth/connexion')
            .send({ email: 'clientun@test.mg', motDePasse: 'faux_mot_de_passe' });
        expect(mauvais.status).toBe(401);
    });

    test('un vendeur cree un produit, un client ne peut pas', async () => {
        const res = await request(app)
            .post('/api/produits')
            .set('Authorization', vendeur.token)
            .send({ nom: 'Telephone', description: 'Un telephone', prix: 350000, stock: 5, categorie: 'Electronique' });
        expect(res.status).toBe(201);
        produit = res.body;

        const refuse = await request(app)
            .post('/api/produits')
            .set('Authorization', client.token)
            .send({ nom: 'X', description: 'X', prix: 1, stock: 1, categorie: 'X' });
        expect(refuse.status).toBe(403);
    });

    test('un prix negatif ou un champ manquant renvoie 400 (pas 500)', async () => {
        const negatif = await request(app)
            .post('/api/produits')
            .set('Authorization', vendeur.token)
            .send({ nom: 'X', description: 'X', prix: -10, stock: 1, categorie: 'X' });
        expect(negatif.status).toBe(400);

        const manquant = await request(app)
            .post('/api/produits')
            .set('Authorization', vendeur.token)
            .send({ nom: 'Sans prix' });
        expect(manquant.status).toBe(400);
    });

    test('la liste des produits marche avec pagination et filtre par vendeur', async () => {
        const tous = await request(app).get('/api/produits');
        expect(tous.status).toBe(200);
        expect(tous.body.total).toBe(1);
        expect(tous.body.produits[0].vendeurId.nom).toBe('Vendeur Un');

        const autreVendeur = await request(app).get('/api/produits?vendeurId=' + vendeur2.id);
        expect(autreVendeur.body.total).toBe(0);

        const idInvalide = await request(app).get('/api/produits/pas-un-id');
        expect(idInvalide.status).toBe(400);
    });

    test('un autre vendeur ne peut pas modifier le produit, et le proprietaire ne peut pas le donner', async () => {
        const interdit = await request(app)
            .put('/api/produits/' + produit._id)
            .set('Authorization', vendeur2.token)
            .send({ prix: 1 });
        expect(interdit.status).toBe(403);

        // Le proprietaire essaie de changer le vendeurId : ce champ est ignore
        const modif = await request(app)
            .put('/api/produits/' + produit._id)
            .set('Authorization', vendeur.token)
            .send({ prix: 300000, vendeurId: vendeur2.id });
        expect(modif.status).toBe(200);
        expect(modif.body.prix).toBe(300000);
        expect(modif.body.vendeurId).toBe(vendeur.id);

        // Les regles du schema s'appliquent aussi a la modification
        const negatif = await request(app)
            .put('/api/produits/' + produit._id)
            .set('Authorization', vendeur.token)
            .send({ prix: -1 });
        expect(negatif.status).toBe(400);
    });

    // TEST DE NON-REGRESSION du bug du panier
    test('ajouter deux fois le meme produit augmente la quantite (une seule ligne)', async () => {
        await request(app).post('/api/panier/articles').set('Authorization', client.token)
            .send({ produitId: produit._id, quantite: 1 }).expect(201);
        const res = await request(app).post('/api/panier/articles').set('Authorization', client.token)
            .send({ produitId: produit._id, quantite: 2 }).expect(201);

        expect(res.body.articles).toHaveLength(1);
        expect(res.body.articles[0].quantite).toBe(3);
        expect(res.body.articles[0].produitId.nom).toBe('Telephone');
        expect(res.body.total).toBe(900000);
    });

    test('refuse une quantite plus grande que le stock (400)', async () => {
        const res = await request(app).post('/api/panier/articles').set('Authorization', client.token)
            .send({ produitId: produit._id, quantite: 10 });
        expect(res.status).toBe(400);
    });

    test('retirer un article du panier puis le remettre', async () => {
        const retrait = await request(app)
            .delete('/api/panier/articles/' + produit._id)
            .set('Authorization', client.token);
        expect(retrait.status).toBe(200);
        expect(retrait.body.articles).toHaveLength(0);

        // Retirer un article qui n'y est plus renvoie 404
        const encore = await request(app)
            .delete('/api/panier/articles/' + produit._id)
            .set('Authorization', client.token);
        expect(encore.status).toBe(404);

        await request(app).post('/api/panier/articles').set('Authorization', client.token)
            .send({ produitId: produit._id, quantite: 2 }).expect(201);
    });

    test('passer commande : stock diminue, panier vide, historique mis a jour', async () => {
        const commande = await request(app).post('/api/commandes').set('Authorization', client.token);
        expect(commande.status).toBe(201);
        expect(commande.body.montantTotal).toBe(600000);
        expect(commande.body.statut).toBe('en_attente');

        // Le stock est passe de 5 a 3
        const produitApres = await request(app).get('/api/produits/' + produit._id);
        expect(produitApres.body.stock).toBe(3);

        // Le panier est vide
        const panier = await request(app).get('/api/panier').set('Authorization', client.token);
        expect(panier.body.articles).toHaveLength(0);

        // L'historique contient la commande
        const historique = await request(app).get('/api/commandes').set('Authorization', client.token);
        expect(historique.body).toHaveLength(1);

        // Un autre client ne peut pas la lire
        const volee = await request(app)
            .get('/api/commandes/' + commande.body._id)
            .set('Authorization', client2.token);
        expect(volee.status).toBe(403);

        // Commander avec un panier vide est refuse
        const vide = await request(app).post('/api/commandes').set('Authorization', client.token);
        expect(vide.status).toBe(400);
    });

    test('deux clients qui commandent le dernier produit en meme temps : un seul gagne', async () => {
        const rare = (await request(app).post('/api/produits').set('Authorization', vendeur.token)
            .send({ nom: 'Produit rare', description: 'Dernier exemplaire', prix: 1000, stock: 1, categorie: 'Rare' })).body;

        // Les deux clients mettent le produit dans leur panier (le stock le permet encore)
        for (const c of [client, client2]) {
            await request(app).post('/api/panier/articles').set('Authorization', c.token)
                .send({ produitId: rare._id, quantite: 1 }).expect(201);
        }

        // Les deux commandent exactement en meme temps
        const [r1, r2] = await Promise.all([
            request(app).post('/api/commandes').set('Authorization', client.token),
            request(app).post('/api/commandes').set('Authorization', client2.token)
        ]);

        const statuts = [r1.status, r2.status].sort();
        expect(statuts).toEqual([201, 400]);

        // Le stock ne doit jamais etre negatif
        const apres = await request(app).get('/api/produits/' + rare._id);
        expect(apres.body.stock).toBe(0);
    });

    test('un produit supprime disparait du panier sans le casser', async () => {
        const ephemere = (await request(app).post('/api/produits').set('Authorization', vendeur.token)
            .send({ nom: 'Ephemere', description: 'Sera supprime', prix: 500, stock: 4, categorie: 'Test' })).body;

        await request(app).post('/api/panier/articles').set('Authorization', client.token)
            .send({ produitId: ephemere._id, quantite: 1 }).expect(201);

        await request(app).delete('/api/produits/' + ephemere._id)
            .set('Authorization', vendeur.token).expect(204);

        const panier = await request(app).get('/api/panier').set('Authorization', client.token);
        expect(panier.status).toBe(200);
        expect(panier.body.articles).toHaveLength(0);
    });
});
