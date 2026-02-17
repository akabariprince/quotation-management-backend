// src/scripts/seed.ts
import { seedDatabase } from '@/database/seeders/seeder';
import sequelize from '../config/sequelize';
import '../models';
import { logger } from '../utils/logger';

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedDatabase();
    logger.info('✅ Seeding complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();