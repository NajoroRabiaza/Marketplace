// Ce fichier est lance par Jest avant chaque fichier de test.
// Il donne une cle secrete de test pour que les tests marchent sans fichier .env
process.env.JWT_SECRET = 'cle_secrete_pour_les_tests';
process.env.JWT_EXPIRES_IN = '1h';
