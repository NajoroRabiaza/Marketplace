const jwt = require('jsonwebtoken');
const userRepo = require('../repository/userRepository');
const creerErreur = require('../utils/creerErreur');

const ROLES = ['vendeur', 'client'];

// Genere un token JWT a partir des infos de l'utilisateur
function genererToken(utilisateur) {
    return jwt.sign(
        { id: utilisateur._id, role: utilisateur.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
}

// Ce qu'on renvoie au client (jamais le mot de passe)
function formaterUtilisateur(utilisateur) {
    return {
        id: utilisateur._id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
    };
}

// Verifie les donnees de l'inscription avant de toucher a la base
// On exige du texte : cela bloque aussi les requetes piegees (ex: un objet a la place d'un email)
function verifierInscription({ nom, email, motDePasse, role }) {
    if (typeof nom !== 'string' || !nom.trim()) {
        throw creerErreur(400, 'Le nom est obligatoire');
    }
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        throw creerErreur(400, 'L\'email n\'est pas valide');
    }
    if (typeof motDePasse !== 'string' || motDePasse.length < 6) {
        throw creerErreur(400, 'Le mot de passe doit avoir au moins 6 caracteres');
    }
    if (!ROLES.includes(role)) {
        throw creerErreur(400, 'Le role doit etre "vendeur" ou "client"');
    }
}

module.exports = {
    // Inscription d'un nouvel utilisateur
    async inscrire(donnees) {
        verifierInscription(donnees);
        const { nom, motDePasse, role } = donnees;
        const email = donnees.email.trim().toLowerCase();

        // Verifie si l'email est deja pris
        const existant = await userRepo.findByEmail(email);
        if (existant) {
            throw creerErreur(400, 'Cet email est deja utilise');
        }

        const utilisateur = await userRepo.create({ nom, email, motDePasse, role });
        const token = genererToken(utilisateur);

        return { token, utilisateur: formaterUtilisateur(utilisateur) };
    },

    // Connexion d'un utilisateur existant
    async connecter({ email, motDePasse }) {
        if (typeof email !== 'string' || typeof motDePasse !== 'string') {
            throw creerErreur(400, 'Email et mot de passe obligatoires');
        }

        const utilisateur = await userRepo.findByEmail(email.trim().toLowerCase());

        // On verifie l'email et le mot de passe ensemble pour ne pas donner d'info a un pirate
        if (!utilisateur || !(await utilisateur.verifierMotDePasse(motDePasse))) {
            throw creerErreur(401, 'Email ou mot de passe incorrect');
        }

        const token = genererToken(utilisateur);

        return { token, utilisateur: formaterUtilisateur(utilisateur) };
    }
};
