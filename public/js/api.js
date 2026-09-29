// Fonctions utilitaires partagees entre toutes les pages

const API_BASE = '/api';

// Recupere le token JWT stocke dans le navigateur
function getToken() {
    return localStorage.getItem('token');
}

// Recupere les infos de l'utilisateur connecte
function getUser() {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
}

// Sauvegarde le token et les infos utilisateur apres connexion
function sauvegarderSession(token, utilisateur) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
}

// Supprime la session (deconnexion)
function supprimerSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Protege le texte avant de l'afficher dans la page.
// Sans cela, un vendeur pourrait mettre du code HTML dans le nom d'un produit
// et ce code s'executerait chez les autres utilisateurs.
function echapper(texte) {
    return String(texte === null || texte === undefined ? '' : texte)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fonction principale pour appeler l'API
async function appelAPI(methode, chemin, corps = null) {
    const options = {
        method: methode,
        headers: { 'Content-Type': 'application/json' }
    };

    // Si un token existe, on l'ajoute a chaque requete
    const token = getToken();
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }

    if (corps) {
        options.body = JSON.stringify(corps);
    }

    const reponse = await fetch(API_BASE + chemin, options);
    const data = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
        throw new Error(data.message || 'Erreur serveur');
    }

    return data;
}

// Affiche un message de succes ou d'erreur dans un element HTML
function afficherMessage(elementId, texte, type = 'erreur') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'message message-' + type;
    el.textContent = texte;
    el.style.display = 'block';
    // Le message disparait automatiquement apres 4 secondes
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Met a jour la barre de navigation selon si l'utilisateur est connecte ou non
function mettreAJourNav() {
    const user = getUser();
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (user) {
        let liens = `<a href="/pages/produits.html">Produits</a>`;

        if (user.role === 'client') {
            liens += `<a href="/pages/panier.html">Mon panier</a>`;
            liens += `<a href="/pages/commandes.html">Mes commandes</a>`;
        }

        if (user.role === 'vendeur') {
            liens += `<a href="/pages/mes-produits.html">Mes produits</a>`;
        }

        liens += `<span style="color:#aaa;margin-left:16px">Bonjour, ${echapper(user.nom)}</span>`;
        liens += `<a href="#" onclick="seDeconnecter()">Deconnexion</a>`;
        navLinks.innerHTML = liens;
    } else {
        navLinks.innerHTML = `
            <a href="/pages/produits.html">Produits</a>
            <a href="/pages/connexion.html">Connexion</a>
            <a href="/pages/inscription.html">Inscription</a>
        `;
    }
}

// Deconnecte l'utilisateur et redirige vers la page de connexion
function seDeconnecter() {
    supprimerSession();
    window.location.href = '/pages/connexion.html';
}

// Redirige vers la connexion si l'utilisateur n'est pas connecte
function exigerConnexion(roleRequis = null) {
    const user = getUser();
    if (!user) {
        window.location.href = '/pages/connexion.html';
        return false;
    }
    if (roleRequis && user.role !== roleRequis) {
        alert('Cette page est reservee aux ' + roleRequis + 's');
        window.location.href = '/pages/produits.html';
        return false;
    }
    return true;
}

// Formate un nombre en Ariary malgache
function formaterPrix(montant) {
    return montant.toLocaleString('fr-FR') + ' Ar';
}
