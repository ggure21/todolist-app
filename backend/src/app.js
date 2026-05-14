'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const errorMiddleware = require('./middlewares/error.middleware');
const requestLoggerMiddleware = require('./middlewares/request-logger.middleware');
const apiRoutes = require('./routes/index');

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLoggerMiddleware);

// Swagger UI — /api-docs
const swaggerDocument = require(path.join(__dirname, '../../swagger/swagger.json'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'TodoListApp API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found', code: 'NOT_FOUND' });
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
