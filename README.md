# Marketplace Multi-Vendeurs

Projet de fin de cours - UE Framework Backend en JavaScript (INFO-321)
Ecole Superieure des Technologies de l'Information (ESTI) - L2-IDEV

## Presentation

API REST d'une marketplace multi-vendeurs avec un frontend HTML/CSS/JS simple.
Les vendeurs publient des produits, les clients les consultent, remplissent un panier
(sauvegarde en base) et passent des commandes.

- Deux types de comptes separes : **vendeur** et **client**
- CRUD complet des produits (chaque vendeur gere uniquement ses produits)
- Panier persistant et historique des commandes par client
- Authentification par JWT, mots de passe haches, routes protegees par role

## Technologies utilisees

| Outil | Role |
|-------|------|
| Express.js | Framework backend |
| MongoDB + Mongoose | Base de donnees et modeles |
| JWT (jsonwebtoken) | Authentification |
| bcryptjs | Hachage des mots de passe |
| Jest + Supertest | Tests unitaires et tests d'integration |
| HTML / CSS / JS natif | Frontend |

## Installation et lancement

### 1. Prerequis

- Node.js 18 ou plus (verifier avec `node -v`)
- Une base MongoDB (voir l'etape 3, trois choix possibles)

### 2. Installer le projet

```bash
git clone <lien-du-depot>
cd marketplace
npm install
```

Creer le fichier de configuration (il contient la cle secrete JWT) :

```bash
cp .env.example .env
```

Sous Windows (invite de commandes) : `copy .env.example .env`

Le fichier `.env.example` fonctionne tel quel pour un MongoDB local ou Docker.
Vous pouvez changer `JWT_SECRET` par la phrase de votre choix.

### 3. Avoir une base MongoDB (choisir UNE option)

**Option A - Docker (le plus simple si Docker est installe)**

```bash
npm run db:up
```

**Option B - MongoDB Atlas (gratuit, sans rien installer)**

1. Creer un compte et un cluster gratuit sur https://www.mongodb.com/atlas
2. Dans "Database Access", creer un utilisateur avec un mot de passe (sans caracteres speciaux, c'est plus simple)
3. Dans "Network Access", autoriser votre adresse IP (ou `0.0.0.0/0` pour un test)
4. Cliquer sur "Connect" puis "Drivers" et copier le lien `mongodb+srv://...`
5. Le coller dans `.env` a la place de `MONGO_URI` (ajouter le nom de la base, par exemple `/marketplace`, avant le `?`)

**Option C - MongoDB installe sur la machine**

Installer MongoDB Community Server, le lancer (service `mongod`), puis garder `MONGO_URI` par defaut.

### 4. Inserer des donnees de test

```bash
npm run seed
```

Attention : cette commande **vide** la base avant d'inserer les donnees de test.

### 5. Demarrer le serveur

```bash
npm start
```

Ouvrir http://localhost:5000 dans le navigateur.

### Comptes de test (apres le seed)

| Role    | Email             | Mot de passe |
|---------|-------------------|--------------|
| Vendeur | rakoto@vendeur.mg | password123  |
| Vendeur | rasoa@vendeur.mg  | password123  |
| Client  | tiana@client.mg   | password123  |

## Lancer les tests

```bash
npm test
```

Cette commande lance :

- **Les tests unitaires** (`tests/unit`) : chaque service est teste seul, sans base de donnees.
- **Les tests d'integration de l'API** (`tests/integration/api.test.js`) : de vraies requetes HTTP
  passent par les routes, les roles et la gestion des erreurs (sans base de donnees).
- **Le test de parcours complet** (`tests/integration/parcours.test.js`) : un scenario complet
  (inscription, produit, panier, commande, commandes simultanees) avec une vraie base.
  Il est **ignore** tant que `MONGO_URI_TEST` n'est pas defini.

Pour activer le parcours complet, decommenter `MONGO_URI_TEST` dans `.env` :

```
MONGO_URI_TEST=mongodb://127.0.0.1:27017/marketplace_test
```

Cette base doit etre differente de la base normale : elle est videe a chaque lancement.

Autres commandes : `npm run test:unit`, `npm run test:integration`.

## Architecture du projet

```
marketplace/
  server.js                     Point d'entree
  docker-compose.yml            MongoDB en une commande
  .env.example                  Modele du fichier de configuration
  src/
    config.js                   Chargement du .env et valeurs par defaut
    database.js                 Connexion MongoDB
    routes.js                   Toutes les routes API
    model/                      Schemas Mongoose (User, Product, Cart, Order)
    repository/                 Acces aux donnees (seule couche qui parle a MongoDB)
    service/                    Logique metier (validation, stock, regles)
    controller/                 Gestion des requetes HTTP
    middleware/
      auth.js                   Verification du JWT et des roles
      errorHandler.js           Gestion globale des erreurs (codes HTTP)
    utils/                      Petites fonctions partagees
    seed.js                     Donnees de test
  public/                       Frontend HTML/CSS/JS
  tests/
    unit/                       Tests unitaires Jest
    integration/                Tests d'integration (Supertest)
```

Le code suit l'organisation en trois couches vue en cours : le controller gere le HTTP,
le service contient la logique metier, le repository est la seule couche qui accede a la base.

## Routes de l'API

Toutes les routes commencent par `/api`.

### Authentification

| Methode | Route                 | Acces    | Description              |
|---------|-----------------------|----------|--------------------------|
| POST    | /api/auth/inscription | Public   | Creer un compte          |
| POST    | /api/auth/connexion   | Public   | Se connecter (token JWT) |
| GET     | /api/auth/moi         | Connecte | Infos du compte          |

Le token se donne ensuite dans l'en-tete `Authorization: Bearer <token>`.

### Produits

| Methode | Route             | Acces   | Description                                              |
|---------|-------------------|---------|----------------------------------------------------------|
| GET     | /api/produits     | Public  | Liste (`?page=1&limit=10&categorie=...&vendeurId=...`)   |
| GET     | /api/produits/:id | Public  | Detail d'un produit                                      |
| POST    | /api/produits     | Vendeur | Creer un produit                                         |
| PUT     | /api/produits/:id | Vendeur | Modifier son produit                                     |
| DELETE  | /api/produits/:id | Vendeur | Supprimer son produit                                    |

### Panier (clients uniquement)

| Methode | Route                              | Description                             |
|---------|------------------------------------|-----------------------------------------|
| GET     | /api/panier                        | Voir son panier                         |
| POST    | /api/panier/articles               | Ajouter un article (`produitId`, `quantite`) |
| DELETE  | /api/panier/articles/:produitId    | Retirer un article                      |
| DELETE  | /api/panier                        | Vider le panier                         |

### Commandes (clients uniquement)

| Methode | Route              | Description                      |
|---------|--------------------|----------------------------------|
| POST    | /api/commandes     | Passer commande depuis le panier |
| GET     | /api/commandes     | Historique des commandes         |
| GET     | /api/commandes/:id | Detail d'une commande            |

### Codes de reponse

| Code | Signification                                             |
|------|-----------------------------------------------------------|
| 200 / 201 / 204 | Succes (lecture / creation / suppression)      |
| 400  | Donnees invalides (champ manquant, stock insuffisant...)  |
| 401  | Token manquant, invalide ou identifiants incorrects       |
| 403  | Action interdite (mauvais role ou produit d'un autre)     |
| 404  | Ressource introuvable                                     |
| 500  | Erreur inattendue du serveur                              |

## En cas de probleme

| Message                                   | Solution                                                    |
|-------------------------------------------|-------------------------------------------------------------|
| `JWT_SECRET est manquant`                 | Creer le fichier `.env` (`cp .env.example .env`)            |
| `Impossible de se connecter a MongoDB`    | Lancer MongoDB (`npm run db:up`) ou verifier `MONGO_URI`    |
| `EADDRINUSE` (port deja utilise)          | Changer `PORT` dans `.env` (par exemple 5001)               |
| Page blanche ou liste de produits vide    | Lancer `npm run seed` pour inserer des donnees              |
