// Cree une erreur avec un code HTTP (400, 403, 404...).
// Le gestionnaire d'erreurs utilisera ce code pour repondre au client.
function creerErreur(status, message) {
    const erreur = new Error(message);
    erreur.status = status;
    return erreur;
}

module.exports = creerErreur;
