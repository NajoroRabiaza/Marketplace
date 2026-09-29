require('./config');
const { connectDB, disconnectDB } = require('./database');
const User = require('./model/User');
const Product = require('./model/Product');
const Cart = require('./model/Cart');
const Order = require('./model/Order');

async function seed() {
    await connectDB();
    console.log('Nettoyage des donnees existantes...');

    // On supprime dans le bon ordre pour respecter les references
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Insertion des donnees de test...');

    // Creation des vendeurs
    const vendeur1 = await User.create({
        nom: 'Rakoto Vendeur',
        email: 'rakoto@vendeur.mg',
        motDePasse: 'password123',
        role: 'vendeur'
    });

    const vendeur2 = await User.create({
        nom: 'Rasoa Vendeur',
        email: 'rasoa@vendeur.mg',
        motDePasse: 'password123',
        role: 'vendeur'
    });

    // Creation des clients
    const client1 = await User.create({
        nom: 'Tiana Client',
        email: 'tiana@client.mg',
        motDePasse: 'password123',
        role: 'client'
    });

    // Creation des produits
    await Product.create([
        {
            nom: 'Telephone Samsung A15',
            description: 'Smartphone Android avec 128Go de stockage',
            prix: 350000,
            stock: 20,
            categorie: 'Electronique',
            vendeurId: vendeur1._id
        },
        {
            nom: 'Ecouteurs Bluetooth',
            description: 'Ecouteurs sans fil avec reduction de bruit',
            prix: 75000,
            stock: 50,
            categorie: 'Electronique',
            vendeurId: vendeur1._id
        },
        {
            nom: 'Sac a dos Laptop',
            description: 'Sac resistant pour ordinateur 15 pouces',
            prix: 45000,
            stock: 30,
            categorie: 'Accessoires',
            vendeurId: vendeur2._id
        },
        {
            nom: 'Livre Express.js Avance',
            description: 'Guide complet du developpement backend avec Node.js',
            prix: 25000,
            stock: 15,
            categorie: 'Livres',
            vendeurId: vendeur2._id
        }
    ]);

    console.log('Donnees inserees avec succes !');
    console.log('---');
    console.log('Comptes de test :');
    console.log('  Vendeur 1 : rakoto@vendeur.mg / password123');
    console.log('  Vendeur 2 : rasoa@vendeur.mg / password123');
    console.log('  Client 1  : tiana@client.mg / password123');

    await disconnectDB();
}

seed().catch((err) => {
    console.error('Erreur seed :', err);
    process.exit(1);
});
