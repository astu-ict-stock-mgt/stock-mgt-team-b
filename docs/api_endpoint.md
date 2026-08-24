# API Endpoints

Reference for the **currently implemented** backend endpoints of the Stock Management System.

> **Scope.** This document covers only the modules that exist in `server/src/modules/` and are
> exercised by the integration tests in `server/tests/integration/` (42 tests, all passing).
> Prisma models that have **no** HTTP surface yet are listed in
> [Models without endpoints](#models-without-endpoints) — do not assume routes for them exist.

- **Base URL:** `http://localhost:5000/api` (port from `PORT`, default `5000`)
- **Implemented modules:** `auth`, `users`, `stock-receiving`, `reports`
- **Source of truth:** `server/src/routes/index.ts` (route aggregation), `server/src/app.ts`

---

## Conventions

### Response envelope

Most endpoints wrap their payload:

```json
{ "status": "success", "data": { } }
```

**Four endpoints deliberately do not use this envelope** — see their sections for details:

| Endpoint | Body shape |
| --- | --- |
| `GET /api/health` | `{ "status": "ok", "message": "..." }` |
| `POST /api/auth/login` | `{ "token": "...", "user": { } }` (bare) |
| `GET /api/reports/export?format=csv` | raw `text/csv` |
| `GET /api/reports/export?format=json` | bare report object |

### Error envelope

Every error flows through `errorHandler` (`server/src/middlewares/errorHandler.ts`):

```json
{ "status": "error", "message": "Invalid email or password" }
```

| Status | Meaning |
| --- | --- |
| `400` | Validation failure (`express-validator`) or a business rule rejection |
| `401` | Missing, malformed, or expired bearer token / bad credentials |
| `403` | Authenticated but the role is not permitted on this route |
| `404` | Resource not found, or unknown route (`{"status":"error","message":"Route not found"}`) |
| `500` | Unhandled error (e.g. `JWT_SECRET`/`DATABASE_URL` not configured) |

Validation returns **only the first error message**, not an array of all failures.

### Authentication

All routes except `GET /api/health` and `POST /api/auth/login` require:

```http
Authorization: Bearer <token>
```

The JWT is signed with `JWT_SECRET`, expires in **1 hour**, and carries:

```json
{ "sub": "<userId>", "email": "<email>", "role": "<Role>" }
```

A token whose `role` is not one of the seven known roles is rejected with `401`.

### Roles

`ADMINISTRATOR` · `PAO` · `STOREKEEPER` · `STOCK_CLERK` · `ACCOUNTANT` · `DEPARTMENT_HEAD` · `SECURITY_OFFICER`

### Dates

All `DateTime` fields serialize as ISO-8601 UTC strings, e.g. `"2026-02-01T10:00:00.000Z"`.

---

## Endpoint index

| Method | Path | Allowed roles | Backing model(s) |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | — |
| `POST` | `/api/auth/login` | public | `User` |
| `GET` | `/api/users` | `ADMINISTRATOR` | `User` |
| `POST` | `/api/users` | `ADMINISTRATOR` | `User`, `AuditLog` |
| `GET` | `/api/users/:id` | `ADMINISTRATOR` | `User` |
| `PUT` | `/api/users/:id` | `ADMINISTRATOR` | `User`, `AuditLog` |
| `DELETE` | `/api/users/:id` | `ADMINISTRATOR` | `User`, `AuditLog` |
| `POST` | `/api/stock-receiving` | `STOREKEEPER`, `STOCK_CLERK`, `PAO` | `GoodsReceivingNote`, `GoodsReceivingNoteItem`, `StockLot`, `StockTransaction`, `BinCard`, `InventoryItem` |
| `GET` | `/api/reports/summary` | reporting roles¹ | `StockTransaction`, `InventoryItem`, `StockLot`, `Supplier` |
| `GET` | `/api/reports/stock-movement` | reporting roles¹ | `StockTransaction` |
| `GET` | `/api/reports/receiving` | reporting roles¹ | `StockTransaction` |
| `GET` | `/api/reports/issuing` | reporting roles¹ | `StockTransaction` |
| `GET` | `/api/reports/valuation` | reporting roles¹ | `InventoryItem`, `StockLot` |
| `GET` | `/api/reports/suppliers` | reporting roles¹ | `Supplier`, `StockTransaction` |
| `GET` | `/api/reports/stock-status` | reporting roles¹ | `InventoryItem`, `BinCard` |
| `GET` | `/api/reports/analytics/category-movements` | reporting roles¹ | `StockTransaction`, `Category` |
| `GET` | `/api/reports/analytics/warehouse-movements` | reporting roles¹ | `Warehouse`, `StockTransaction`, `StockLot` |
| `GET` | `/api/reports/analytics/monthly-trends` | reporting roles¹ | `StockTransaction` |
| `GET` | `/api/reports/analytics/top-issued-items` | reporting roles¹ | `StockTransaction` |
| `GET` | `/api/reports/analytics/category-valuation` | reporting roles¹ | `Category`, `StockLot` |
| `GET` | `/api/reports/export` | reporting roles¹ | varies by `type` |
| `POST` | `/api/reports` | reporting roles¹ | `Report`, `AuditLog` |
| `GET` | `/api/reports/history` | reporting roles¹ | `Report` |
| `GET` | `/api/reports/history/:id` | reporting roles¹ | `Report` |

¹ **reporting roles** = `ADMINISTRATOR`, `PAO`, `STOREKEEPER`, `STOCK_CLERK`, `ACCOUNTANT`, `DEPARTMENT_HEAD`.
`SECURITY_OFFICER` is **excluded** from every `/api/reports/*` route (`403`).

---

## Health

### `GET /api/health`

Liveness probe. No auth.

**`200 OK`**

```json
{ "status": "ok", "message": "API is running" }
```

---

## Auth

Module: `server/src/modules/auth/`

### `POST /api/auth/login`

Authenticates by email + password and returns a signed JWT. No auth required.

**Request**

```json
{
  "email": "admin@example.com",
  "password": "correct-horse-battery-staple"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Required, must be a valid email. **Normalized** (lowercased) before lookup |
| `password` | string | Required, non-empty |

**`200 OK`** — note the bare body: there is **no** `status`/`data` wrapper.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "30000000-0000-4000-8000-000000000003",
    "email": "admin@example.com",
    "firstName": "Ada",
    "lastName": "Admin",
    "role": "ADMINISTRATOR",
    "department": null
  }
}
```

`passwordHash` is never returned.

**Errors**

| Status | Message | Cause |
| --- | --- | --- |
| `400` | `A valid email is required` | `email` missing or malformed |
| `400` | `Password is required` | `password` missing or empty |
| `401` | `Invalid email or password` | Unknown email **or** wrong password (deliberately indistinguishable) |
| `500` | `JWT_SECRET must be configured` | Env var absent |

> Login does **not** currently check `isActive`; a deactivated user can still obtain a token.

---

## Users

Module: `server/src/modules/users/` — **all routes require `ADMINISTRATOR`.**

`passwordHash` is stripped from every response. Passwords are hashed with bcrypt (cost 10).

### `GET /api/users`

Lists users, newest first (`createdAt desc`).

**Query parameters** (all optional)

| Param | Type | Notes |
| --- | --- | --- |
| `role` | enum | Must be a valid role, else `400 Invalid role filter` |
| `isActive` | boolean | `"true"` / `"false"`, else `400 isActive filter must be boolean` |
| `search` | string | Case-insensitive partial match on `firstName`, `lastName`, or `email` |

**`200 OK`**

```json
{
  "status": "success",
  "data": [
    {
      "id": "30000000-0000-4000-8000-000000000003",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STOREKEEPER",
      "department": "Warehouse",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

There is no pagination — the full filtered set is returned.

### `POST /api/users`

Creates a user and writes a `USER_CREATED` audit log entry.

**Request**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "PAO",
  "department": "Property Admin"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Required, valid email, normalized, must be unique |
| `password` | string | Required, **min 6 characters** |
| `firstName` | string | Required, non-empty |
| `lastName` | string | Required, non-empty |
| `role` | enum | Required, one of the seven roles |
| `department` | string \| null | Optional; defaults to `null` |

`isActive` is always `true` on creation and cannot be set here.

**`201 Created`**

```json
{
  "status": "success",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "PAO",
    "department": "Property Admin",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `400 User with this email already exists`, `400 Password must be at least 6 characters`, `400 Invalid role specified`, `400 First name is required`, `400 Last name is required`.

### `GET /api/users/:id`

`:id` must be a UUID.

**`200 OK`** — `{ "status": "success", "data": { <user object> } }`

**Errors:** `400 Invalid user ID format`, `404 User not found`.

### `PUT /api/users/:id`

Partial update — send only the fields you want changed. A **role change** writes a
`USER_ROLE_CHANGED` audit entry recording `previousRole` and `newRole`.

**Request** (all fields optional)

```json
{ "role": "PAO" }
```

| Field | Rules |
| --- | --- |
| `email` | Valid email, normalized, must not collide with another user |
| `password` | Min 6 characters; re-hashed with bcrypt |
| `firstName` / `lastName` | Non-empty if present |
| `role` | One of the seven roles |
| `department` | String or `null` |
| `isActive` | Boolean — this is how a user is **re**activated |

**`200 OK`** — `{ "status": "success", "data": { <updated user object> } }`

**Errors:** `400 Invalid user ID format`, `400 User with this email already exists`, `400 Invalid role specified`, `404 User not found`.

### `DELETE /api/users/:id`

**Soft delete** — sets `isActive: false` to preserve foreign-key integrity with
`StockTransaction`, `AuditLog`, `Report`, and `GoodsReceivingNote`. The row is never removed.
Writes a `USER_DEACTIVATED` audit entry. Reactivate via `PUT` with `{"isActive": true}`.

**`200 OK`** — this response carries an extra `message` field:

```json
{
  "status": "success",
  "message": "User deactivated successfully",
  "data": {
    "id": "30000000-0000-4000-8000-000000000003",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STOREKEEPER",
    "department": "Warehouse",
    "isActive": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `400 Invalid user ID format`, `404 User not found`.

---
