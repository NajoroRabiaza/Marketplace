const express = require('express');
const router = express.Router();

const authController = require('./controller/authController');
const productController = require('./controller/productController');
const cartController = require('./controller/cartController');
const orderController = require('./controller/orderController');
const { proteger, autoriser } = require('./middleware/auth');

// -------------------------------------------------------
// Routes d'authentification (pas besoin d'etre connecte)
// -------------------------------------------------------
router.post('/auth/inscription', authController.inscrire);
router.post('/auth/connexion', authController.connecter);
router.get('/auth/moi', proteger, authController.moi);

// -------------------------------------------------------
// Routes des produits
// -------------------------------------------------------

// Lire les produits : tout le monde peut voir
router.get('/produits', productController.lister);
router.get('/produits/:id', productController.trouver);

// Creer, modifier, supprimer : vendeur seulement
router.post('/produits', proteger, autoriser('vendeur'), productController.creer);
router.put('/produits/:id', proteger, autoriser('vendeur'), productController.modifier);
router.delete('/produits/:id', proteger, autoriser('vendeur'), productController.supprimer);

// -------------------------------------------------------
// Routes du panier (client seulement)
// -------------------------------------------------------
router.get('/panier', proteger, autoriser('client'), cartController.voir);
router.post('/panier/articles', proteger, autoriser('client'), cartController.ajouter);
router.delete('/panier/articles/:produitId', proteger, autoriser('client'), cartController.retirer);
router.delete('/panier', proteger, autoriser('client'), cartController.vider);

// -------------------------------------------------------
// Routes des commandes (client seulement)
// -------------------------------------------------------
router.post('/commandes', proteger, autoriser('client'), orderController.passer);
router.get('/commandes', proteger, autoriser('client'), orderController.historique);
router.get('/commandes/:id', proteger, autoriser('client'), orderController.detail);

module.exports = router;
