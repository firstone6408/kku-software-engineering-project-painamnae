import swaggerJsdoc from 'swagger-jsdoc';
import packageJson from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Painamnae API',
      version: (packageJson as { version: string }).version,
      description: 'API for ride sharing (users, drivers, vehicles, routes, bookings).',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.js', './src/docs/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
