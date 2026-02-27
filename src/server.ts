// src/server.ts
import app from './app';
import { env } from './config/environment';
import { logger } from './utils/logger';
import sequelize from './config/sequelize';

// Import models to register associations
import './models';
import { seedDatabase } from './database/seeders/seeder';

// Import seeder

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // ============================================================
    // AUTO SYNC - This is the magic!
    // ============================================================
    // 
    // sequelize.sync()        → Creates tables if not exist (safe)
    // sequelize.sync({alter:true}) → Alters tables to match models (dev)
    // sequelize.sync({force:true}) → Drops & recreates all tables (dangerous!)
    //
    // ============================================================

    if (env.isDevelopment) {
      // ALTER mode: auto-updates columns, adds new ones, adjusts types
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synced (alter mode - development)');
    } else {
      // Production: only creates missing tables, never alters existing
      await sequelize.sync();
      logger.info('✅ Database synced (safe mode - production)');
    }

    // Run seeder (only seeds if tables are empty)
    // await seedDatabase();

    // Start server
    app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
      logger.info(`📋 Health check: http://localhost:${env.port}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();