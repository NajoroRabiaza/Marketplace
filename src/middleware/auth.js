const jwt = require('jsonwebtoken');
const userRepo = require('../repository/userRepository');

// Middleware qui verifie si l'utilisateur est connecte (token JWT valide)
async function proteger(req, res, next) {
    // On lit le token depuis l'en-tete Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acces refuse : token manquant' });
    }

    try {
        // On verifie et decode le token avec la cle secrete
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // On charge l'utilisateur depuis la base pour avoir les infos a jour
        const utilisateur = await userRepo.findById(decoded.id);
        if (!utilisateur) {
            return res.status(401).json({ message: 'Utilisateur introuvable' });
        }

        // On attache l'utilisateur a la requete pour les controllers suivants
        req.utilisateur = utilisateur;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide ou expire' });
    }
}

// Middleware qui verifie le role de l'utilisateur
function autoriser(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({
                message: `Acces refuse : cette action est reservee aux ${roles.join(', ')}`
            });
        }
        next();
    };
}

module.exports = { proteger, autoriser };
