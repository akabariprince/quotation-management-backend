// src/server.ts
import app from "./app";
import { env } from "./config/environment";
import { logger } from "./utils/logger";
import sequelize from "./config/sequelize";

// Import models to register associations
import "./models";
// Import seeder

const ensureSchemaUpdates = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS whatsapp_verified_mobile VARCHAR(20) NULL;
    `);

    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) NULL,
      ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS whatsapp_verified_mobile VARCHAR(20) NULL;
    `);

    await sequelize.query(`
      ALTER TABLE email_logs
      ADD COLUMN IF NOT EXISTS channel VARCHAR(20) NOT NULL DEFAULT 'email',
      ADD COLUMN IF NOT EXISTS recipient VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS to_phone VARCHAR(32) NULL,
      ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS provider_status VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS request_payload JSONB NULL,
      ADD COLUMN IF NOT EXISTS response_payload JSONB NULL,
      ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE NULL,
      ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE NULL;
    `);

    await sequelize.query(`
      ALTER TABLE email_logs
      ALTER COLUMN to_email DROP NOT NULL;
    `);

    await sequelize.query(`
      ALTER TABLE email_logs
      ALTER COLUMN status TYPE VARCHAR(20)
      USING status::text;
    `);

    await sequelize.query(`
      UPDATE email_logs
      SET recipient = COALESCE(recipient, to_email)
      WHERE recipient IS NULL;
    `);

    logger.info("✅ Checked and updated customer/email_log schema additions");
  } catch (error) {
    logger.warn(
      "Could not apply schema updates automatically: " +
        (error as Error).message,
    );
  }
};

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info("✅ Database connection established successfully");

    // Add 'rejected' and 'po' to the status enum if they don't exist (Postgres-specific)
    try {
      await sequelize.query("ALTER TYPE enum_projects_status ADD VALUE IF NOT EXISTS 'rejected'");
      await sequelize.query("ALTER TYPE enum_projects_status ADD VALUE IF NOT EXISTS 'po'");
      logger.info("✅ Checked and updated projects status ENUM with 'rejected' and 'po'");
    } catch (enumErr) {
      // Ignore errors if the type doesn't exist yet (will be created by sync) or dialect is different
      logger.warn("Could not alter ENUM type directly: " + (enumErr as Error).message);
    }

    await ensureSchemaUpdates();

    // ============================================================
    // AUTO SYNC - This is the magic!
    // ============================================================
    //
    await sequelize.sync();
    // await  sequelize.sync({alter:true})
    // sequelize.sync({force:true})
    //
    // ============================================================

    // if (env.isDevelopment) {
    // ALTER mode: auto-updates columns, adds new ones, adjusts types
    // await sequelize.sync({ alter: true });
    logger.info("✅ Database synced (alter mode - development)");
    // } else {
    //   // Production: only creates missing tables, never alters existing
    //   await sequelize.sync();
    //   logger.info('✅ Database synced (safe mode - production)');
    // }

    // Run seeder (only seeds if tables are empty)
    // await seedDatabase();

    // Start server
    app.listen(env.port, () => {
      logger.info(
        `🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`,
      );
      logger.info(`📋 Health check: http://localhost:${env.port}/api/health`);
    });
  } catch (error) {
    logger.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
