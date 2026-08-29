# API Endpoints

Reference for the **currently implemented** backend endpoints of the Stock Management System.

> **Scope.** This document covers only the modules that exist in `server/src/modules/` and are
> exercised by the integration tests in `server/tests/integration/` (42 tests, all passing).
> Prisma models that have **no** HTTP surface yet are listed in
> [Models without endpoints](#models-without-endpoints) — do not assume routes for them exist.

- **Base URL:** `http://localhost:5000/api` (port from `PORT`, default `5000`)
- **Implemented modules:** `auth`, `users`, `suppliers`, `stock-receiving`, `reports`
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

---

## Suppliers

Module: `server/src/modules/suppliers/`

Allowed roles for management (`POST`, `PUT`, `DELETE`): `ADMINISTRATOR`, `PAO`.  
Allowed roles for viewing (`GET`): All 7 authenticated roles (`ADMINISTRATOR`, `PAO`, `STOREKEEPER`, `STOCK_CLERK`, `ACCOUNTANT`, `DEPARTMENT_HEAD`, `SECURITY_OFFICER`).

### `GET /api/suppliers`

Lists or searches suppliers sorted by name ascending (`name asc`).

**Query parameters** (all optional)

| Param | Type | Notes |
| --- | --- | --- |
| `search` | string | Case-insensitive partial match on `name` or `contactName` |
| `isActive` | boolean | `true` or `false` to filter by active status |

**`200 OK`**

```json
{
  "status": "success",
  "data": [
    {
      "id": "40000000-0000-4000-8000-000000000004",
      "name": "Acme Supplies",
      "contactName": "Amina Ali",
      "phone": "+254700000000",
      "email": "amina@acme.example",
      "address": "Nairobi",
      "isActive": true,
      "createdAt": "2026-08-26T00:00:00.000Z",
      "updatedAt": "2026-08-26T00:00:00.000Z"
    }
  ]
}
```

**Errors:** `400 isActive filter must be boolean`.

### `POST /api/suppliers`

Creates a new supplier record. Requires `ADMINISTRATOR` or `PAO`.

**Request**

```json
{
  "name": "Acme Supplies",
  "contactName": "Amina Ali",
  "phone": "+254700000000",
  "email": "amina@acme.example",
  "address": "Nairobi"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | Required, non-empty |
| `contactName` | string \| null | Optional |
| `phone` | string \| null | Optional |
| `email` | string \| null | Optional, valid email format |
| `address` | string \| null | Optional |

**`201 Created`**

```json
{
  "status": "success",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "name": "Acme Supplies",
    "contactName": "Amina Ali",
    "phone": "+254700000000",
    "email": "amina@acme.example",
    "address": "Nairobi",
    "isActive": true,
    "createdAt": "2026-08-26T00:00:00.000Z",
    "updatedAt": "2026-08-26T00:00:00.000Z"
  }
}
```

**Errors:** `400 Supplier name is required`, `400 A valid email is required`.

### `GET /api/suppliers/:id`

Retrieves details of a specific supplier by ID. `:id` must be a valid UUID.

**`200 OK`**

```json
{
  "status": "success",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "name": "Acme Supplies",
    "contactName": "Amina Ali",
    "phone": "+254700000000",
    "email": "amina@acme.example",
    "address": "Nairobi",
    "isActive": true,
    "createdAt": "2026-08-26T00:00:00.000Z",
    "updatedAt": "2026-08-26T00:00:00.000Z"
  }
}
```

**Errors:** `400 Invalid supplier ID format`, `404 Supplier not found`.

### `PUT /api/suppliers/:id`

Partial update of supplier details. Requires `ADMINISTRATOR` or `PAO`.

**Request** (all fields optional)

```json
{
  "phone": "+254711111111"
}
```

| Field | Rules |
| --- | --- |
| `name` | Must not be empty string if provided |
| `contactName` | String or `null` |
| `phone` | String or `null` |
| `email` | Valid email format or `null` |
| `address` | String or `null` |

**`200 OK`**

```json
{
  "status": "success",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "name": "Acme Supplies",
    "contactName": "Amina Ali",
    "phone": "+254711111111",
    "email": "amina@acme.example",
    "address": "Nairobi",
    "isActive": true,
    "createdAt": "2026-08-26T00:00:00.000Z",
    "updatedAt": "2026-08-26T00:00:00.000Z"
  }
}
```

**Errors:** `400 Invalid supplier ID format`, `400 Supplier name cannot be empty`, `400 A valid email is required`, `404 Supplier not found`.

### `DELETE /api/suppliers/:id`

Deletes or deactivates a supplier record. Requires `ADMINISTRATOR` or `PAO`.

- If the supplier is linked to existing stock transactions or Goods Receiving Notes, it is soft-deactivated (`isActive: false`).
- If no stock history is linked, it is hard-deleted from the database.

**`200 OK` (Hard delete)**

```json
{
  "status": "success",
  "message": "Supplier deleted successfully",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "name": "Acme Supplies",
    "contactName": "Amina Ali",
    "phone": "+254700000000",
    "email": "amina@acme.example",
    "address": "Nairobi",
    "isActive": true,
    "createdAt": "2026-08-26T00:00:00.000Z",
    "updatedAt": "2026-08-26T00:00:00.000Z"
  }
}
```

**`200 OK` (Soft deactivation due to stock history)**

```json
{
  "status": "success",
  "message": "Supplier deactivated because it has stock history",
  "data": {
    "id": "40000000-0000-4000-8000-000000000004",
    "name": "Acme Supplies",
    "contactName": "Amina Ali",
    "phone": "+254700000000",
    "email": "amina@acme.example",
    "address": "Nairobi",
    "isActive": false,
    "createdAt": "2026-08-26T00:00:00.000Z",
    "updatedAt": "2026-08-26T00:00:00.000Z"
  }
}
```

**Errors:** `400 Invalid supplier ID format`, `404 Supplier not found`.

---

## Stock Monitoring

Module: `server/src/modules/stock-monitoring/` — **all routes require authentication** (`STOREKEEPER`, `STOCK_CLERK`, `ACCOUNTANT`, `DEPARTMENT_HEAD`, `PAO`, `ADMINISTRATOR`, `SECURITY_OFFICER`).

The Stock Monitoring API tracks inventory stock levels against configured thresholds (minimum, maximum, reorder, and safety levels) per item. Items are categorized by severity: **critical** (below safety stock, red), **warning** (below reorder level but above safety stock, yellow), and **healthy** (green). This implements Workflow Step 13 ("Monitor Stock Levels Continuously") and SRS Section 3.1 Business Rule: "Reorder levels and safety stock must be maintained to avoid stock shortages."

### `GET /api/stock-monitoring`

Retrieves all inventory items with their current stock levels and categorizes them by severity across all warehouses (or optionally filtered by warehouse).

**Query parameters** (all optional)

| Param | Type | Notes |
| --- | --- | --- |
| `warehouseId` | string | Valid UUID; filters results to a specific warehouse |

**`200 OK`**

```json
{
  "status": "success",
  "data": {
    "critical": [
      {
        "id": "50000000-0000-4000-8000-000000000001",
        "itemCode": "ITEM-001",
        "name": "Printing Paper A4",
        "description": "80gsm white paper",
        "currentStock": 150,
        "minLevel": 200,
        "maxLevel": 1000,
        "reorderLevel": 300,
        "safetyStock": 200,
        "warehouseId": "warehouse-1",
        "status": "critical",
        "severity": "red"
      }
    ],
    "warning": [
      {
        "id": "50000000-0000-4000-8000-000000000002",
        "itemCode": "ITEM-002",
        "name": "Ballpoint Pens",
        "description": "Blue ballpoint pens",
        "currentStock": 250,
        "minLevel": 100,
        "maxLevel": 500,
        "reorderLevel": 300,
        "safetyStock": 200,
        "warehouseId": "warehouse-1",
        "status": "warning",
        "severity": "yellow"
      }
    ],
    "healthy": [
      {
        "id": "50000000-0000-4000-8000-000000000003",
        "itemCode": "ITEM-003",
        "name": "Folders",
        "description": "A4 manila folders",
        "currentStock": 800,
        "minLevel": 100,
        "maxLevel": 1000,
        "reorderLevel": 300,
        "safetyStock": 200,
        "warehouseId": "warehouse-1",
        "status": "healthy",
        "severity": "green"
      }
    ],
    "summary": {
      "totalItems": 3,
      "criticalCount": 1,
      "warningCount": 1,
      "healthyCount": 1
    }
  }
}
```

**Response Fields**

- **`critical`** — Items with `currentStock < safetyStock` (danger level)
- **`warning`** — Items with `safetyStock ≤ currentStock < reorderLevel` (alert level)
- **`healthy`** — Items with `currentStock ≥ reorderLevel` (normal operation)
- **`summary`** — Aggregate counts for dashboard/dashboard oversight

| Field | Type | Meaning |
| --- | --- | --- |
| `itemCode` | string | Unique inventory item identifier |
| `currentStock` | integer | Actual quantity on hand (from BinCard) |
| `minLevel` | integer | Absolute minimum to maintain |
| `maxLevel` | integer | Capacity/re-order threshold |
| `reorderLevel` | integer | Trigger point to place new order |
| `safetyStock` | integer | Minimum safety buffer to avoid stockout |
| `status` | enum | `'critical'` \| `'warning'` \| `'healthy'` |
| `severity` | enum | `'red'` \| `'yellow'` \| `'green'` |

**Errors**

| Status | Message | Cause |
| --- | --- | --- |
| `400` | `warehouseId must be a valid UUID` | `warehouseId` provided but not a valid UUID |
| `401` | `Authentication required` | Missing or invalid bearer token |

---

### `GET /api/stock-monitoring/:itemId`

Retrieves the stock level details for a specific inventory item.

**Path parameters**

| Param | Type | Notes |
| --- | --- | --- |
| `itemId` | string | Valid UUID of the inventory item |

**Query parameters** (all optional)

| Param | Type | Notes |
| --- | --- | --- |
| `warehouseId` | string | Valid UUID; if provided, verifies the item exists in that warehouse |

**`200 OK`**

```json
{
  "status": "success",
  "data": {
    "id": "50000000-0000-4000-8000-000000000001",
    "itemCode": "ITEM-001",
    "name": "Printing Paper A4",
    "description": "80gsm white paper",
    "currentStock": 150,
    "minLevel": 200,
    "maxLevel": 1000,
    "reorderLevel": 300,
    "safetyStock": 200,
    "warehouseId": "warehouse-1",
    "status": "critical",
    "severity": "red"
  }
}
```

**Errors**

| Status | Message | Cause |
| --- | --- | --- |
| `400` | `warehouseId must be a valid UUID` | `warehouseId` provided but not a valid UUID |
| `401` | `Authentication required` | Missing or invalid bearer token |
| `404` | `Item not found` | Item with the given `itemId` does not exist |
| `404` | `Item does not exist in the specified warehouse` | Item exists but not in the provided warehouse |
