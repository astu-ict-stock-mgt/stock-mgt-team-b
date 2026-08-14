# Stock Management System 📦

> **A production-ready monorepo for a comprehensive web-based Stock Management System.**

This system automates inventory management operations—replacing paper-based bin cards and manual tracking with a robust computerized solution. It covers the full lifecycle of stock management including requisitions, approvals, receiving, storage, issuing, transfers, physical stock taking, and FIFO valuation. 

This repository uses a **monorepo structure** containing both the backend and frontend applications.

---

## 🏗 Architecture & Tech Stack

The project is split into two main directories: `server/` and `client/`. 

### 1. Backend (`server/`)
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript (`ESM`, executed via `tsx`)
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **Key Modules:** JWT-based Auth (Role-Based Access Control), bcrypt, express-validator

### 2. Frontend (`client/`)
- **Library:** React (JavaScript/JSX, *not* TypeScript)
- **Tooling:** Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router
- **Data Fetching:** React Query (TanStack) & Axios

---

## 📂 Project Structure

Both the backend and frontend are structured around **12 core business modules** to keep code modular, maintainable, and aligned with the domain workflow:

1. `auth`
2. `users`
3. `suppliers`
4. `inventory` *(includes complex FIFO valuation logic)*
5. `stock-receiving`
6. `stock-issuing`
7. `stock-transfer`
8. `stock-taking`
9. `stock-monitoring`
10. `damaged-obsolete`
11. `reports`
12. `audit-log`

*Backend modules are located in `server/src/modules/`.*
*Frontend features are located in `client/src/features/`.*

---

## 🤖 For AI Agents

If you are an AI agent or a developer leveraging AI coding assistants, you **MUST** read [AGENTS.md](./AGENTS.md) before interacting with this codebase. 

The `AGENTS.md` file outlines strict architectural boundaries, technology choices, testing expectations, and Prisma/Express conventions that must be adhered to.

---

## 👥 For Team Members (Contributing)

If you are a human contributor, please familiarize yourself with the development workflow and rules outlined in [CONTRIBUTING.md](./CONTRIBUTING.md).

**Key Takeaways:**
- **Branching:** `main` and `dev` are protected. Base all feature branches off `dev` using the format `feature/<module>-<short-desc>`.
- **Commits:** We follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
- **PRs:** All code must be submitted via Pull Requests against `develop`.

---

## 📚 Documentation & Source of Truth

The business logic and system requirements are derived from official documentation. Do not guess implementation details from folder names alone. 

Always consult the source of truth documents in the `docs/` folder:
- **[SRS.docx](./docs/SRS.docx):** The Software Requirements Specification (Primary Source of Truth).
- **[Stock_Management_Workflow.pdf](./docs/Stock_Management_Workflow.pdf):** Visual end-to-end workflow representation.
- **[prisma-schema-notes.md](./docs/prisma-schema-notes.md):** Guidelines for the database schema models.

---

## 🚀 Getting Started

Follow these steps to run the project locally. 

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 1. Database Setup
Ensure PostgreSQL is running and create an empty database (e.g., `stock_mgt`).

### 2. Backend Setup
Navigate to the `server/` directory and start the Express server.

```bash
cd server
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env and update DATABASE_URL with your PostgreSQL connection string

# Generate Prisma Client and apply migrations (Note: schema needs to be defined first)
npm run prisma:generate
# npm run prisma:migrate 

# Start the dev server
npm run dev
```

### 3. Frontend Setup
Navigate to the `client/` directory and start the Vite development server.

```bash
cd client
npm install

# Start the dev server (proxies API requests to the backend)
npm run dev
```

The frontend will typically be accessible at `http://localhost:5173` and the backend API at `http://localhost:5000`.

---

## 🧪 Testing

The backend uses **Jest** and **Supertest** for unit and integration testing. We expect at least one integration test for every new module created.

```bash
cd server
npm test
```

## ✨ Code Quality & Linting

Both projects have ESLint and Prettier configured. Ensure your code passes before submitting a Pull Request. CI will enforce this on GitHub.

```bash
# Backend linting and type-checking
cd server
npm run lint
npm run typecheck

# Frontend linting and formatting
cd client
npm run lint
npm run format
```
