# AGENTS.md — Stock Management System

## Project summary

The Stock Management System is a web-based application that automates inventory management for an organization, replacing paper-based bin cards, stock records, and manual calculations. It covers the full stock lifecycle — requisition, approval, receiving, inspection, storage, issuing, transfers, monitoring, stock taking, reconciliation, damaged/obsolete handling, FIFO valuation, reporting, and audit logging — with role-based access control across 7 roles (Administrator, PAO, Storekeeper, Stock Clerk, Accountant, Department Head, Security Officer).

This monorepo contains a `server/` (Node.js + Express + Prisma + PostgreSQL) and a `client/` (React + Vite + Tailwind CSS) application. **The authoritative requirements are `docs/SRS.docx` and `docs/Stock_Management_Workflow.pdf` — read them before implementing anything.**

## Tech stack

- **Backend:** Node.js + Express, **TypeScript** (ESM, run with `tsx`), Prisma ORM, PostgreSQL
- **Frontend:** React **TypeScript** (TSX), Vite, Tailwind CSS v4, React Router, React Query, Axios
- **Auth:** JWT-based, role-based access control (RBAC)
- **Validation:** express-validator (server), React Hook Form optional (client)
- **Testing:** Jest + Supertest (server integration tests)
- **Tooling:** ESLint + Prettier (client: includes prettier-plugin-tailwindcss), ESLint + typescript-eslint (server)

## Folder structure convention

- **Backend modules:** `server/src/modules/<module>/` containing `controller.ts`, `service.ts`, `routes.ts`, and `validation.ts` files (colocated per module).
- **Frontend features:** `client/src/features/<feature>/` containing `api.ts`, `hooks.ts`, and `components/` (colocated per feature).
- Shared server concerns live under `server/src/{middlewares,routes,utils,config}`; route aggregation happens in `server/src/routes/index.ts`.
- **The 12 modules to implement:** `auth`, `users`, `suppliers`, `inventory`, `stock-receiving`, `stock-issuing`, `stock-transfer`, `stock-taking`, `reports`, `audit-log`, `stock-monitoring`, `damaged-obsolete`.

## Branching rules

- `main` and `develop` are **protected** — no direct pushes, no force-pushes.
- All work happens on `feature/<module>-<short-desc>` branches **branched from `develop`**.
- Every feature ships via a **pull request** into `develop`; merges to `main` happen from `develop` only.
- See `CONTRIBUTING.md` for branch naming and commit conventions.

## Coding conventions

- **Frontend is TypeScript** (TSX). **Backend is TypeScript** (ESM, `"type": "module"`, imports use relative `.ts` extensions).
- **Prisma is the only DB access layer** — no raw SQL unless justified and documented.
- **All input validation** uses express-validator (or zod) in module `validation` files; never trust raw request bodies.
- **Consistent error-handling middleware:** extend/reuse `server/src/middlewares/errorHandler.ts` (`AppError` + `errorHandler` + `notFoundHandler`); never write ad-hoc inline error responses.
- **RBAC middleware is applied per route**; every authenticated route must declare its allowed roles. Roles: `ADMINISTRATOR`, `PAO`, `STOREKEEPER`, `STOCK_CLERK`, `ACCOUNTANT`, `DEPARTMENT_HEAD`, `SECURITY_OFFICER`.
- No comments unless they explain non-obvious decisions; follow the surrounding code style.

## FIFO valuation (critical module)

The SRS mandates **First-In-First-Out (FIFO) inventory valuation**. This logic lives inside the `inventory` module and is the highest-risk piece of business logic in the system: stock transaction records must retain the fields needed for FIFO (received date, unit cost, quantity) and issues must be valued against the oldest received lots first. **Treat this as a dedicated, carefully-tested implementation** — require dedicated FIFO tests (cost layering, partial consumption, negative-balance prevention) before a PR is considered done.

## Testing expectation

- **Every new module needs at least one integration test** (Supertest against the Express app) before its PR is considered done — see `server/tests/integration/`.
- Run `npm test` (server) and `npm run lint` / `npm run typecheck` (server) and `npm run lint` (client) before pushing.
- CI runs lint + tests on every PR (see `.github/workflows/ci.yml`).

## Before implementing any module

**Re-read the relevant section of `docs/SRS.docx` and `docs/Stock_Management_Workflow.pdf` for that module's exact requirements.** Do not infer behavior from the folder name alone. If the SRS is ambiguous or internally inconsistent on a requirement, flag it in the issue/PR rather than guessing.

## Local development

```bash
# Server
cd server && npm install && cp .env.example .env && npm run prisma:generate && npm run dev   # :5000

# Client
cd client && npm install && npm run dev   # :5173 (proxies /api to the server)
```
