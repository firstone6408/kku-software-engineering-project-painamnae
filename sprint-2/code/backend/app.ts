import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger';
import routes from './src/routes';
import { errorHandler } from './src/middlewares/errorHandler';
import ApiError from './src/utils/ApiError';
import { metricsMiddleware } from './src/middlewares/metrics';
import prisma from './src/utils/prisma';

const app = express();
promClient.collectDefaultMetrics();

app.use(helmet());

const corsOptions: cors.CorsOptions = {
  origin: [
    'http://localhost:3001',
    'https://amazing-crisp-9bcb1a.netlify.app',
    'https://sinchai-document.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors({ origin: true, credentials: true }));
app.options('*', cors(corsOptions));

app.use(express.json());

// Metrics Middleware
app.use(metricsMiddleware);

// --- Routes ---
// Health Check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ status: 'error', detail: message });
  }
});

// Prometheus Metrics
app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Swagger Documentation
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Main API Routes
app.use('/api', routes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
