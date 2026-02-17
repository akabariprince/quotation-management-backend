// src/config/database.js
require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: env.isDevelopment ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: env.isProduction ? 20 : 5,
      min: env.isProduction ? 5 : 1,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
  },
};
