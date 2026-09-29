// Configuration de Swagger pour documenter et tester l'API
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Marketplace Multi-Vendeurs API',
            version: '1.0.0',
            description: 'API REST - Projet de fin de cours INFO-321 ESTI L2-IDEV'
        },
        servers: [
            { url: 'http://localhost:5000', description: 'Serveur local' }
        ],
        // On definit le schema de securite JWT pour toute l'API
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Coller le token recu apres connexion : Bearer <token>'
                }
            }
        }
    },
    // Swagger va lire les commentaires JSDoc dans ce fichier
    apis: ['./src/routes.js']
};

module.exports = swaggerJsdoc(options);