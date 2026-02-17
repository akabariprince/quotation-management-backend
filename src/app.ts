// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import path from 'path';
import { env } from './config/environment';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

import authRoutes from './modules/auth/auth.routes';
import roleRoutes from './modules/role/role.routes';
import categoryRoutes from './modules/category/category.routes';
import quotationTypeRoutes from './modules/quotationType/quotationType.routes';
import quotationModelRoutes from './modules/quotationModel/quotationModel.routes';
import woodRoutes from './modules/wood/wood.routes';
import polishRoutes from './modules/polish/polish.routes';
import fabricRoutes from './modules/fabric/fabric.routes';
import quotationRoutes from './modules/quotation/quotation.routes';
import customerRoutes from './modules/customer/customer.routes';
import projectRoutes from './modules/project/project.routes';
import userRoutes from './modules/user/user.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import otpRoutes from './modules/otp/otp.routes';
import emailLogRoutes from './modules/emailLog/emailLog.routes';
import reportsRoutes from './modules/reports/reports.routes';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(hpp());
app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  morgan(env.isDevelopment ? 'dev' : 'combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);

// Resource routes
app.use('/api/roles', roleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quotation-types', quotationTypeRoutes);
app.use('/api/quotation-models', quotationModelRoutes);
app.use('/api/woods', woodRoutes);
app.use('/api/polishes', polishRoutes);
app.use('/api/fabrics', fabricRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/otp-logs', otpRoutes);
app.use('/api/email-logs', emailLogRoutes);


// Static file serving for uploads
app.use(
  '/api/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      }
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);
app.use(
  "/uploads/pdfs",
  express.static(path.join(process.cwd(), "uploads", "pdfs")),
);
// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;