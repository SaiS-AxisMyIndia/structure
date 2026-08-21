// Express app, global middleware mounting
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./config/routes');
const rateLimiter = require('./config/middlewares/rateLimiter.middleware');
const notFoundMiddleware = require('./config/middlewares/notFound.middleware');
const errorMiddleware = require('./config/middlewares/error.middleware');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'OK' }));

app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
