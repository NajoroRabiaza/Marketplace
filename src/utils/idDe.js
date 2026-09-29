// Renvoie l'identifiant (en texte) d'une valeur.
// La valeur peut etre un simple identifiant, ou un objet complet
// (c'est le cas quand Mongoose a charge le produit avec populate).
// Sans cette fonction, comparer deux identifiants ne marche pas toujours.
function idDe(valeur) {
    if (!valeur) return null;
    const id = valeur._id || valeur;
    return id.toString();
}

module.exports = idDe;
