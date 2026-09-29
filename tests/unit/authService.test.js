// jest.mock remplace le vrai module par une version simulee (on ne touche pas a MongoDB)
jest.mock('../../src/repository/userRepository');
jest.mock('jsonwebtoken');

const authService = require('../../src/service/authService');
const userRepo = require('../../src/repository/userRepository');
const jwt = require('jsonwebtoken');

// Des donnees valides qu'on reutilise dans plusieurs tests
const donneesValides = {
    nom: 'Test User',
    email: 'test@test.mg',
    motDePasse: 'password123',
    role: 'client'
};

describe('authService - inscrire', () => {
    // Avant chaque test, on remet les mocks a zero pour eviter les interferences
    beforeEach(() => jest.clearAllMocks());

    test('doit inscrire un nouvel utilisateur et retourner un token', async () => {
        // ARRANGE : on simule la base de donnees
        userRepo.findByEmail.mockResolvedValue(null); // pas d'utilisateur existant
        userRepo.create.mockResolvedValue({ _id: 'user123', ...donneesValides });
        jwt.sign.mockReturnValue('fake_token_abc');

        // ACT : on appelle la fonction a tester
        const resultat = await authService.inscrire(donneesValides);

        // ASSERT : on verifie que le resultat est correct
        expect(resultat.token).toBe('fake_token_abc');
        expect(resultat.utilisateur.email).toBe('test@test.mg');
        expect(resultat.utilisateur.role).toBe('client');
        // Le mot de passe ne doit jamais etre renvoye
        expect(resultat.utilisateur.motDePasse).toBeUndefined();
    });

    test('doit mettre l\'email en minuscules avant de l\'enregistrer', async () => {
        userRepo.findByEmail.mockResolvedValue(null);
        userRepo.create.mockResolvedValue({ _id: 'u1', ...donneesValides });
        jwt.sign.mockReturnValue('token');

        await authService.inscrire({ ...donneesValides, email: '  Test@TEST.mg ' });

        expect(userRepo.findByEmail).toHaveBeenCalledWith('test@test.mg');
        expect(userRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'test@test.mg' })
        );
    });

    test('doit refuser un email deja utilise (400)', async () => {
        userRepo.findByEmail.mockResolvedValue({ email: 'test@test.mg' });

        const erreur = await authService.inscrire(donneesValides).catch(e => e);

        expect(erreur.status).toBe(400);
        expect(userRepo.create).not.toHaveBeenCalled();
    });

    // On teste plusieurs cas invalides avec test.each
    test.each([
        ['nom manquant', { nom: '' }],
        ['email invalide', { email: 'pas-un-email' }],
        ['email qui n\'est pas du texte', { email: { $ne: null } }],
        ['mot de passe trop court', { motDePasse: '123' }],
        ['role inconnu', { role: 'admin' }],
        ['role manquant', { role: undefined }]
    ])('doit refuser les donnees invalides : %s (400)', async (nomDuCas, changement) => {
        const erreur = await authService
            .inscrire({ ...donneesValides, ...changement })
            .catch(e => e);

        expect(erreur.status).toBe(400);
        // On ne doit meme pas interroger la base
        expect(userRepo.findByEmail).not.toHaveBeenCalled();
    });
});

describe('authService - connecter', () => {
    beforeEach(() => jest.clearAllMocks());

    test('doit connecter avec le bon mot de passe', async () => {
        userRepo.findByEmail.mockResolvedValue({
            _id: 'user123',
            nom: 'Test User',
            email: 'test@test.mg',
            role: 'client',
            verifierMotDePasse: jest.fn().mockResolvedValue(true)
        });
        jwt.sign.mockReturnValue('fake_token_abc');

        const resultat = await authService.connecter({
            email: 'test@test.mg',
            motDePasse: 'password123'
        });

        expect(resultat.token).toBe('fake_token_abc');
        expect(resultat.utilisateur.id).toBe('user123');
    });

    test('doit refuser un mot de passe incorrect (401)', async () => {
        userRepo.findByEmail.mockResolvedValue({
            verifierMotDePasse: jest.fn().mockResolvedValue(false)
        });

        const erreur = await authService
            .connecter({ email: 'test@test.mg', motDePasse: 'mauvais' })
            .catch(e => e);

        expect(erreur.status).toBe(401);
    });

    test('doit refuser un email inconnu avec le meme message (401)', async () => {
        userRepo.findByEmail.mockResolvedValue(null);

        const erreur = await authService
            .connecter({ email: 'inconnu@test.mg', motDePasse: 'password123' })
            .catch(e => e);

        expect(erreur.status).toBe(401);
        expect(erreur.message).toBe('Email ou mot de passe incorrect');
    });

    test('doit refuser un email ou mot de passe qui n\'est pas du texte (400)', async () => {
        const erreur = await authService
            .connecter({ email: { $ne: null }, motDePasse: 'password123' })
            .catch(e => e);

        expect(erreur.status).toBe(400);
        expect(userRepo.findByEmail).not.toHaveBeenCalled();
    });
});
