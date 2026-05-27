# Ecstatics Quotation Management System - Backend

This is the core API server for the **Ecstatics Quotation Management System**. It provides a secure, robust, and scalable foundation for managing the entire quotation lifecycle, built with Node.js, TypeScript, and PostgreSQL.

## 🚀 Getting Started

Follow these steps to set up and run the backend server locally:

### Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **Package Manager**: NPM (v9+)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd quotation-management-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Database Configuration
1. Create a PostgreSQL database (e.g., `ecstatics_db`).
2. Create a `.env` file in the root of this directory based on the provided `.env.example` (or existing `.env`).
3. Set your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=ecstatics_db
   ```
4. Sync the database schema and seed initial data:
   ```bash
   # Create tables
   npm run db:sync

   # (Optional) Seed initial data like roles and admin users
   npm run db:seed
   ```

### Running the Server
Start the development server with live reload:
```bash
npm run dev
```
The server will typically start at [http://localhost:5000](http://localhost:5000).

---

## 🛠 Tech Stack

- **Runtime**: Node.js with [TypeScript](https://www.typescriptlang.org/)
- **Web Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Sequelize](https://sequelize.org/) for schema management and migrations.
- **Authentication**: JWT (Access + Refresh Tokens) with [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing.
- **Validation**: [Zod](https://zod.dev/) for request body and environment validation.
- **File Handling**: [Multer](https://github.com/expressjs/multer) for managing file uploads.
- **Email**: [Nodemailer](https://nodemailer.com/) for sending system notifications.
- **Logging**: [Winston](https://github.com/winstonjs/winston) and [Morgan](https://github.com/expressjs/morgan).
- **Security**: 
  - [Helmet](https://helmetjs.github.io/) for secure HTTP headers.
  - CORS configuration.
  - Rate limiting with `express-rate-limit`.
  - XSS and HPP protection.

---

## 🏗 Project Architecture

The backend follows a modular architecture for better maintainability:

- `src/modules`: Contains domain-specific logic (Auth, Users, Quotations, Customers, etc.). Each module typically has its own controllers, routes, and services.
- `src/models`: Sequelize model definitions for the database tables.
- `src/middleware`: Custom Express middlewares (Auth guards, Error handlers, Validation).
- `src/services`: Shared business logic and external integrations (Email, PDF generation).
- `src/utils`: Reusable helper functions and constant definitions.
- `src/config`: Configuration files for the database, passport, and other libraries.

---

## 🔑 Default Credentials

For testing and demonstration, the following accounts are typically seeded (all passwords are `password123`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@esipl.in` | `password123` |
| **Master** | `master@esipl.in` | `password123` |
| **Creator** | `creator@esipl.in` | `password123` |
| **Data Entry** | `dataentry@esipl.in` | `password123` |

---

## 📝 Handover Notes

- **Migrations**: Always use `npm run db:sync` when changing models to keep the database in sync.
- **Environment Variables**: Make sure to configure all keys in `.env`, especially the `JWT_SECRET` and `EMAIL_CONFIG`.
- **API Documentation**: You can find a Postman collection (`postman.json`) in the root directory to help with API testing and integration.
- **Puppeteer**: The system uses Puppeteer for some automation tasks; ensure the environment supports headless browser execution.

---

Feel free to reach out if you have any questions regarding the backend architecture or deployment process!



Then manually add the missing column

Open PostgreSQL and run:

ALTER TABLE "project_items"
ADD COLUMN "projectId" UUID;

Then:

ALTER TABLE "project_items"
ADD CONSTRAINT "project_items_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "projects"("id")
ON DELETE CASCADE;