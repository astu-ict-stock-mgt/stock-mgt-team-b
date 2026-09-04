---
name: Backend Task
about: Propose a new API, database schema, or service for the Backend team
title: 'feat(server/module): <short description>'
labels: backend, enhancement
assignees: ''
---

## 🎯 Task Overview
Briefly describe the backend API, service, or database change to be implemented. Which section of the `SRS.docx` does this cover?

## 🔗 Frontend Dependency
- Does this block a Frontend Task? (Yes/No)
- If Yes, link the Frontend Issue here: `#<issue-number>`

## ✅ Backend Scope (`server/`)
- [ ] Update Prisma schema & run migrations (if required)
- [ ] Create/Update API Routes & Controllers
- [ ] Implement Business Logic in Services
- [ ] Add Input Validation (express-validator)
- [ ] Enforce Role-Based Access Control (RBAC) Middleware
- [ ] Write at least one Integration Test (Supertest)

## 📂 Files to Touch
Please implement the feature in the following files:
- `server/prisma/schema.prisma` *(if DB changes are needed)*
- `server/src/modules/<module>/routes.ts`
- `server/src/modules/<module>/controller.ts`
- `server/src/modules/<module>/validation.ts`
- `server/src/modules/<module>/service.ts`
- `server/tests/integration/<module>.test.ts`

## 🧪 Acceptance Criteria
1. 
2. 
