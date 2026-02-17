// src/scripts/sync.ts
import sequelize from '../config/sequelize';
import '../models';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

const sync = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connected to database');

    const syncOption = env.db.sync === 'force'
      ? { force: true }
      : env.db.sync === 'alter'
        ? { alter: true }
        : {};

    await sequelize.sync(syncOption);
    logger.info(`✅ Database synced (${env.db.sync} mode)`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Sync failed:', error);
    process.exit(1);
  }
};

sync();