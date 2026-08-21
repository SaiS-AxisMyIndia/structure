// Swagger/OpenAPI setup
const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./index');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Backend API',
    version: '1.0.0',
    description: 'API documentation for the backend service',
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api`,
      description: 'Local server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/config/routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
