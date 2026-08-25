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

## Initial Setup: Creating the First Administrator

Because all User management endpoints require an `ADMINISTRATOR` token, you must manually seed or create your first administrator account directly using Prisma. 

### Step 1: Generate a Valid Bcrypt Password Hash
Do **not** type plain text passwords into your database, or login verification will fail. Open your system terminal and run this command to generate a valid hash:
```bash
node -e "console.log(require('bcrypt').hashSync('password123', 10))"
```
*This will output a secure string starting with `$2b$10$...`*

### Step 2: Insert the Record via Prisma Studio
1. Run `npx prisma studio` in your server directory.
2. Open the **User** model data grid layout.
3. Click **Add Record** and populate the fields precisely:
   * **id:** *Leave blank (database auto-generates UUID)*
   * **email:** `admin@example.com`
   * **passwordHash:** *Paste the exact `$2b$10$...` string generated in Step 1*
   * **firstName:** `Ada`
   * **lastName:** `Admin`
   * **role:** `ADMINISTRATOR`
   * **department:** `null` (or any text string)
4. Click the green **Save 1 Change** button at the top bar. You can now use these credentials to log in via Thunder Client and get your Bearer Token.

---

## Conventions

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
  "password": "password123"
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
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

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
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `400 User with this email already exists`, `400 Password must be at least 6 characters`, `400 Invalid role specified`.

### `GET /api/users/:id`

`:id` must be a valid UUID string.

**`200 OK`**
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
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `404 User not found`.

### `PUT /api/users/:id`

Partial update — send only the fields you want changed. A **role change** writes a
`USER_ROLE_CHANGED` audit entry recording `previousRole` and `newRole`.

**Request** (all fields optional)

```json
{ 
  "role": "PAO" 
}
```

| Field | Rules |
| --- | --- |
| `email` | Valid email, normalized, must not collide with another user |
| `password` | Min 6 characters; re-hashed automatically with bcrypt |
| `firstName` / `lastName` | Non-empty text strings if provided |
| `role` | One of the seven enum system roles |
| `department` | String description or `null` |

**`200 OK`**
```json
{ 
  "status": "success", 
  "data": { "id": "40000000-...", "role": "PAO", "...": "..." } 
}
```

### `DELETE /api/users/:id`

**Hard Delete** — Permanently purges the designated user record from the PostgreSQL relational tables. Writes a `USER_DEACTIVATED` audit log fallback tracking entry context before execution.

**`200 OK`**

```json
{
  "status": "success",
  "message": "User deleted successfully",
  "data": {
    "id": "30000000-0000-4000-8000-000000000003",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STOREKEEPER",
    "department": "Warehouse",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-24T19:45:00.000Z"
  }
}
```
**Errors:** `404 User not found`.
