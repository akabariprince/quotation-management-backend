// src/scripts/sync.ts
import sequelize from '../config/sequelize';
import '../models';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

const sync = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connected to database');

    const syncOption = process.env.DB_SYNC === 'force'
      ? { force: true }
      : process.env.DB_SYNC === 'alter'
        ? { alter: true }
        : {};

    await sequelize.sync(syncOption);
    logger.info(`✅ Database synced (${process.env.DB_SYNC || 'default'} mode)`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Sync failed:', error);
    process.exit(1);
  }
};

sync();