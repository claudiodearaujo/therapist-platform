// apps/backend/src/app.ts

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { httpLogger } from './middlewares/http-logger.middleware';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env, getAllowedFrontendOrigins } from './config/env';
import { Sentry } from './config/sentry';
import { notFoundHandler, errorHandler, generalLimiter, resolveTenant } from './middlewares';
import { auditLogger } from './middlewares/audit.middleware';
import { swaggerSpec } from './config/swagger';
import {
  authRoutes,
  usersRoutes,
  productsRoutes,
  ordersRoutes,
  stripeWebhook,
  readingsRoutes,
  cardsRoutes,
  appointmentsRoutes,
  categoriesRoutes,
  testimonialsRoutes,
  settingsRoutes,
  dashboardRoutes,
  notificationsRoutes,
  contactRoutes,
  tenantRoutes,
  onboardingRoutes,
  billingRoutes,
  privacyRoutes,
} from './modules';

// Create Express app
const app: Application = express();
app.set('trust proxy', env.TRUST_PROXY_CIDRS.length ? env.TRUST_PROXY_CIDRS : false);

// =============================================
// SECURITY MIDDLEWARES
// =============================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: getAllowedFrontendOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Slug'],
}));

// =============================================
// WEBHOOKS (before body parsing)
// =============================================

// Stripe webhook needs raw body
app.use('/webhooks/stripe', stripeWebhook);

// =============================================
// BODY PARSING
// =============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =============================================
// UTILITY MIDDLEWARES
// =============================================

// Compression
app.use(compression());

// Allowlisted operational metadata only, in every environment.
app.use(httpLogger);

// Rate limiting
app.use(generalLimiter);

// =============================================
// HEALTH CHECK
// =============================================

const runtimeMetadata = () => ({
  timestamp: new Date().toISOString(),
  environment: env.NODE_ENV,
  version: process.env.npm_package_version || '1.0.0',
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    ...runtimeMetadata(),
  });
});

const readinessHandler = async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    ...runtimeMetadata(),
    checks,
  });
};

app.get('/health', readinessHandler);
app.get('/health/ready', readinessHandler);

// =============================================
// API ROUTES
// =============================================

const apiPrefix = env.API_PREFIX;
// v1 prefix provides versioned access alongside the default prefix
const apiV1Prefix = `${apiPrefix}/v1`;

function mountRoutes(prefix: string) {
  app.use(prefix, resolveTenant);
  app.use(prefix, auditLogger);
  app.use(prefix, tenantRoutes);
  app.use(prefix, onboardingRoutes);
  app.use(prefix, billingRoutes);
  app.use(prefix, privacyRoutes);
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, usersRoutes);
  app.use(`${prefix}/products`, productsRoutes);
  app.use(`${prefix}/orders`, ordersRoutes);
  app.use(`${prefix}/notifications`, notificationsRoutes);
  app.use(prefix, readingsRoutes);
  app.use(prefix, cardsRoutes);
  app.use(prefix, appointmentsRoutes);
  app.use(prefix, categoriesRoutes);
  app.use(prefix, testimonialsRoutes);
  app.use(prefix, settingsRoutes);
  app.use(prefix, dashboardRoutes);
  app.use(prefix, contactRoutes);
}

// Mount on both /api and /api/v1 for backward compatibility + versioning
mountRoutes(apiPrefix);
mountRoutes(apiV1Prefix);

// =============================================
// API DOCUMENTATION
// =============================================

if (env.isDevelopment || env.ENABLE_API_DOCS) {
// Swagger UI — served in all environments for discoverability
app.use(
  `${apiPrefix}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Therapist Platform API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

// OpenAPI spec endpoint (JSON)
app.get(`${apiPrefix}/docs.json`, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

}

if (env.isDevelopment) {
  app.get(`${apiPrefix}`, (req: Request, res: Response) => {
    res.json({
      message: 'Therapist Platform API',
      version: '1.0.0',
      documentation: `${apiPrefix}/docs`,
      openApiSpec: `${apiPrefix}/docs.json`,
      versioned: {
        v1: `${apiV1Prefix}`,
        latest: `${apiPrefix}`,
      },
      endpoints: {
        auth: `${apiPrefix}/auth`,
        users: `${apiPrefix}/users`,
        products: `${apiPrefix}/products`,
        orders: `${apiPrefix}/orders`,
        notifications: `${apiPrefix}/notifications`,
        readings: `${apiPrefix}/readings`,
        cards: `${apiPrefix}/cards`,
        appointments: `${apiPrefix}/appointments`,
        categories: `${apiPrefix}/categories`,
        testimonials: `${apiPrefix}/testimonials`,
        settings: `${apiPrefix}/settings`,
        admin: {
          dashboard: `${apiPrefix}/admin/dashboard`,
          readings: `${apiPrefix}/admin/readings`,
          cards: `${apiPrefix}/admin/cards`,
          appointments: `${apiPrefix}/admin/appointments`,
          categories: `${apiPrefix}/admin/categories`,
          testimonials: `${apiPrefix}/admin/testimonials`,
          settings: `${apiPrefix}/admin/settings`,
        },
      },
    });
  });
}

// =============================================
// ERROR HANDLING
// =============================================

// Sentry error handler (must be before custom error handler)
Sentry.setupExpressErrorHandler(app);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
