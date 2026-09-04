---
name: Frontend Task
about: Propose a new feature or task for the Frontend team
title: 'feat(client/module): <short description>'
labels: frontend, enhancement
assignees: ''
---

## 🎯 Task Overview
Briefly describe the UI/UX feature or client-side logic to be implemented. Which section of the `SRS.docx` does this cover?

## 🔗 API Dependency
- Does this task rely on a Backend API? (Yes/No)
- If Yes, link the Backend Issue here: `#<issue-number>`

## ✅ Frontend Scope (`client/`)
- [ ] Implement UI Components using Tailwind CSS
- [ ] Connect to API using Axios / React Query
- [ ] Handle Loading & Error States appropriately
- [ ] Manage local state / contexts if needed
- [ ] Respect Role-Based Access Control (RBAC) rules on UI elements

## 📂 Files to Touch
Please implement the feature in the following files:
- `client/src/features/<module>/api.ts`
- `client/src/features/<module>/hooks.ts`
- `client/src/features/<module>/components/<ComponentName>.tsx`
- `client/src/App.tsx` *(Add/update routing if necessary)*

## 🧪 Acceptance Criteria
1. 
2. 
