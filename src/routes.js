const express = require('express');
const router = express.Router();

const authController = require('./controller/authController');
const productController = require('./controller/productController');
const cartController = require('./controller/cartController');
const orderController = require('./controller/orderController');
const { proteger, autoriser } = require('./middleware/auth');

// Routes d'authentification

/**
 * @swagger
 * /api/auth/inscription:
 *   post:
 *     summary: Creer un compte
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nom: Tiana Client
 *             email: tiana@client.mg
 *             motDePasse: password123
 *             role: client
 *     responses:
 *       201:
 *         description: Compte cree, token retourne
 *       400:
 *         description: Email deja utilise ou donnees invalides
 */
router.post('/auth/inscription', authController.inscrire);

/**
 * @swagger
 * /api/auth/connexion:
 *   post:
 *     summary: Se connecter et obtenir un token JWT
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: tiana@client.mg
 *             motDePasse: password123
 *     responses:
 *       200:
 *         description: Token JWT retourne
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/auth/connexion', authController.connecter);

/**
 * @swagger
 * /api/auth/moi:
 *   get:
 *     summary: Infos du compte connecte
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Infos de l'utilisateur connecte
 *       401:
 *         description: Token manquant ou invalide
 */
router.get('/api/auth/moi', proteger, authController.moi);

// Routes des produits

/**
 * @swagger
 * /api/produits:
 *   get:
 *     summary: Liste des produits avec pagination et filtre
 *     tags: [Produits]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         example: Electronique
 *     responses:
 *       200:
 *         description: Liste des produits
 */
router.get('/produits', productController.lister);

/**
 * @swagger
 * /api/produits/{id}:
 *   get:
 *     summary: Detail d'un produit
 *     tags: [Produits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail du produit
 *       404:
 *         description: Produit introuvable
 */
router.get('/produits/:id', productController.trouver);

/**
 * @swagger
 * /api/produits:
 *   post:
 *     summary: Creer un produit (vendeur seulement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nom: Telephone Samsung A15
 *             description: Smartphone Android 128Go
 *             prix: 350000
 *             stock: 20
 *             categorie: Electronique
 *     responses:
 *       201:
 *         description: Produit cree
 *       403:
 *         description: Acces refuse, role vendeur requis
 */
router.post('/produits', proteger, autoriser('vendeur'), productController.creer);

/**
 * @swagger
 * /api/produits/{id}:
 *   put:
 *     summary: Modifier son produit (vendeur proprietaire seulement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             prix: 320000
 *             stock: 15
 *     responses:
 *       200:
 *         description: Produit modifie
 *       403:
 *         description: Produit appartenant a un autre vendeur
 *       404:
 *         description: Produit introuvable
 */
router.put('/produits/:id', proteger, autoriser('vendeur'), productController.modifier);

/**
 * @swagger
 * /api/produits/{id}:
 *   delete:
 *     summary: Supprimer son produit (vendeur proprietaire seulement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Produit supprime
 *       403:
 *         description: Produit appartenant a un autre vendeur
 *       404:
 *         description: Produit introuvable
 */
router.delete('/produits/:id', proteger, autoriser('vendeur'), productController.supprimer);

// Routes du panier (client seulement)

/**
 * @swagger
 * /api/panier:
 *   get:
 *     summary: Voir son panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contenu du panier
 *       403:
 *         description: Acces refuse, role client requis
 */
router.get('/panier', proteger, autoriser('client'), cartController.voir);

/**
 * @swagger
 * /api/panier/articles:
 *   post:
 *     summary: Ajouter un article au panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             produitId: "664f1a2b3c4d5e6f7a8b9c0d"
 *             quantite: 2
 *     responses:
 *       201:
 *         description: Article ajoute au panier
 *       400:
 *         description: Stock insuffisant
 *       404:
 *         description: Produit introuvable
 */
router.post('/panier/articles', proteger, autoriser('client'), cartController.ajouter);

/**
 * @swagger
 * /api/panier/articles/{produitId}:
 *   delete:
 *     summary: Retirer un article du panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: produitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article retire du panier
 *       404:
 *         description: Article non trouve dans le panier
 */
router.delete('/panier/articles/:produitId', proteger, autoriser('client'), cartController.retirer);

/**
 * @swagger
 * /api/panier:
 *   delete:
 *     summary: Vider le panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Panier vide
 */
router.delete('/panier', proteger, autoriser('client'), cartController.vider);

// Routes des commandes (client seulement)

/**
 * @swagger
 * /api/commandes:
 *   post:
 *     summary: Passer une commande depuis le panier
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Commande creee, panier vide
 *       400:
 *         description: Panier vide ou stock insuffisant
 */
router.post('/commandes', proteger, autoriser('client'), orderController.passer);

/**
 * @swagger
 * /api/commandes:
 *   get:
 *     summary: Historique des commandes du client connecte
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes
 */
router.get('/commandes', proteger, autoriser('client'), orderController.historique);

/**
 * @swagger
 * /api/commandes/{id}:
 *   get:
 *     summary: Detail d'une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail de la commande
 *       403:
 *         description: Commande appartenant a un autre client
 *       404:
 *         description: Commande introuvable
 */
router.get('/commandes/:id', proteger, autoriser('client'), orderController.detail);

module.exports = router;