# Marketplace Multi-Vendeurs

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-F7B93E?logo=jsonwebtokens&logoColor=black)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?logo=swagger&logoColor=black)

> Projet de fin de cours - UE Framework Backend en JavaScript (INFO-321)
> Ecole Superieure des Technologies de l'Information (ESTI) - L2-IDEV

API REST d'une marketplace multi-vendeurs avec frontend HTML/CSS/JS.
Les vendeurs publient des produits, les clients les consultent,
remplissent un panier persistant et passent des commandes.

---

## Apercu de l'application

<table>
  <tr>
    <td width="50%">
      <strong>Page d'accueil</strong><br/><br/>
      Point d'entree de la marketplace. Navigation adaptee selon le role
      de l'utilisateur connecte (vendeur ou client).
    </td>
    <td width="50%">
      <img src="docs/screenshots/accueil.png" alt="Page d'accueil" width="100%"/>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/vendeur.png" alt="Espace vendeur" width="100%"/>
    </td>
    <td width="50%">
      <strong>Espace vendeur</strong><br/><br/>
      Chaque vendeur gere uniquement ses propres produits.
      Creation, modification et suppression depuis une interface dediee.
    </td>
  </tr>
</table>

---

## Documentation interactive de l'API

<table>
  <tr>
    <td width="50%">
      <strong>Swagger UI sur <code>/api-docs</code></strong><br/><br/>
      Interface complete pour explorer et tester toutes les routes.
      Les routes protegees sont marquees d'un cadenas.
      Le bouton <em>Authorize</em> permet de coller le token JWT.
    </td>
    <td width="50%">
      <img src="docs/screenshots/swagger.png" alt="Swagger UI" width="100%"/>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/swagger-test.png" alt="Test Swagger" width="100%"/>
    </td>
    <td width="50%">
      <strong>Test d'une route en direct</strong><br/><br/>
      Chaque route peut etre testee directement dans le navigateur.
      La reponse JSON est affichee avec le code HTTP, les headers
      et la commande curl equivalente.
    </td>
  </tr>
</table>

---

## Technologies

| Outil | Role |
|-------|------|
| Express.js | Framework backend |
| MongoDB + Mongoose | Base de donnees et modeles |
| JWT (jsonwebtoken) | Authentification |
| bcryptjs | Hachage des mots de passe |
| Jest + Supertest | Tests unitaires et integration |
| Swagger UI | Documentation interactive de l'API |
| HTML / CSS / JS natif | Frontend |

---

## Fonctionnalites

- Deux types de comptes separes : **vendeur** et **client**
- CRUD complet des produits (chaque vendeur gere uniquement ses produits)
- Panier persistant en base de donnees (conserve meme apres deconnexion)
- Historique complet des commandes par client
- Authentification JWT avec mots de passe haches (bcrypt)
- Routes protegees par role
- Protection contre les commandes simultanees au niveau base de donnees

---

## Installation et lancement

### 1. Prerequis

- Node.js 18 ou plus (`node -v` pour verifier)
- Une base MongoDB (trois options ci-dessous)

### 2. Installer le projet

```bash
git clone <lien-du-depot>
cd marketplace
npm install
cp .env.example .env
```

Sous Windows : `copy .env.example .env`

### 3. Choisir une option MongoDB

**Option A - MongoDB installe sur la machine (recommande)**

```bash
sudo systemctl start mongod
```

Garder `MONGO_URI` par defaut dans `.env`.

**Option B - Docker**

```bash
npm run db:up
```

**Option C - MongoDB Atlas (gratuit, sans rien installer)**

1. Creer un compte sur https://www.mongodb.com/atlas
2. Creer un cluster gratuit et un utilisateur
3. Copier le lien `mongodb+srv://...` dans `.env` a la place de `MONGO_URI`

### 4. Inserer les donnees de test

```bash
npm run seed
```

Cette commande vide la base puis insere les donnees de test.

### 5. Demarrer le serveur

```bash
npm start
```

Ouvrir http://localhost:5000 dans le navigateur.

---

## Comptes de test

| Role | Email | Mot de passe |
|------|-------|--------------|
| Vendeur | rakoto@vendeur.mg | password123 |
| Vendeur | rasoa@vendeur.mg | password123 |
| Client | tiana@client.mg | password123 |

---

## Lancer les tests

```bash
npm test
```

Lance en une seule commande :

- **Tests unitaires** (`tests/unit`) : chaque service est teste seul, sans base de donnees
- **Tests d'integration** (`tests/integration/api.test.js`) : requetes HTTP reelles sur les routes

Pour activer le test de parcours complet, ajouter dans `.env` :

```
MONGO_URI_TEST=mongodb://127.0.0.1:27017/marketplace_test
```

Autres commandes disponibles :

```bash
npm run test:unit          # tests unitaires uniquement
npm run test:integration   # tests d'integration uniquement
```

---

## Documentation Swagger

Demarrer le serveur puis ouvrir : http://localhost:5000/api-docs

Pour tester les routes protegees :

1. Utiliser `POST /api/auth/connexion` pour obtenir un token
2. Cliquer sur **Authorize** en haut a droite
3. Coller le token (sans le mot `Bearer`)
4. Toutes les routes avec un cadenas sont maintenant accessibles

---

## Architecture du projet

```
marketplace/
  server.js                     Point d'entree
  docker-compose.yml            MongoDB en une commande
  .env.example                  Modele du fichier de configuration
  src/
    config.js                   Chargement du .env et validation des variables
    database.js                 Connexion MongoDB
    routes.js                   Toutes les routes API avec documentation Swagger
    swagger.js                  Configuration Swagger UI
    model/                      Schemas Mongoose (User, Product, Cart, Order)
    repository/                 Acces aux donnees (seule couche qui parle a MongoDB)
    service/                    Logique metier (validation, stock, regles)
    controller/                 Gestion des requetes HTTP
    middleware/
      auth.js                   Verification du JWT et des roles
      errorHandler.js           Gestion globale des erreurs
    utils/
      creerErreur.js            Creation d'erreurs avec code HTTP
      idDe.js                   Comparaison fiable des identifiants MongoDB
    seed.js                     Donnees de test
  public/                       Frontend HTML/CSS/JS
  tests/
    unit/                       Tests unitaires Jest
    integration/                Tests d'integration Supertest
```

---

## Routes de l'API

Toutes les routes commencent par `/api`.

### Authentification

| Methode | Route | Acces | Description |
|---------|-------|-------|-------------|
| POST | /api/auth/inscription | Public | Creer un compte |
| POST | /api/auth/connexion | Public | Se connecter (token JWT) |
| GET | /api/auth/moi | Connecte | Infos du compte |

### Produits

| Methode | Route | Acces | Description |
|---------|-------|-------|-------------|
| GET | /api/produits | Public | Liste avec pagination et filtres |
| GET | /api/produits/:id | Public | Detail d'un produit |
| POST | /api/produits | Vendeur | Creer un produit |
| PUT | /api/produits/:id | Vendeur | Modifier son produit |
| DELETE | /api/produits/:id | Vendeur | Supprimer son produit |

### Panier

| Methode | Route | Acces | Description |
|---------|-------|-------|-------------|
| GET | /api/panier | Client | Voir son panier |
| POST | /api/panier/articles | Client | Ajouter un article |
| DELETE | /api/panier/articles/:produitId | Client | Retirer un article |
| DELETE | /api/panier | Client | Vider le panier |

### Commandes

| Methode | Route | Acces | Description |
|---------|-------|-------|-------------|
| POST | /api/commandes | Client | Passer commande depuis le panier |
| GET | /api/commandes | Client | Historique des commandes |
| GET | /api/commandes/:id | Client | Detail d'une commande |

### Codes de reponse

| Code | Signification |
|------|---------------|
| 200 / 201 / 204 | Succes (lecture / creation / suppression) |
| 400 | Donnees invalides ou stock insuffisant |
| 401 | Token manquant, invalide ou identifiants incorrects |
| 403 | Action interdite (mauvais role ou ressource d'un autre) |
| 404 | Ressource introuvable |
| 500 | Erreur inattendue du serveur |

---

## En cas de probleme

| Message | Solution |
|---------|----------|
| `JWT_SECRET est manquant` | Creer le fichier `.env` (`cp .env.example .env`) |
| `Impossible de se connecter a MongoDB` | Lancer MongoDB (`npm run db:up`) ou verifier `MONGO_URI` |
| `EADDRINUSE` (port deja utilise) | Changer `PORT` dans `.env` (par exemple 5001) |
| Page blanche ou liste de produits vide | Lancer `npm run seed` pour inserer des donnees |
